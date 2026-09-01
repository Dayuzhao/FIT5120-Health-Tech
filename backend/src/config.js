import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = resolve(backendRoot, '..')

function positiveNumber(value, fallback, name) {
  const result = value === undefined ? fallback : Number(value)
  if (!Number.isFinite(result) || result <= 0) throw new Error(`${name} must be a positive number`)
  return result
}

function portNumber(value) {
  const port = positiveNumber(value, 3000, 'PORT')
  if (!Number.isInteger(port) || port > 65535) throw new Error('PORT must be an integer from 1 to 65535')
  return port
}

function timerNumber(value) {
  const timer = positiveNumber(value, 7 * 24 * 60 * 60 * 1000, 'AIHW_CHECK_INTERVAL_MS')
  if (timer > 2_147_483_647) throw new Error('AIHW_CHECK_INTERVAL_MS exceeds the Node.js timer limit')
  return timer
}

export function createConfig(env = process.env) {
  return {
    host: env.HOST || '0.0.0.0',
    port: portNumber(env.PORT),
    checkIntervalMs: timerNumber(env.AIHW_CHECK_INTERVAL_MS),
    requestTimeoutMs: positiveNumber(env.AIHW_REQUEST_TIMEOUT_MS, 30_000, 'AIHW_REQUEST_TIMEOUT_MS'),
    maxDownloadBytes: positiveNumber(env.AIHW_MAX_DOWNLOAD_BYTES, 20 * 1024 * 1024, 'AIHW_MAX_DOWNLOAD_BYTES'),
    searchUrl: 'https://www.aihw.gov.au/api/search/all-downloadable-resources',
    aihwBaseUrl: 'https://www.aihw.gov.au',
    pipelineRoot: join(projectRoot, 'data-pipeline'),
    inputDir: join(projectRoot, 'data-pipeline', 'input'),
    outputFile: join(projectRoot, 'data-pipeline', 'output', 'regional-access.json'),
    buildScript: join(projectRoot, 'data-pipeline', 'src', 'build-aihw.js'),
    statusFile: join(backendRoot, 'data', 'update-status.json'),
  }
}
