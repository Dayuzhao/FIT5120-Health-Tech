const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Epic 4 / US4 onboarding snapshot. The backend serves a fixed regional-Victoria-
// vs-metro-Melbourne comparison for the latest financial year, read live from the
// database. Shape:
//   { financialYear, source, sourceUrl,
//     metrics: { serviceRatePer1000: { metro, regional, gapPct }, ... } }
export async function fetchRegionalAccess() {
  const response = await fetch(`${API_BASE_URL}/api/v1/regional-access`)
  if (!response.ok) {
    throw new Error(`Regional access request failed with status ${response.status}`)
  }
  return response.json()
}
