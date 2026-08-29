<script setup>
import { computed, onMounted, ref } from 'vue'

import {
  formatService,
  loadHelpFinderData,
  searchServices,
} from '@/services/helpFinder'

const query = ref('')

const services = ref([])
const postcodes = ref([])
const results = ref([])

const loading = ref(true)
const searching = ref(false)
const error = ref('')

const hasSearched = ref(false)
const searchMode = ref(null)

const expandedServiceId = ref(null)

const canSearch = computed(() => query.value.trim().length > 0)

const resultHeading = computed(() => {
  if (searchMode.value === 'exact') {
    return 'Matching services'
  }

  return 'Support around you'
})

const resultDescription = computed(() => {
  if (searchMode.value === 'exact') {
    return 'Showing services whose suburb or postcode matches your search.'
  }

  return 'Showing nearby mental health services ordered by distance.'
})

function toggleDetails(serviceId) {
  expandedServiceId.value =
    expandedServiceId.value === serviceId ? null : serviceId
}

async function loadData() {
  loading.value = true
  error.value = ''

  try {
    const data = await loadHelpFinderData()

    services.value = data.services
    postcodes.value = data.postcodes
  } catch (loadError) {
    console.error('Unable to load Help Finder data:', loadError)
    error.value =
      'We could not load the service directory right now. Please try again.'
  } finally {
    loading.value = false
  }
}

async function performSearch() {
  if (!canSearch.value || searching.value) {
    return
  }

  searching.value = true
  error.value = ''
  expandedServiceId.value = null
  hasSearched.value = true

  try {
    const search = searchServices(
      query.value,
      services.value,
      postcodes.value,
    )

    searchMode.value = search.mode
    results.value = search.results.map(formatService)
  } catch (searchError) {
    console.error('Unable to search Help Finder:', searchError)
    error.value = 'We could not complete that search. Please try again.'
    results.value = []
    searchMode.value = null
  } finally {
    searching.value = false
  }
}

function handleSubmit() {
  performSearch()
}

onMounted(loadData)
</script>

<template>
  <main class="help-page">
    <section class="help-header">
      <p class="eyebrow">FIND SUPPORT</p>

      <h1>Find nearby mental health services</h1>

      <p class="intro">
        Enter a Victorian suburb or postcode to explore nearby mental health
        support services.
      </p>

      <p class="privacy-note">
        Curbi does not request your device location.
      </p>
    </section>

    <section class="search-section">
      <form class="search-row" @submit.prevent="handleSubmit">
        <div class="search-field">
          <label for="location" class="search-label">
            Suburb or postcode
          </label>

          <input
            id="location"
            v-model="query"
            class="search-input"
            type="text"
            autocomplete="postal-code"
            placeholder="e.g. Clayton or 3168"
            :disabled="loading || searching"
          />
        </div>

        <button
          class="search-button"
          type="submit"
          :disabled="!canSearch || loading || searching"
        >
          {{ searching ? 'Searching…' : 'Search' }}
        </button>
      </form>
    </section>

    <section class="results-section">
      <div v-if="loading" class="status-card">
        <div class="loading-circle"></div>

        <div>
          <h3>Loading support services</h3>
          <p>
            Curbi is loading the bundled Victorian service directory.
          </p>
        </div>
      </div>

      <div v-else-if="error" class="status-card error-state" role="alert">
        <span class="status-icon">!</span>

        <div>
          <h3>Something went wrong</h3>
          <p>{{ error }}</p>

          <button class="retry-button" type="button" @click="loadData">
            Try again
          </button>
        </div>
      </div>

      <div v-else-if="!hasSearched" class="status-card initial-state">
        <span class="status-icon">⌖</span>

        <div>
          <h3>Start by entering your suburb or postcode</h3>

          <p>
            Search for a Victorian suburb or postcode to explore mental health
            support services nearby.
          </p>
        </div>
      </div>

      <div v-else-if="searching" class="status-card">
        <div class="loading-circle"></div>

        <div>
          <h3>Searching nearby services</h3>
          <p>
            Please wait while Curbi looks for matching support services.
          </p>
        </div>
      </div>

      <div v-else-if="results.length === 0" class="status-card">
        <span class="status-icon">⌕</span>

        <div>
          <h3>No services found</h3>

          <p>
            No services matched "{{ query }}". Try another Victorian suburb or
            postcode.
          </p>
        </div>
      </div>

      <template v-else>
        <div class="results-heading">
          <div>
            <p class="eyebrow">NEARBY SERVICES</p>

            <h2>{{ resultHeading }}</h2>

            <p class="results-description">
              {{ resultDescription }}
            </p>
          </div>

          <p class="result-count">
            {{ results.length }} result<span v-if="results.length !== 1">s</span>
          </p>
        </div>

        <div class="service-list">
          <article
            v-for="service in results"
            :key="service.id"
            class="service-card"
          >
            <div class="service-top">
              <div>
                <h3>{{ service.name }}</h3>

                <p v-if="service.distanceLabel" class="distance-inline">
                  {{ service.distanceLabel }} from your search location
                </p>
              </div>

              <span v-if="service.distanceLabel" class="distance">
                {{ service.distanceLabel }}
              </span>
            </div>

            <div class="service-details">
              <p v-if="service.address">
                <strong>Address</strong>
                <span>{{ service.address }}</span>
              </p>

              <p v-if="service.suburb || service.postcode">
                <strong>Suburb</strong>
                <span>
                  {{ service.suburb }}
                  <template v-if="service.postcode">
                    VIC {{ service.postcode }}
                  </template>
                </span>
              </p>

              <p v-if="service.openingHours">
                <strong>Opening hours</strong>
                <span>{{ service.openingHours }}</span>
              </p>
            </div>

            <button
              class="details-button"
              type="button"
              @click="toggleDetails(service.id)"
            >
              {{
                expandedServiceId === service.id
                  ? 'Hide details'
                  : 'View details'
              }}
            </button>

            <div
              v-if="expandedServiceId === service.id"
              class="service-more"
            >
              <div class="detail-row">
                <div v-if="service.name">
                  <span class="detail-label">Service</span>
                  <p>{{ service.name }}</p>
                </div>

                <div v-if="service.state">
                  <span class="detail-label">State</span>
                  <p>{{ service.state }}</p>
                </div>
              </div>

              <div v-if="service.address" class="service-description">
                <span class="detail-label">Address</span>
                <p>{{ service.address }}</p>
              </div>

              <div v-if="service.openingHours" class="service-description">
                <span class="detail-label">Opening hours</span>
                <p>{{ service.openingHours }}</p>
              </div>

              <div
                v-if="service.distanceLabel"
                class="service-description"
              >
                <span class="detail-label">Distance</span>
                <p>{{ service.distanceLabel }}</p>
              </div>
            </div>
          </article>
        </div>

        <p class="data-note">
          Service information is based on project directory data as of June
          2025.
        </p>
      </template>
    </section>
  </main>
