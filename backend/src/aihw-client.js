import { normaliseYear, yearNumber } from './validate.js'

const SEARCH_TERM = 'Medicare mental health services'
const PAGE_SIZE = 20
const MAX_PAGES = 20

function candidateFrom(result, baseUrl) {
  const title = String(result?.resultTitle ?? '')
  const yearMatch = title.match(/Data tables:\s*Medicare mental health services\s+(20\d{2})[–-](\d{2})/i)
  if (!yearMatch || String(result?.resultFileType ?? '').toUpperCase() !== 'ZIP') return null
  const url = new URL(result.resultUrl, baseUrl)
  if (url.protocol !== 'https:' || url.hostname !== 'www.aihw.gov.au' || !url.pathname.startsWith('/getmedia/')) return null
  return {
    financialYear: normaliseYear(`${yearMatch[1]}-${yearMatch[2]}`),
    title,
    releaseDate: result.resultDateTimeFormatted || result.resultDate || null,
    downloadUrl: url.href,
    fileSizeKb: Number.isFinite(result.resultFileSize) ? result.resultFileSize : null,
  }
}

export async function findLatestDataset({ fetchImpl = fetch, searchUrl, baseUrl, timeoutMs = 30_000 }) {
  const candidates = []
  let page = 1
  let totalResults = Infinity
  while ((page - 1) * PAGE_SIZE < totalResults && page <= MAX_PAGES) {
    const response = await fetchImpl(searchUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8', accept: 'application/json' },
      body: JSON.stringify({
        enableTagFilter: false,
        itemsPerPage: PAGE_SIZE,
        searchTerm: SEARCH_TERM,
        orderByColumn: 'Date DESC',
        includeArchived: 'false',
        page,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) throw new Error(`AIHW search failed with HTTP ${response.status}`)
    const body = await response.json()
    if (!Array.isArray(body.results) || !Number.isInteger(body.totalResults) || body.totalResults < 0) {
      throw new Error('AIHW search returned an unexpected response')
    }
    totalResults = body.totalResults
    candidates.push(...body.results.map((item) => candidateFrom(item, baseUrl)).filter(Boolean))
    page += 1
  }
  if ((page - 1) * PAGE_SIZE < totalResults) throw new Error('AIHW search exceeded the safe pagination limit')
  if (candidates.length === 0) throw new Error('No Medicare mental health services ZIP was found')
  return candidates.sort((a, b) => yearNumber(b.financialYear) - yearNumber(a.financialYear)
    || String(b.releaseDate).localeCompare(String(a.releaseDate)))[0]
}
