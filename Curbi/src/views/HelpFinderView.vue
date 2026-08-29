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
      <label for="location" class="search-label">
        Suburb or postcode
      </label>

      <div class="search-row">
        <input
          id="location"
          class="search-input"
          type="text"
          placeholder="e.g. Clayton or 3168"
        />

        <button class="search-button" type="button">
          Search
        </button>
      </div>
    </section>

    <section class="results-section">
      <div class="status-card initial-state">
        <span class="status-icon">⌖</span>

        <div>
           <h3>Start by entering your suburb or postcode</h3>

           <p>
              Search for a Victorian suburb or postcode to explore mental health support services nearby.
           </p>
        </div>
      </div>

      <div class="results-heading">
        <div>
          <p class="eyebrow">NEARBY SERVICES</p>
          <h2>Support around you</h2>
        </div>

        <p class="result-count">
          Example results
        </p>
      </div>

      <div class="service-list">
        <article class="service-card">
          <div class="service-top">
            <div>
              <h3>Example Mental Health Service</h3>
              <p class="service-type">Mental health support</p>
            </div>

            <span class="distance">1.2 km</span>
          </div>

          <div class="service-details">
            <p>
              <strong>Address</strong>
              <span>123 Example Street</span>
            </p>

            <p>
              <strong>Suburb</strong>
              <span>Clayton VIC 3168</span>
            </p>

            <p>
              <strong>Opening hours</strong>
              <span>Monday–Friday, 9:00 AM–5:00 PM</span>
            </p>
          </div>

          <button class="details-button" type="button">
            View details
          </button>

          <div class="service-more">
            <div class="detail-row">
                <div>
                <span class="detail-label">Service type</span>
                <p>Community mental health support</p>
                </div>

                <div>
                <span class="detail-label">Contact</span>
                <p>03 9000 0000</p>
                </div>
            </div>

            <div class="detail-row">
                <div>
                <span class="detail-label">Availability</span>
                <p>Appointments may be required</p>
                </div>

                <div>
                <span class="detail-label">Location</span>
                <p>Clayton, Victoria</p>
                </div>
            </div>

            <div class="service-description">
                <span class="detail-label">About this service</span>

                <p>
                This is example content used to demonstrate how additional service
                information can be presented. Final details will come from the project
                service data.
                </p>
            </div>
            </div>
        </article>

        <article class="service-card">
          <div class="service-top">
            <div>
              <h3>Community Wellbeing Centre</h3>
              <p class="service-type">Community support service</p>
            </div>

            <span class="distance">3.4 km</span>
          </div>

          <div class="service-details">
            <p>
              <strong>Address</strong>
              <span>48 Sample Road</span>
            </p>

            <p>
              <strong>Suburb</strong>
              <span>Oakleigh VIC 3166</span>
            </p>

            <p>
              <strong>Opening hours</strong>
              <span>Monday–Saturday, 8:30 AM–6:00 PM</span>
            </p>
          </div>

          <button class="details-button" type="button">
            View details
          </button>
        </article>
      </div>

      <p class="data-note">
        Example service information shown for UI development. Final service
        information will be connected to the project data source.
      </p>

      <div class="status-card loading-state">
        <div class="loading-circle"></div>
          <div>
              <h3>Searching nearby services</h3>
              <p>Please wait while Curbi looks for matching support services.</p>
        </div>
      </div>

      <div class="status-card empty-state">
          <span class="status-icon">⌕</span>
          <div>
              <h3>No services found</h3>
              <p>
              Try another Victorian suburb or postcode, or check the spelling and search
              again.
              </p>
          </div>
      </div>

      <div class="status-card error-state">
          <span class="status-icon">!</span>

          <div>
              <h3>Something went wrong</h3>
              <p>
              We couldn't load the service information right now. Please try again.
              </p>
          </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.initial-state {
  border-style: dashed;
  background: #f8faf8;
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

.detail-row > div {
  min-width: 0;
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
  padding-top: 18px;
  border-top: 1px solid #dfe7e1;
}

@media (max-width: 700px) {
  .detail-row {
    grid-template-columns: 1fr;
    gap: 18px;
  }
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

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

.search-label {
  display: block;
  margin-bottom: 10px;
  color: #294433;
  font-size: 14px;
  font-weight: 600;
}

.search-row {
  display: flex;
  gap: 12px;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid #ccd8cf;
  border-radius: 10px;
  outline: none;
  color: #294433;
  background: #fbfcfb;
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
  font-weight: 600;
  cursor: pointer;
}

.search-button:hover {
  background: #416f50;
}

.results-section {
  margin-top: 48px;
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

.service-type {
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
  font-weight: 600;
  cursor: pointer;
}

.details-button:hover {
  background: #f3f7f4;
}

.data-note {
  margin: 20px 0 0;
  color: #89918b;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 700px) {
  .help-page {
    padding: 42px 20px 32px;
  }

  .search-row {
    flex-direction: column;
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
}
</style>