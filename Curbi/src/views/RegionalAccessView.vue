<template>
  <main class="access-page">
    <section class="access-hero">
      <p class="eyebrow">REGIONAL ACCESS SNAPSHOT</p>

      <h1>Support isn’t spread evenly</h1>

      <p class="intro">
        Access to Medicare-subsidised mental health services differs across
        Victoria. This snapshot compares metropolitan Melbourne with regional
        Victoria.
      </p>
    </section>

    <section class="comparison-section">
      <div class="comparison-heading">
        <div>
          <p class="section-label">MENTAL HEALTH SERVICE ACCESS</p>

          <h2>
            Medicare-subsidised mental health services per 1,000 people
          </h2>
        </div>

        <span class="year-badge">2024–25</span>
      </div>

      <div class="comparison-grid">
        <article class="stat-card">
          <p class="area-label">Metro Melbourne</p>

          <div class="stat-value">569</div>

          <p class="stat-unit">
            services per 1,000 people
          </p>

          <div class="stat-bar">
            <div class="stat-fill metro-fill"></div>
          </div>
        </article>

        <article class="stat-card">
          <p class="area-label">Regional Victoria</p>

          <div class="stat-value">458</div>

          <p class="stat-unit">
            services per 1,000 people
          </p>

          <div class="stat-bar">
            <div class="stat-fill regional-fill"></div>
          </div>
        </article>
      </div>

      <div class="comparison-note">
        <div class="note-icon">i</div>

        <p>
          This comparison gives a simple overview of differences in service
          access across Victoria. It is shown during onboarding and does not use
          your location.
        </p>
      </div>

      <div class="source-row">
        <div>
          <span class="source-label">DATA SOURCE</span>

          <p>
            Australian Institute of Health and Welfare (AIHW)
          </p>
        </div>

        <div>
          <span class="source-label">FINANCIAL YEAR</span>

          <p>2024–25</p>
        </div>
      </div>
    </section>

    <section class="continue-section">
      <div>
        <h2>Curbi can help you take the next step</h2>

        <p>
          Explore tools designed to help you pause health checking behaviours
          and find support when you need it.
        </p>
      </div>

        <RouterLink to="/home" class="continue-button">
          Get started
        </RouterLink>
    </section>

    <p class="data-note">
      Example values are currently shown for UI development. Final values will
      be connected to the processed project dataset.
    </p>
  </main>
</template>

<style scoped>
.access-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 72px 32px 52px;
}

.access-hero {
  max-width: 760px;
}

.eyebrow,
.section-label,
.source-label {
  color: #5d856a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
}

.eyebrow {
  margin: 0 0 14px;
}

h1 {
  margin: 0;
  color: #20392a;
  font-size: clamp(40px, 5vw, 60px);
  line-height: 1.08;
}

.intro {
  max-width: 680px;
  margin: 22px 0 0;
  color: #68736c;
  font-size: 17px;
  line-height: 1.7;
}

.comparison-section {
  margin-top: 48px;
  padding: 34px;
  border: 1px solid #e2e9e4;
  border-radius: 24px;
  background: white;
}

.comparison-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.section-label {
  margin: 0 0 9px;
}

.comparison-heading h2 {
  max-width: 650px;
  margin: 0;
  color: #294433;
  font-size: 24px;
  line-height: 1.35;
}

.year-badge {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 20px;
  background: #eef4ef;
  color: #4f765a;
  font-size: 12px;
  font-weight: 700;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  margin-top: 30px;
}

.stat-card {
  padding: 28px;
  border: 1px solid #e1e8e3;
  border-radius: 18px;
  background: #fbfcfb;
}

.area-label {
  margin: 0;
  color: #4f5e54;
  font-size: 15px;
  font-weight: 600;
}

.stat-value {
  margin-top: 16px;
  color: #20392a;
  font-size: clamp(48px, 6vw, 68px);
  font-weight: 700;
  line-height: 1;
}

.stat-unit {
  margin: 10px 0 22px;
  color: #7b867e;
  font-size: 13px;
}

.stat-bar {
  height: 8px;
  overflow: hidden;
  border-radius: 8px;
  background: #e7ece8;
}

.stat-fill {
  height: 100%;
  border-radius: 8px;
  background: #6f9778;
}

.metro-fill {
  width: 100%;
}

.regional-fill {
  width: 80%;
}

.comparison-note {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-top: 24px;
  padding: 18px;
  border-radius: 14px;
  background: #f3f7f4;
}

.note-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: #dfeadf;
  color: #4f765a;
  font-size: 13px;
  font-weight: 700;
}

.comparison-note p {
  margin: 2px 0 0;
  color: #637068;
  font-size: 14px;
  line-height: 1.6;
}

.source-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
  padding-top: 22px;
  border-top: 1px solid #e7ece8;
}

.source-row p {
  margin: 7px 0 0;
  color: #4f5e54;
  font-size: 14px;
}

.continue-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  margin-top: 34px;
  padding: 30px 34px;
  border-radius: 20px;
  background: #eef4ef;
}

.continue-section h2 {
  margin: 0;
  color: #294433;
  font-size: 22px;
}

.continue-section p {
  max-width: 640px;
  margin: 9px 0 0;
  color: #657168;
  font-size: 14px;
  line-height: 1.6;
}

.continue-button {
  flex-shrink: 0;
  padding: 14px 24px;
  border-radius: 10px;
  background: #4f815f;
  color: white;
  font-weight: 600;
  text-decoration: none;
  transition:
    transform 180ms ease,
    background 180ms ease;
}

.continue-button:hover {
  background: #416f50;
  transform: translateY(-2px);
}

.data-note {
  margin: 22px 0 0;
  color: #89918b;
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}

@media (max-width: 760px) {
  .access-page {
    padding: 46px 20px 34px;
  }

  .comparison-section {
    padding: 24px 20px;
  }

  .comparison-heading {
    flex-direction: column;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
  }

  .source-row {
    grid-template-columns: 1fr;
  }

  .continue-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .continue-button {
    width: 100%;
    text-align: center;
  }
}
</style>