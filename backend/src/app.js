import Fastify from 'fastify'
import cors from '@fastify/cors'
import { createConfig } from './config.js'
import { DataRepository } from './data-repository.js'
import { UpdatePipeline } from './update-pipeline.js'

export async function buildApp(options = {}) {
  const config = options.config ?? createConfig()
  const app = Fastify({ logger: options.logger ?? true })
  await app.register(cors, { origin: true })
  const repository = options.repository ?? new DataRepository(config.outputFile)
  await repository.load()
  const updater = options.updater ?? new UpdatePipeline(config, repository)
  await updater.initialise()

  app.get('/api/regional-access', async () => repository.get())
  app.get('/api/regional-access/status', async () => updater.getStatus())
  app.decorate('regionalUpdater', updater)
  app.decorate('regionalRepository', repository)

  if (options.startScheduler !== false) {
    let timer
    let closed = false
    const scheduleNext = () => {
      if (closed) return
      timer = setTimeout(async () => {
        try {
          await updater.run('scheduled')
        } catch (error) {
          app.log.error(error, 'Failed to persist scheduled update status')
        } finally {
          scheduleNext()
        }
      }, config.checkIntervalMs)
      timer.unref()
    }
    app.addHook('onReady', async () => {
      void updater.run('startup')
        .catch((error) => app.log.error(error, 'Failed to persist startup update status'))
        .finally(scheduleNext)
    })
    app.addHook('onClose', async () => {
      closed = true
      clearTimeout(timer)
    })
  }
  return app
}
