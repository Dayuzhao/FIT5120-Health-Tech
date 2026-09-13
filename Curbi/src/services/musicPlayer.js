const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function fetchTracks() {
  const response = await fetch(`${API_BASE_URL}/api/v1/tracks`)
  if (!response.ok) {
    throw new Error(`Tracks request failed with status ${response.status}`)
  }
  const data = await response.json()
  return data.tracks
}
