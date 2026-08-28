<template>
  <main class="page">
    <section class="card">
      <p class="eyebrow">TRY SOMETHING DIFFERENT</p>

      <div class="icon">🚶</div>

      <h1>Take a 5-minute walk</h1>

      <p class="description">
        Step away from your screen for a few minutes and focus on your
        surroundings instead of checking the symptom again.
      </p>

      <div class="task-info">
        <span>Estimated time</span>
        <strong>5 minutes</strong>
      </div>

      <RouterLink to="/complete" class="primary-button">
        I've completed this task
      </RouterLink>

      <RouterLink to="/urge" class="secondary-link">
        Choose another option
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7f4;
  font-family: Arial, sans-serif;
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 520px;
  background: white;
  border-radius: 24px;
  padding: 42px;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
}

.eyebrow {
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 2px;
  color: #63856d;
  margin-bottom: 20px;
}

.icon {
  font-size: 48px;
  margin-bottom: 16px;
}

h1 {
  font-size: 32px;
  color: #24332a;
  margin-bottom: 16px;
}

.description {
  color: #68716b;
  line-height: 1.6;
  margin-bottom: 28px;
}

.task-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f5f7f4;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 28px;
  color: #4f5a53;
}

.primary-button {
  display: block;
  background: #547a61;
  color: white;
  padding: 15px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: bold;
}

.secondary-link {
  display: block;
  color: #777;
  text-decoration: none;
  margin-top: 18px;
  font-size: 14px;
}
</style>