import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { findLatestDataset } from '../src/aihw-client.js'
import { buildApp } from '../src/app.js'
import { DataRepository } from '../src/data-repository.js'
import { UpdatePipeline } from '../src/update-pipeline.js'
import { createConfig } from '../src/config.js'

const currentData = {
  financialYear: '2024–25',
  source: 'AIHW test',
  metrics: { serviceRatePer1000: { metro: 569, regional: 458, gapPct: -19.6 } },
}

function searchResult(year, date = '2026-05-12') {
  const asciiYear = year.replace('–', '-')
  return {
    resultTitle: `Data tables: Medicare mental health services ${year}`,
    resultDateTimeFormatted: date,
    resultUrl: `/getmedia/test-guid/Medicare-mental-health-services-${asciiYear}.zip`,
    resultFileType: 'ZIP',
    resultFileSize: 700,
  }
}

test('discovers the newest valid ZIP across paginated AIHW JSON', async () => {
  const requests = []
  const fetchImpl = async (_url, options) => {
    const request = JSON.parse(options.body)
    requests.push(request)
    const results = request.page === 1
      ? [searchResult('2023-24'), { ...searchResult('2028-29'), resultUrl: 'https://evil.example/file.zip' }]
      : [searchResult('2024–25')]
    return Response.json({ results, totalResults: 21 })
  }
  const latest = await findLatestDataset({ fetchImpl, searchUrl: 'https://www.aihw.gov.au/api/search',
    baseUrl: 'https://www.aihw.gov.au', timeoutMs: 1000 })
  assert.equal(latest.financialYear, '2024–25')
  assert.equal(requests.length, 2)
  assert.equal(requests[0].includeArchived, 'false')
})

test('rejects malformed AIHW search responses', async () => {
  await assert.rejects(findLatestDataset({ fetchImpl: async () => Response.json({ results: [] }),
    searchUrl: 'https://www.aihw.gov.au/api/search', baseUrl: 'https://www.aihw.gov.au' }), /unexpected/)
})

test('rejects invalid server ports and timer overflow', () => {
  assert.throws(() => createConfig({ PORT: '70000' }), /PORT/)
  assert.throws(() => createConfig({ AIHW_CHECK_INTERVAL_MS: '2147483648' }), /timer limit/)
})

test('Fastify exposes dataset and updater status', async () => {
  const repository = { load: async () => currentData, get: () => currentData }
  const updater = { initialise: async () => {}, getStatus: () => ({ state: 'idle', running: false }) }
  const app = await buildApp({ repository, updater, startScheduler: false, logger: false, config: {} })
  const dataResponse = await app.inject('/api/regional-access')
  assert.equal(dataResponse.statusCode, 200)
  assert.deepEqual(dataResponse.json(), currentData)
  const statusResponse = await app.inject('/api/regional-access/status')
  assert.deepEqual(statusResponse.json(), { state: 'idle', running: false })
  await app.close()
})

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'curbi-backend-'))
  const inputDir = join(root, 'input')
  const outputFile = join(root, 'output', 'regional-access.json')
  await mkdir(inputDir, { recursive: true })
  await mkdir(join(root, 'output'), { recursive: true })
  await writeFile(outputFile, JSON.stringify(currentData))
  const config = {
    inputDir, outputFile, pipelineRoot: root, buildScript: join(root, 'build-aihw.js'),
    statusFile: join(root, 'status.json'), searchUrl: 'https://www.aihw.gov.au/api/search',
    aihwBaseUrl: 'https://www.aihw.gov.au', requestTimeoutMs: 1000, maxDownloadBytes: 1024,
  }
  const repository = new DataRepository(outputFile)
  await repository.load()
  return { root, inputDir, outputFile, config, repository }
}

test('pipeline applies a new dataset and retains old input in archive', async () => {
  const f = await fixture()
  await writeFile(join(f.inputDir, 'Medicare-mental-health-old.zip'), Buffer.from('old'))
  const updated = { ...currentData, financialYear: '2025–26', metrics: { serviceRatePer1000: { metro: 600, regional: 500 } } }
  const updater = new UpdatePipeline(f.config, f.repository, {
    findLatestImpl: async () => ({ financialYear: '2025–26', downloadUrl: 'https://www.aihw.gov.au/getmedia/guid/new.zip' }),
    fetchImpl: async () => new Response(Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3])),
    execFileImpl: async () => writeFile(f.outputFile, JSON.stringify(updated)),
  })
  await updater.initialise()
  const status = await updater.run('test')
  assert.equal(status.updateApplied, true)
  assert.equal(status.error, null)
  assert.deepEqual(f.repository.get(), updated)
  assert.match(await readFile(f.config.statusFile, 'utf8'), /lastSuccessfulCheckAt/)
})

test('failed ETL preserves serving data, JSON, and previous input', async () => {
  const f = await fixture()
  const oldZip = join(f.inputDir, 'Medicare-mental-health-old.zip')
  await writeFile(oldZip, Buffer.from('old'))
  const before = await readFile(f.outputFile, 'utf8')
  const updater = new UpdatePipeline(f.config, f.repository, {
    findLatestImpl: async () => ({ financialYear: '2025–26', downloadUrl: 'https://www.aihw.gov.au/getmedia/guid/new.zip' }),
    fetchImpl: async () => new Response(Buffer.from([0x50, 0x4b, 0x03, 0x04, 1])),
    execFileImpl: async () => { await writeFile(f.outputFile, '{broken'); throw new Error('ETL failed') },
  })
  const status = await updater.run('test')
  assert.equal(status.state, 'error')
  assert.match(status.error.message, /ETL failed/)
  assert.deepEqual(f.repository.get(), currentData)
  assert.equal(await readFile(f.outputFile, 'utf8'), before)
  assert.equal((await readFile(oldZip)).toString(), 'old')
})

test('concurrent checks coalesce into one run', async () => {
  const f = await fixture()
  let calls = 0
  const updater = new UpdatePipeline(f.config, f.repository, {
    findLatestImpl: async () => { calls += 1; await new Promise((resolve) => setTimeout(resolve, 20)); return { financialYear: '2024–25' } },
  })
  const [first, second] = await Promise.all([updater.run(), updater.run()])
  assert.deepEqual(first, second)
  assert.equal(calls, 1)
})

test('same-year replacement URL triggers a rebuild after a prior check', async () => {
  const f = await fixture()
  const oldUrl = 'https://www.aihw.gov.au/getmedia/old-guid/current.zip'
  const newUrl = 'https://www.aihw.gov.au/getmedia/new-guid/current.zip'
  await writeFile(f.config.statusFile, JSON.stringify({ latestRemoteDataset: {
    financialYear: '2024–25', downloadUrl: oldUrl,
  } }))
  let builds = 0
  const updater = new UpdatePipeline(f.config, f.repository, {
    findLatestImpl: async () => ({ financialYear: '2024–25', downloadUrl: newUrl }),
    fetchImpl: async () => new Response(Buffer.from([0x50, 0x4b, 0x03, 0x04, 1])),
    execFileImpl: async () => { builds += 1; await writeFile(f.outputFile, JSON.stringify(currentData)) },
  })
  await updater.initialise()
  const status = await updater.run('test')
  assert.equal(builds, 1)
  assert.equal(status.updateReason, 'revised-download')
  assert.equal(status.updateApplied, true)
})
