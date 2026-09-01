import { buildApp } from './app.js'
import { createConfig } from './config.js'

const config = createConfig()
const app = await buildApp({ config })
try {
  await app.listen({ host: config.host, port: config.port })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
