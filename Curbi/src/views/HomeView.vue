<template>
  <main class="home-page">

    <!-- Scene 1: First impression -->
    <section class="home-hero">
      <div class="hero-background hero-background-one"></div>

      <div class="hero-content">
        <p class="eyebrow">A SMALL PAUSE CAN HELP</p>

        <h1>
          A little space
          <span>before the next check.</span>
        </h1>

        <p class="hero-intro">
          Curbi helps you pause repeated health checking and redirect your
          attention towards a different next step.
        </p>

        <div class="hero-actions">
          <RouterLink to="/urge" class="primary-button">
            I feel the urge to check
          </RouterLink>

          <a href="#explore" class="secondary-button">
            See how Curbi can help
          </a>
        </div>

        <p class="hero-note">
          No login required. Start when you are ready.
        </p>
      </div>

      <div class="hero-brand">
        <img
          src="/images/curbi-logo.png"
          alt="Curbi"
        />
      </div>

      <a href="#journey" class="scroll-hint">
        <span>Scroll to explore</span>
        <span class="scroll-arrow">↓</span>
      </a>
    </section>

    <!-- Scene 2: Explain the journey -->
    <section id="journey" class="journey-section">
      <div class="journey-copy">
        <p class="eyebrow">CREATE SOME SPACE</p>

        <h2>You do not need to solve everything right now.</h2>

        <p>
          When the urge to check appears, Curbi gives you a moment to pause
          before deciding what happens next.
        </p>
      </div>

      <div class="journey-steps">
        <article class="journey-step">
          <span class="step-number">01</span>
          <h3>Notice the urge</h3>
          <p>Recognise the moment without needing to analyse it.</p>
        </article>

        <article class="journey-step">
          <span class="step-number">02</span>
          <h3>Create some space</h3>
          <p>Shift your attention towards something simple and manageable.</p>
        </article>

        <article class="journey-step">
          <span class="step-number">03</span>
          <h3>Choose what comes next</h3>
          <p>Return to your day when you feel ready.</p>
        </article>
      </div>
    </section>

    <!-- Scene 3: Main actions -->
    <section id="explore" class="support-section">
      <div class="section-heading">
        <p class="eyebrow">YOUR NEXT STEP</p>

        <h2>Choose what feels manageable right now.</h2>

        <p>
          There is no single right way to pause. Choose the kind of support
          that fits this moment.
        </p>
      </div>

      <div class="support-grid">
        <RouterLink to="/urge" class="support-card">
          <span class="card-icon">🌿</span>

          <div>
            <p class="card-label">GUIDED SUPPORT</p>
            <h3>Redirect an urge</h3>
            <p>
              Notice what you feel like checking and choose a different activity.
            </p>
          </div>

          <span class="card-link">Start urge support →</span>
        </RouterLink>

        <article class="support-card support-card-coming">
          <span class="card-icon">🍃</span>

          <div>
            <p class="card-label">QUICK BREAK</p>
            <h3>Take a playful pause</h3>
            <p>
              Shift your attention with a short, low-pressure interaction.
            </p>
          </div>

          <span class="card-link">Leaf Tap coming in Iteration 2</span>
        </article>

        <article class="support-card support-card-coming">
          <span class="card-icon">♫</span>

          <div>
            <p class="card-label">CALM BACKGROUND</p>
            <h3>Set the atmosphere</h3>
            <p>
              Listen to gentle background music while you move through Curbi.
            </p>
          </div>

          <span class="card-link">Music coming in Iteration 2</span>
        </article>
      </div>
    </section>

    <!-- Scene 4: Final action -->
    <section class="closing-section">
      <div class="closing-content">
        <p class="eyebrow">WHEN YOU ARE READY</p>

        <h2>What would help right now?</h2>

        <p>
          You can start with an urge, take a short break, or simply return later.
        </p>

        <div class="closing-actions">
          <RouterLink to="/urge" class="primary-button">
            I feel the urge to check
          </RouterLink>

          <RouterLink to="/help" class="text-link">
            Find support services →
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="privacy-note">
      <strong>No account required.</strong>
      <p>
        Curbi is a wellbeing support tool and does not provide medical diagnosis.
        Activity history may be stored locally in this browser on this device.
      </p>
    </section>

  </main>
</template>

<style scoped>
.home-page {
  overflow: hidden;
  background: #f7faf7;
  color: #20392a;
}

/* ---------------- HERO ---------------- */

