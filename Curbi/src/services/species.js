const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Kept after the first successful request so a later draw or page visit does
// not refetch 60 species; a failed request is never cached, so retrying works.
let cachedSpecies = null

// All collectible species from the hosted database: one primary image each,
// with the fact and the attribution their licences require.
export async function fetchSpecies({ timeoutMs = 8000 } = {}) {
  if (cachedSpecies) {
    return cachedSpecies
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/species`, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`Species request failed with status ${response.status}`)
    }

    const data = await response.json()
    cachedSpecies = data.species
    return cachedSpecies
  } finally {
    clearTimeout(timer)
  }
}

// The database stores iNaturalist originals (about 1.9 MB each). The same photo
// is served as small (~40 KB) and medium (~160 KB); the ALA image is already a
// thumbnail and has no '/original.' in its URL, so it passes through unchanged.
export function imageUrl(image, size) {
  return image.url.replace('/original.', `/${size}.`)
}

// The photos are cropped to a square tile and to 4:3 with object-fit: cover. A few
// would lose the animal at the default centre, so those carry a hand-picked focus
// point (percent across / down) from the database. Others stay centred.
export function imagePosition(image) {
  return image.focus ? `${image.focus.x}% ${image.focus.y}%` : '50% 50%'
}

// "http://creativecommons.org/licenses/by-nc/4.0/" -> "CC BY-NC 4.0"
export function licenseLabel(url) {
  const match = /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(url ?? '')

  if (match) {
    return `CC ${match[1].toUpperCase()} ${match[2]}`
  }

  return /publicdomain\/zero/i.test(url ?? '') ? 'CC0 1.0' : 'Creative Commons'
}