</template>

<style scoped>
.help-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 64px 32px 48px;
}

.help-header {
  max-width: 700px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #5d856a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

h1 {
  margin: 0;
  color: #20392a;
  font-size: clamp(36px, 4vw, 52px);
  line-height: 1.15;
}

.intro {
  margin: 18px 0 12px;
  color: #68736c;
  font-size: 17px;
  line-height: 1.7;
}

.privacy-note {
  margin: 0;
  color: #748078;
  font-size: 14px;
}

.search-section {
  margin-top: 38px;
  padding: 28px;
  border: 1px solid #e2e9e4;
  border-radius: 18px;
  background: white;
}

.search-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.search-field {
  flex: 1;
  min-width: 0;
}

.search-label {
  display: block;
  margin-bottom: 10px;
  color: #294433;
  font-size: 14px;
  font-weight: 600;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  border: 1px solid #ccd8cf;
  border-radius: 10px;
  outline: none;
  color: #294433;
  background: #fbfcfb;
  font: inherit;
}

.search-input:focus {
  border-color: #6e9678;
}

.search-button {
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  background: #4f815f;
  color: white;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.search-button:hover:not(:disabled) {
  background: #416f50;
}

.search-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.results-section {
  margin-top: 48px;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 18px;
  padding: 20px;
  border: 1px solid #e2e9e4;
  border-radius: 14px;
  background: white;
}

.initial-state {
  border-style: dashed;
  background: #f8faf8;
}

.status-card h3 {
  margin: 0 0 6px;
  color: #294433;
  font-size: 16px;
}

.status-card p {
  margin: 0;
  color: #748078;
  font-size: 14px;
  line-height: 1.5;
}

.status-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: #eef4ef;
  color: #4f765a;
  font-size: 18px;
  font-weight: 700;
}

.loading-circle {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 3px solid #dce7df;
  border-top-color: #5d856a;
  border-radius: 50%;
  animation: spin 900ms linear infinite;
}

.retry-button {
  margin-top: 12px;
  padding: 9px 14px;
  border: 1px solid #bfd0c3;
  border-radius: 9px;
  background: transparent;
  color: #4f765a;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.retry-button:hover {
  background: #f3f7f4;
}

.results-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.results-heading h2 {
  margin: 0;
  color: #294433;
  font-size: 27px;
}

.results-description {
  margin: 7px 0 0;
  color: #748078;
  font-size: 14px;
}

.result-count {
  margin: 0;
  color: #7b867e;
  font-size: 13px;
}

.service-list {
  display: grid;
  gap: 18px;
}

.service-card {
  padding: 26px;
  border: 1px solid #e2e9e4;
  border-radius: 18px;
  background: white;
}

.service-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.service-top h3 {
  margin: 0;
  color: #294433;
  font-size: 19px;
}

.distance-inline {
  margin: 6px 0 0;
  color: #7a857d;
  font-size: 13px;
}

.distance {
  flex-shrink: 0;
  padding: 7px 10px;
  border-radius: 20px;
  background: #eef4ef;
  color: #4f765a;
  font-size: 12px;
  font-weight: 600;
}

.service-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e7ece8;
}

.service-details p {
  margin: 0;
}

.service-details strong {
  display: block;
  margin-bottom: 6px;
  color: #758078;
  font-size: 11px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.service-details span {
  color: #4f5e54;
  font-size: 14px;
  line-height: 1.5;
}

.details-button {
  margin-top: 22px;
  padding: 10px 16px;
  border: 1px solid #bfd0c3;
  border-radius: 9px;
  background: transparent;
  color: #4f765a;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.details-button:hover {
  background: #f3f7f4;
}

.service-more {
  margin-top: 20px;
  padding: 22px;
  border-radius: 14px;
  background: #f5f8f6;
}

.detail-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 20px;
}

.detail-label {
  display: block;
  margin-bottom: 6px;
  color: #758078;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.7px;
  text-transform: uppercase;
}

.detail-row p,
.service-description p {
  margin: 0;
  color: #4f5e54;
  font-size: 14px;
  line-height: 1.6;
}

.service-description {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #dfe7e1;
}

.data-note {
  margin: 20px 0 0;
  color: #89918b;
  font-size: 12px;
  line-height: 1.6;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 700px) {
  .help-page {
    padding: 42px 20px 32px;
  }

  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-button {
    width: 100%;
  }

  .results-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .service-top {
    flex-direction: column;
  }

  .service-details {
    grid-template-columns: 1fr;
  }

  .detail-row {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}
</style>