.home-hero {
  position: relative;
  min-height: calc(100vh - 82px);
  display: grid;
  grid-template-columns: 1fr 0.75fr;
  align-items: center;
  gap: 70px;
  padding: 80px max(32px, calc((100vw - 1180px) / 2));
  overflow: hidden;
  background:
    radial-gradient(circle at 80% 25%, #e9f0cc 0, transparent 28%),
    linear-gradient(135deg, #f8fbf6 0%, #edf5ee 55%, #e3eee6 100%);
}

.hero-background {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.hero-background-one {
  width: 620px;
  height: 620px;
  right: -180px;
  bottom: -270px;
  background: rgba(119, 157, 126, 0.12);
  filter: blur(2px);
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 690px;
}

.eyebrow {
  margin: 0 0 18px;
  color: #62836c;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2.4px;
}

.home-hero h1 {
  max-width: 720px;
  margin: 0;
  color: #1e3929;
  font-size: clamp(52px, 6vw, 82px);
  font-weight: 600;
  line-height: 1.02;
  letter-spacing: -2px;
}

.home-hero h1 span {
  display: block;
  color: #537661;
}

.hero-intro {
  max-width: 590px;
  margin: 30px 0;
  color: #65736a;
  font-size: 18px;
  line-height: 1.75;
}

.hero-actions,
.closing-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 14px 24px;
  border-radius: 999px;
  background: #47765a;
  color: white;
  font-weight: 600;
  text-decoration: none;
  transition:
    transform 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.primary-button:hover {
  background: #386548;
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(54, 94, 68, 0.18);
}

.secondary-button,
.text-link {
  color: #47765a;
  font-weight: 600;
  text-decoration: none;
}

.secondary-button:hover,
.text-link:hover {
  text-decoration: underline;
}

.hero-note {
  margin-top: 20px;
  color: #7b877f;
  font-size: 13px;
}

.hero-brand {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-brand img {
  width: min(100%, 480px);
  height: auto;
  opacity: 0.92;
}

.scroll-hint {
  position: absolute;
  left: 50%;
  bottom: 28px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #718078;
  font-size: 12px;
  text-decoration: none;
  transform: translateX(-50%);
}

.scroll-arrow {
  font-size: 20px;
}

/* ---------------- JOURNEY ---------------- */

.journey-section {
  min-height: 100vh;
  padding: 120px max(32px, calc((100vw - 1180px) / 2));
  background: #eef4ef;
}

.journey-copy {
  max-width: 720px;
  margin-bottom: 70px;
}

.journey-copy h2,
.section-heading h2,
.closing-content h2 {
  margin: 0;
  color: #20392a;
  font-size: clamp(36px, 4vw, 56px);
  font-weight: 600;
  line-height: 1.12;
}

.journey-copy > p:last-child,
.section-heading > p:last-child,
.closing-content > p {
  max-width: 620px;
  margin-top: 22px;
  color: #6b776f;
  font-size: 17px;
  line-height: 1.7;
}

.journey-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.journey-step {
  min-height: 260px;
  padding: 32px;
  border: 1px solid rgba(66, 98, 76, 0.12);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
}

.step-number {
  display: block;
  margin-bottom: 60px;
  color: #7b9a83;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
}

.journey-step h3 {
  margin: 0 0 12px;
  font-size: 21px;
}

.journey-step p {
  margin: 0;
  color: #707c74;
  line-height: 1.6;
}

/* ---------------- SUPPORT ---------------- */

.support-section {
  padding: 120px max(32px, calc((100vw - 1180px) / 2));
  background: #fafbf8;
}

.section-heading {
  max-width: 700px;
  margin-bottom: 55px;
}

.support-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

.support-card {
  min-height: 390px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 32px;
  border: 1px solid #e0e8e2;
  border-radius: 28px;
  background: white;
  color: inherit;
  text-decoration: none;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease;
}

.support-card:hover {
  border-color: #b8cdbd;
  transform: translateY(-8px);
  box-shadow: 0 22px 45px rgba(52, 77, 59, 0.1);
}

.support-card-coming {
  cursor: default;
}

.support-card-coming:hover {
  transform: none;
  box-shadow: none;
}

.card-icon {
  font-size: 36px;
}

.card-label {
  margin: 0 0 10px;
  color: #779081;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.7px;
}

.support-card h3 {
  margin: 0 0 12px;
  color: #274332;
  font-size: 25px;
}

.support-card p {
  color: #727d76;
  line-height: 1.6;
}

.card-link {
  color: #47765a;
  font-size: 14px;
  font-weight: 600;
}

/* ---------------- CLOSING ---------------- */

.closing-section {
  min-height: 76vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 32px;
  background:
    radial-gradient(circle at 20% 50%, #eef4d4 0, transparent 28%),
    linear-gradient(135deg, #e5efe7 0%, #f7faf4 100%);
  text-align: center;
}

.closing-content {
  max-width: 720px;
}

.closing-content > p {
  margin-left: auto;
  margin-right: auto;
}

.closing-actions {
  justify-content: center;
  margin-top: 30px;
}

/* ---------------- PRIVACY ---------------- */

.privacy-note {
  padding: 30px 32px 40px;
  background: #f7faf7;
  color: #587062;
  text-align: center;
}

.privacy-note p {
  max-width: 680px;
  margin: 7px auto 0;
  color: #768179;
  font-size: 13px;
  line-height: 1.6;
}

/* ---------------- RESPONSIVE ---------------- */

@media (max-width: 900px) {
  .home-hero {
    min-height: auto;
    grid-template-columns: 1fr;
    gap: 50px;
    padding-top: 70px;
    padding-bottom: 100px;
  }

  .hero-brand {
    order: 2;
  }

  .hero-brand img {
    max-width: 360px;
  }

  .journey-steps,
  .support-grid {
    grid-template-columns: 1fr;
  }

  .journey-step,
  .support-card {
    min-height: auto;
  }

  .step-number {
    margin-bottom: 35px;
  }
}

@media (max-width: 600px) {
  .home-hero,
  .journey-section,
  .support-section {
    padding-left: 22px;
    padding-right: 22px;
  }

  .home-hero h1 {
    font-size: clamp(44px, 13vw, 58px);
  }

  .hero-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .primary-button {
    width: 100%;
  }

  .hero-brand img {
    max-width: 280px;
  }

  .journey-section,
  .support-section {
    padding-top: 80px;
    padding-bottom: 80px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition: none !important;
    animation: none !important;
  }
}
</style>