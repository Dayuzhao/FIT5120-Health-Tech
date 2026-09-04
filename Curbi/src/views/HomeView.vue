<template>
  <main class="home-page">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">HEALTH ANXIETY SUPPORT</p>

        <h1>Welcome to Curbi</h1>

        <p class="intro">
          A simple space to help you pause, redirect your attention and take a
          small step away from repeated health checking.
        </p>

        <RouterLink to="/urge" class="start-button">
          I feel the urge to check
        </RouterLink>
      </div>

      <div class="hero-visual">
        <div class="image-placeholder">
          <!-- future update with new pic -->
          <span>🌿</span>
          <p>Curbi illustration</p>
        </div>
      </div>
    </section>

    <section class="support-points">
      <article class="support-item">
        <span class="support-icon">🌿</span>

        <div>
          <h2>Redirect your attention</h2>
          <p>Pause before returning to another checking behaviour.</p>
        </div>
      </article>

      <article class="support-item">
        <span class="support-icon">🌱</span>

        <div>
          <h2>Build healthier habits</h2>
          <p>Try small alternative activities when an urge appears.</p>
        </div>
      </article>

      <article class="support-item">
        <span class="support-icon">♡</span>

        <div>
          <h2>Take small steps forward</h2>
          <p>Curbi is here to support the moment, not diagnose your health.</p>
        </div>
      </article>
    </section>

    <section class="privacy-note">
      <strong>No login. No account. No personal data stored.</strong>
      <p>
        Curbi is a wellbeing support tool and does not provide medical
        diagnosis.
      </p>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 70px 32px 48px;
}

.hero {
  min-height: 480px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  align-items: center;
  gap: 70px;
}

.hero-copy {
  max-width: 560px;
}

.eyebrow {
  margin-bottom: 14px;
  color: #5d856a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

h1 {
  margin: 0;
  color: #20392a;
  font-size: clamp(42px, 5vw, 64px);
  line-height: 1.08;
}

.intro {
  max-width: 520px;
  margin: 24px 0 32px;
  color: #68736c;
  font-size: 18px;
  line-height: 1.7;
}

.start-button {
  display: inline-block;
  padding: 15px 26px;
  border-radius: 10px;
  background: #4f815f;
  color: white;
  font-weight: 600;
  text-decoration: none;
  transition:
    transform 180ms ease,
    background 180ms ease;
}

.start-button:hover {
  background: #416f50;
  transform: translateY(-2px);
}

.hero-visual {
  display: flex;
  justify-content: center;
}

.image-placeholder {
  width: min(100%, 430px);
  aspect-ratio: 1 / 0.82;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 32px;
  background: #eef4ef;
  color: #5f7766;
}

.image-placeholder span {
  font-size: 76px;
}

.image-placeholder p {
  margin-top: 12px;
  font-size: 14px;
}

.support-points {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 38px;
  border: 1px solid #e5ebe7;
  border-radius: 18px;
  background: white;
}

.support-item {
  display: flex;
  gap: 14px;
  padding: 26px;
}

.support-item + .support-item {
  border-left: 1px solid #e5ebe7;
}

.support-icon {
  font-size: 25px;
}

.support-item h2 {
  margin: 0 0 7px;
  color: #294433;
  font-size: 16px;
}

.support-item p {
  margin: 0;
  color: #727c75;
  font-size: 14px;
  line-height: 1.5;
}

.privacy-note {
  margin-top: 28px;
  padding: 18px 22px;
  border-radius: 14px;
  background: #f1f6f2;
  color: #486051;
}

.privacy-note p {
  margin: 6px 0 0;
  font-size: 14px;
}

@media (max-width: 850px) {
  .home-page {
    padding: 46px 22px 36px;
  }

  .hero {
    min-height: auto;
    grid-template-columns: 1fr;
    gap: 42px;
  }

  .hero-visual {
    order: -1;
  }

  .image-placeholder {
    max-width: 360px;
  }

  .support-points {
    grid-template-columns: 1fr;
  }

  .support-item + .support-item {
    border-top: 1px solid #e5ebe7;
    border-left: none;
  }
}
</style>