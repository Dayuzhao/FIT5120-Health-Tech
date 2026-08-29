const SERVICES_URL = '/data/nhsd-services.json'
const POSTCODES_URL = '/data/vic-postcodes.json'

const RESULT_LIMIT = 20

const DAY_ORDER = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
]

function normalise(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
}

function normalisePostcode(value) {
  return normalise(value).replace(/\s/g, '')
}

export function distanceKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371

  const toRadians = (degrees) => (degrees * Math.PI) / 180

  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  )
}

export function formatHours(hours) {
  if (!hours || typeof hours !== 'object') {
    return ''
  }

  return DAY_ORDER
    .filter(([key]) => hours[key])
    .map(([key, label]) => `${label}: ${hours[key]}`)
    .join(' · ')
}

export async function loadHelpFinderData() {
  const [servicesResponse, postcodesResponse] = await Promise.all([
    fetch(SERVICES_URL),
    fetch(POSTCODES_URL),
  ])

  if (!servicesResponse.ok) {
    throw new Error('Unable to load NHSD service data')
  }

  if (!postcodesResponse.ok) {
    throw new Error('Unable to load postcode data')
  }

  const [services, postcodes] = await Promise.all([
    servicesResponse.json(),
    postcodesResponse.json(),
  ])

  if (!Array.isArray(services)) {
    throw new Error('NHSD service data has an invalid format')
  }

  if (!Array.isArray(postcodes)) {
    throw new Error('Postcode data has an invalid format')
  }

  return {
    services,
    postcodes,
  }
}

function findLocationMatches(query, postcodes) {
  const trimmed = normalise(query)
  const postcodeQuery = normalisePostcode(query)

  if (!trimmed) {
    return []
  }

  return postcodes.filter((entry) => {
    const suburb = normalise(entry.suburb)
    const postcode = normalisePostcode(entry.postcode)

    return (
      suburb === trimmed ||
      postcode === postcodeQuery
    )
  })
}

function exactServiceMatches(query, services) {
  const normalisedQuery = normalise(query)
  const normalisedPostcodeQuery = normalisePostcode(query)

  return services
    .filter((service) => {
      const suburbMatches =
        normalise(service.suburb) === normalisedQuery

      const postcodeMatches =
        normalisePostcode(service.postcode) === normalisedPostcodeQuery

      return suburbMatches || postcodeMatches
    })
    .map((service) => ({
      ...service,
      distanceKm: null,
    }))
}

function nearbyServices(locationMatches, services) {
  if (locationMatches.length === 0) {
    return []
  }

  return services
    .map((service) => {
      let nearestDistance = Infinity

      for (const location of locationMatches) {
        const distance = distanceKm(
          Number(location.lat),
          Number(location.lon),
          Number(service.lat),
          Number(service.lon),
        )

        if (Number.isFinite(distance) && distance < nearestDistance) {
          nearestDistance = distance
        }
      }

      return {
        ...service,
        distanceKm: nearestDistance,
      }
    })
    .filter((service) => Number.isFinite(service.distanceKm))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, RESULT_LIMIT)
}

export function searchServices(query, services, postcodes) {
  const locationMatches = findLocationMatches(query, postcodes)

  if (locationMatches.length > 0) {
    return {
      mode: 'distance',
      locationMatches,
      results: nearbyServices(locationMatches, services),
    }
  }

  return {
    mode: 'exact',
    locationMatches: [],
    results: exactServiceMatches(query, services),
  }
}

export function getServiceDistanceLabel(distance) {
  if (!Number.isFinite(distance)) {
    return ''
  }

  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`
  }

  return `${distance.toFixed(1)} km`
}

export function formatService(service) {
  return {
    ...service,
    distanceLabel: getServiceDistanceLabel(service.distanceKm),
    openingHours: formatHours(service.hours),
  }
}