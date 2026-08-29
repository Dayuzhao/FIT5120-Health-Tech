<template>
  <main class="page">
    <section class="content-card">
      <p class="eyebrow">CONTACT</p>

      <h1>Contact</h1>

      <p class="description">
        If you have any questions or feedback, feel free to reach out.
      </p>

      <p class="email">
        ✉ hello@curbi.app
      </p>

      <div class="notice">
        <strong>🌿 Curbi is not a medical service.</strong>

        <p>
          If you are in crisis or need immediate help, please contact a
          healthcare professional or emergency services.
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
  text-align: center;
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
}

.email {
  color: #367553;
  font-size: 18px;
  margin: 32px 0;
}

.notice {
  background: #eef4ef;
  padding: 24px;
  border-radius: 14px;
  color: #365541;
  text-align: left;
}
</style>