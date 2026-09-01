import { createReadStream, createWriteStream } from 'node:fs'
import { access, copyFile, mkdir, readdir, rename, rm } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline as streamPipeline } from 'node:stream/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { randomUUID } from 'node:crypto'
import { findLatestDataset } from './aihw-client.js'
import { readJson, writeJsonAtomic } from './json-store.js'
import { normaliseYear, validateRegionalData, yearNumber } from './validate.js'

const execFileAsync = promisify(execFile)
const ZIP_PATTERN = /medicare.*mental.*health.*\.zip$/i

function serialiseError(error) {
  return { message: error.message, name: error.name, at: new Date().toISOString() }
}

export class UpdatePipeline {
  constructor(config, repository, dependencies = {}) {
    this.config = config
    this.repository = repository
    this.fetchImpl = dependencies.fetchImpl ?? fetch
    this.execFileImpl = dependencies.execFileImpl ?? execFileAsync
    this.findLatestImpl = dependencies.findLatestImpl ?? findLatestDataset
    this.inFlight = null
    this.status = {
      state: 'idle',
      running: false,
      lastCheckStartedAt: null,
      lastCheckCompletedAt: null,
      lastSuccessfulCheckAt: null,
      latestRemoteDataset: null,
      updateApplied: false,
      error: null,
    }
  }

  async initialise() {
    const saved = await readJson(this.config.statusFile, null)
    if (saved) this.status = { ...this.status, ...saved, state: 'idle', running: false }
  }

  getStatus() {
    return { ...this.status }
  }

  run(trigger = 'manual') {
    if (this.inFlight) return this.inFlight
    this.inFlight = this.#run(trigger).finally(() => { this.inFlight = null })
    return this.inFlight
  }

