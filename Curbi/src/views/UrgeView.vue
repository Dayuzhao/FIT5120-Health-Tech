<template>
  <main class="page">
    <section class="card">
      <div class="icon">🌿</div>

      <p class="eyebrow">CHECKING URGE</p>

      <h1>Having the urge to check?</h1>

      <p class="description">
        That's okay. Instead of checking right now, let's try something
        different for a few minutes.
      </p>

      <div class="examples">
        <p>You might be feeling like...</p>

        <div class="example">🔍 Searching your symptoms again</div>
        <div class="example">❤️ Checking your pulse or body</div>
        <div class="example">🪞 Looking at something repeatedly</div>
        <div class="example">💬 Asking someone for reassurance</div>
      </div>

      <RouterLink to="/task" class="primary-button">
        Help me redirect
      </RouterLink>

      <RouterLink to="/" class="secondary-link">
        Not right now
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

.icon {
  font-size: 40px;
  margin-bottom: 18px;
}

.eyebrow {
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 2px;
  color: #63856d;
}

h1 {
  font-size: 32px;
  margin: 10px 0 14px;
  color: #24332a;
}

.description {
  color: #68716b;
  line-height: 1.6;
  margin-bottom: 30px;
}

.examples {
  text-align: left;
  margin-bottom: 30px;
}

.examples > p {
  font-size: 14px;
  color: #777;
}

.example {
  background: #f5f7f4;
  padding: 13px 15px;
  border-radius: 10px;
  margin-top: 9px;
  color: #39453e;
}

.primary-button {
  display: block;
  background: #547a61;
  color: white;
  padding: 15px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: bold;
  margin-top: 10px;
}

.secondary-link {
  display: block;
  color: #777;
  text-decoration: none;
  margin-top: 18px;
  font-size: 14px;
}
</style>