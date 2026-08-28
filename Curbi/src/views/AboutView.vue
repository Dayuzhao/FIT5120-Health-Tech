<template>
  <main class="page">
    <section class="content-card">
      <p class="eyebrow">ABOUT</p>

      <h1>About Curbi</h1>

      <p class="description">
        Curbi is a simple tool designed to support you when you feel the urge
        to repeatedly check your health.
      </p>

      <div class="feature-list">
        <div>🌿 Redirect your attention</div>
        <div>🌱 Build healthier habits</div>
        <div>♡ Take small steps forward</div>
      </div>

      <div class="privacy-box">
        <strong>🔒 Your privacy matters</strong>

        <p>
          Curbi does not collect or store personal information.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - 75px);
  background: #f6f8f7;
  padding: 70px 24px;
}

.content-card {
  max-width: 760px;
  margin: 0 auto;
  background: white;
  border-radius: 22px;
  padding: 48px;
}

.eyebrow {
  color: #568466;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 2px;
}

h1 {
  color: #21382a;
  font-size: 36px;
}

.description {
  color: #66716a;
  line-height: 1.7;
}

.feature-list {
  display: grid;
  gap: 16px;
  margin: 32px 0;
}

.privacy-box {
  background: #eef4ef;
  padding: 22px;
  border-radius: 14px;
  color: #365541;
}
</style>