  async #run(trigger) {
    const startedAt = new Date().toISOString()
    this.status = { ...this.status, state: 'checking', running: true, trigger,
      lastCheckStartedAt: startedAt, updateApplied: false, error: null }
    try {
      const current = this.repository.get()
      const previousRemote = this.status.latestRemoteDataset
      const latest = await this.findLatestImpl({
        fetchImpl: this.fetchImpl,
        searchUrl: this.config.searchUrl,
        baseUrl: this.config.aihwBaseUrl,
        timeoutMs: this.config.requestTimeoutMs,
      })
      this.status.latestRemoteDataset = latest
      const newerYear = yearNumber(latest.financialYear) > yearNumber(current.financialYear)
      const revisedCurrentYear = yearNumber(latest.financialYear) === yearNumber(current.financialYear)
        && previousRemote?.financialYear === latest.financialYear
        && previousRemote.downloadUrl
        && previousRemote.downloadUrl !== latest.downloadUrl
      const needsUpdate = newerYear || revisedCurrentYear
      if (yearNumber(latest.financialYear) < yearNumber(current.financialYear)) {
        throw new Error('AIHW search result is older than the local dataset')
      }
      if (needsUpdate) {
        this.status = { ...this.status, state: 'updating', updateReason: newerYear ? 'new-financial-year' : 'revised-download' }
        await this.#downloadAndBuild(latest)
        this.status.updateApplied = true
      } else {
        this.status.updateReason = null
      }
      const completedAt = new Date().toISOString()
      this.status = { ...this.status, state: 'idle', running: false,
        lastCheckCompletedAt: completedAt, lastSuccessfulCheckAt: completedAt, error: null }
    } catch (error) {
      this.status = { ...this.status, state: 'error', running: false,
        lastCheckCompletedAt: new Date().toISOString(), error: serialiseError(error) }
    }
    await writeJsonAtomic(this.config.statusFile, this.status)
    return this.getStatus()
  }

  async #downloadAndBuild(latest) {
    await mkdir(this.config.inputDir, { recursive: true })
    const transactionId = randomUUID()
    const stagingPath = join(this.config.inputDir, `.aihw-${transactionId}.download`)
    const targetName = `Medicare-mental-health-services-${latest.financialYear.replace('–', '-')}.zip`
    const targetPath = join(this.config.inputDir, targetName)
    const holdingDir = join(this.config.inputDir, `.previous-${transactionId}`)
    const outputBackup = `${this.config.outputFile}.${transactionId}.backup`
    let outputExisted = false
    const moved = []
    try {
      await this.#download(latest.downloadUrl, stagingPath)
      await mkdir(holdingDir)
      for (const name of await readdir(this.config.inputDir)) {
        if (ZIP_PATTERN.test(name)) {
          const destination = join(holdingDir, name)
          await rename(join(this.config.inputDir, name), destination)
          moved.push([destination, join(this.config.inputDir, name)])
        }
      }
      try {
        await access(this.config.outputFile)
        await copyFile(this.config.outputFile, outputBackup)
        outputExisted = true
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      await rename(stagingPath, targetPath)
      await this.execFileImpl(process.execPath, [this.config.buildScript], {
        cwd: this.config.pipelineRoot,
        timeout: 120_000,
        windowsHide: true,
        maxBuffer: 2 * 1024 * 1024,
      })
      const built = validateRegionalData(await readJson(this.config.outputFile))
      if (normaliseYear(built.financialYear) !== normaliseYear(latest.financialYear)) {
        throw new Error(`ETL produced ${built.financialYear}, expected ${latest.financialYear}`)
      }
      await this.repository.load()
      const archiveDir = join(this.config.inputDir, 'archive', transactionId)
      await mkdir(archiveDir, { recursive: true })
      for (const [source] of moved) await rename(source, join(archiveDir, basename(source)))
      await rm(holdingDir, { recursive: true, force: true })
      await rm(outputBackup, { force: true })
    } catch (error) {
      await rm(targetPath, { force: true })
      await rm(stagingPath, { force: true })
      for (const [source, destination] of moved) {
        try { await rename(source, destination) } catch (restoreError) {
          error.message += `; failed to restore ${basename(destination)}: ${restoreError.message}`
        }
      }
      if (outputExisted) await copyFile(outputBackup, this.config.outputFile)
      else await rm(this.config.outputFile, { force: true })
      if (outputExisted) {
        try { await this.repository.load() } catch (restoreError) {
          error.message += `; failed to reload restored data: ${restoreError.message}`
        }
      }
      await rm(outputBackup, { force: true })
      await rm(holdingDir, { recursive: true, force: true })
      throw error
    }
  }

  async #download(url, destination) {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'www.aihw.gov.au' || !parsed.pathname.startsWith('/getmedia/')) {
      throw new Error('Refusing an untrusted AIHW download URL')
    }
    const response = await this.fetchImpl(parsed, { signal: AbortSignal.timeout(this.config.requestTimeoutMs) })
    if (!response.ok || !response.body) throw new Error(`AIHW download failed with HTTP ${response.status}`)
    const declared = Number(response.headers.get('content-length'))
    if (Number.isFinite(declared) && declared > this.config.maxDownloadBytes) throw new Error('AIHW ZIP exceeds the configured size limit')
    let received = 0
    const limiter = new Transform({
      transform: (chunk, _encoding, callback) => {
        received += chunk.length
        callback(received > this.config.maxDownloadBytes ? new Error('AIHW ZIP exceeds the configured size limit') : null, chunk)
      },
    })
    await streamPipeline(Readable.fromWeb(response.body), limiter, createWriteStream(destination, { flags: 'wx' }))
    const signature = Buffer.alloc(4)
    await new Promise((resolve, reject) => {
      const stream = createReadStream(destination, { start: 0, end: 3 })
      let offset = 0
      stream.on('data', (chunk) => { offset += chunk.copy(signature, offset) })
      stream.on('end', resolve)
      stream.on('error', reject)
    })
    if (!signature.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) throw new Error('Downloaded AIHW file is not a ZIP archive')
  }
}
