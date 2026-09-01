const YEAR = /^(20\d{2})[–-](\d{2})$/

export function normaliseYear(value) {
  const match = String(value ?? '').match(YEAR)
  if (!match) throw new Error(`Invalid financial year: ${value}`)
  return `${match[1]}–${match[2]}`
}

export function yearNumber(value) {
  return Number(normaliseYear(value).slice(0, 4))
}

export function validateRegionalData(data) {
  const rates = data?.metrics?.serviceRatePer1000
  if (!rates || !Number.isFinite(rates.metro) || rates.metro <= 0 ||
      !Number.isFinite(rates.regional) || rates.regional < 0) {
    throw new Error('Invalid regional-access service rates')
  }
  normaliseYear(data.financialYear)
  return data
}
