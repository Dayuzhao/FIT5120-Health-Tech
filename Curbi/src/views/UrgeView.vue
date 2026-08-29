<template>
  <main class="urge-page">
    <section class="urge-card">
      <p class="eyebrow">CHECKING URGE</p>

      <h1>What are you feeling the urge to do?</h1>

      <p class="intro">
        Choose the checking behaviour that best matches what you are experiencing
        right now.
      </p>

      <div class="urge-options">
        <button class="urge-option" type="button">
          <span class="option-icon">🔍</span>

          <div>
            <h2>Search symptoms online</h2>
            <p>I feel like Googling my symptoms again.</p>
          </div>
        </button>

        <button class="urge-option" type="button">
          <span class="option-icon">❤️</span>

          <div>
            <h2>Check my pulse or body</h2>
            <p>I want to repeatedly check a physical sensation.</p>
          </div>
        </button>

        <button class="urge-option" type="button">
          <span class="option-icon">🪞</span>

          <div>
            <h2>Look at a physical change again</h2>
            <p>I want to keep checking the same spot or body area.</p>
          </div>
        </button>

        <button class="urge-option" type="button">
          <span class="option-icon">💬</span>

          <div>
            <h2>Ask someone for reassurance</h2>
            <p>I want someone else to tell me that everything is okay.</p>
          </div>
        </button>

        <button class="urge-option" type="button">
          <span class="option-icon">📄</span>

          <div>
            <h2>Re-read health information</h2>
            <p>I want to check an old result, report or health page again.</p>
          </div>
        </button>
      </div>

      <RouterLink to="/task" class="primary-button">
        Find a task for me
      </RouterLink>

      <RouterLink to="/help" class="support-link">
        Find nearby support services
      </RouterLink>

      <RouterLink to="/home" class="secondary-link">
        Not right now
      </RouterLink>

      <p class="privacy-text">
        No login or account is required. Your selections are not stored.
      </p>
    </section>
  </main>
</template>

<style scoped>
.support-link {
  display: block;
  margin-top: 16px;
  padding: 13px 20px;
  border: 1px solid #c9d8cd;
  border-radius: 10px;
  color: #4f765a;
  text-align: center;
  font-weight: 600;
  text-decoration: none;
  transition:
    background 180ms ease,
    border-color 180ms ease;
}

.support-link:hover {
  border-color: #9fb9a7;
  background: #f3f7f4;
}

.urge-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 64px 32px 48px;
}

.urge-card {
  max-width: 760px;
  margin: 0 auto;
}

.eyebrow {
  margin-bottom: 12px;
  color: #5d856a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

h1 {
  margin: 0;
  color: #20392a;
  font-size: clamp(34px, 4vw, 48px);
  line-height: 1.15;
}

.intro {
  max-width: 620px;
  margin: 18px 0 30px;
  color: #68736c;
  font-size: 17px;
  line-height: 1.7;
}

.urge-options {
  display: grid;
  gap: 14px;
}

.urge-option {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e1e8e3;
  border-radius: 16px;
  background: white;
  text-align: left;
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
}

.urge-option:hover {
  transform: translateY(-2px);
  border-color: #9cb7a4;
  background: #f7faf8;
}

.option-icon {
  font-size: 26px;
}

.urge-option h2 {
  margin: 0 0 6px;
  color: #294433;
  font-size: 16px;
}

.urge-option p {
  margin: 0;
  color: #727c75;
  font-size: 14px;
  line-height: 1.5;
}

.primary-button {
  display: block;
  margin-top: 28px;
  padding: 15px 22px;
  border-radius: 10px;
  background: #4f815f;
  color: white;
  text-align: center;
  font-weight: 600;
  text-decoration: none;
  transition:
    transform 180ms ease,
    background 180ms ease;
}

.primary-button:hover {
  background: #416f50;
  transform: translateY(-2px);
}

.secondary-link {
  display: block;
  margin-top: 16px;
  color: #6f7972;
  text-align: center;
  text-decoration: none;
}

.privacy-text {
  margin-top: 24px;
  color: #889189;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 700px) {
  .urge-page {
    padding: 42px 20px 32px;
  }

  .urge-option {
    padding: 17px;
  }
}
</style>