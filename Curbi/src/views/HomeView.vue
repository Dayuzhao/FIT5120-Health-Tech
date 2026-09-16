<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import CurbiCompanion from '../components/CurbiCompanion.vue'

const activeScene = ref('hero')

const heroSection = ref(null)
const journeySection = ref(null)
const supportSection = ref(null)
const closingSection = ref(null)

let sceneObserver = null

onMounted(() => {
  const sections = [
    heroSection.value,
    journeySection.value,
    supportSection.value,
    closingSection.value,
  ].filter(Boolean)

  sceneObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeScene.value = entry.target.dataset.scene
        }
      })
    },
    {
      threshold: 0.45,
    },
  )

  sections.forEach((section) => {
    sceneObserver.observe(section)
  })
})

onBeforeUnmount(() => {
  if (sceneObserver) {
    sceneObserver.disconnect()
  }
})
</script>

<template>
  <main class="home-page">
    <div class="scene-shell" :class="`scene-${activeScene}`" aria-hidden="true">
      <div class="scene-image scene-image-hero"></div>
      <div class="scene-image scene-image-journey"></div>
      <div class="scene-image scene-image-support"></div>
      <div class="scene-image scene-image-closing"></div>

      <div class="scene-overlay"></div>

      <div class="scene-layer scene-layer-one"></div>
      <div class="scene-layer scene-layer-two"></div>
    </div>

    <!-- Scene 1: First impression -->
    <section ref="heroSection" data-scene="hero" class="home-hero section-panel" :class="{ 'section-active': activeScene === 'hero' }">
      <div class="hero-background hero-background-one"></div>

      <div class="hero-content">
        <p class="eyebrow">A SMALL PAUSE CAN HELP</p>

        <h1>
          A little space
          <span>before the next check</span>
        </h1>

        <p class="hero-intro">
          Curbi offers a gentle space to pause before checking and try a different next step
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

      <div class="hero-companion">
        <CurbiCompanion />
      </div>

      <a href="#journey" class="scroll-hint">
        <span>Scroll to explore</span>
        <span class="scroll-arrow">↓</span>
      </a>
    </section>

    <!-- Scene 2: Explain the journey -->
    <section id="journey" ref="journeySection" data-scene="journey" class="journey-section section-panel" :class="{ 'section-active': activeScene === 'journey' }">
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
    <section id="explore" ref="supportSection" data-scene="support" class="support-section section-panel" :class="{ 'section-active': activeScene === 'support' }">
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

        <RouterLink to="/play" class="support-card">
          <span class="card-icon">🍃</span>

          <div>
            <p class="card-label">QUICK BREAK</p>

            <h3>Take a playful pause</h3>

            <p>
              Shift your attention with a short, low-pressure interaction.
            </p>
          </div>

          <span class="card-link">
            Start Leaf Tap →
          </span>
        </RouterLink>

        <RouterLink to="/atmosphere" class="support-card">
          <span class="card-icon">♫</span>

          <div>
            <p class="card-label">CALM BACKGROUND</p>
            <h3>Set the atmosphere</h3>
            <p>
              Listen to gentle background music while you move through Curbi.
            </p>
          </div>

          <span class="card-link">Start listening →</span>
        </RouterLink>
      </div>
    </section>

    <!-- Scene 4: Final action -->
    <section ref="closingSection" data-scene="closing" class="closing-section section-panel" :class="{ 'section-active': activeScene === 'closing' }">
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
.closing-section {
  min-height: 100vh;
  padding-bottom: 100px;
  margin-bottom: 0;

  background: transparent;
}

.closing-section.section-panel,
.closing-section.section-active {
  background: transparent;
}

.hero-companion {
  position: fixed;
  right: 28px;
  bottom: 22px;
  z-index: 30;

  width: clamp(140px, 12vw, 190px);

  pointer-events: auto;
}

@media (max-width: 700px) {
  .hero-companion {
    right: 12px;
    bottom: 12px;
    width: 110px;
  }
}

.home-page {
  position: relative;
  overflow-x: clip;
  background: #f7faf7;
  color: #20392a;
}

/* Background scenes */
.scene-shell {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: #edf4ee;
}

.scene-image {
  position: absolute;
  inset: 0;

  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;

  opacity: 0;
  transform: scale(1.03);

  transition:
    opacity 900ms ease,
    transform 1400ms ease;
}

.scene-image-hero {
  background-image: url('/images/home/hero-scene.png');
}

.scene-image-journey {
  background-image: url('/images/home/scene-pause.png');
}

.scene-image-support {
  background-image: url('/images/home/scene-choice.png');
}

.scene-image-closing {
  background-image: url('/images/home/scene-closing.png');
}

/* Show current scene */

.scene-hero .scene-image-hero,
.scene-journey .scene-image-journey,
.scene-support .scene-image-support,
.scene-closing .scene-image-closing {
  opacity: 1;
  transform: scale(1);
}

/* Keep text readable */
.scene-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;

  background:
    linear-gradient(
      90deg,
      rgba(247, 250, 247, 0.9) 0%,
      rgba(247, 250, 247, 0.64) 34%,
      rgba(247, 250, 247, 0.18) 62%,
      rgba(247, 250, 247, 0.04) 100%
    );
}

/* Soft foreground atmosphere */
.scene-layer {
  position: absolute;
  z-index: 3;
  border-radius: 50%;
  pointer-events: none;

  transition:
    transform 900ms ease,
    opacity 900ms ease;
}

.scene-layer-one {
  width: 600px;
  height: 600px;
  right: -260px;
  top: 80px;

  background: rgba(124, 166, 135, 0.12);
  filter: blur(20px);
}

.scene-layer-two {
  width: 520px;
  height: 520px;
  left: -250px;
  bottom: -220px;

  background: rgba(221, 232, 195, 0.16);
  filter: blur(24px);
}

/* Small movement between scenes */
.scene-journey .scene-layer-one {
  transform: translate(-30px, 25px);
}

.scene-support .scene-layer-one {
  transform: translate(-55px, 45px);
}

.scene-closing .scene-layer-one {
  transform: translate(-20px, -20px);
}

.scene-journey .scene-layer-two {
  transform: translate(35px, -20px);
}

.scene-support .scene-layer-two {
  transform: translate(55px, -35px);
}

.scene-closing .scene-layer-two {
  transform: translate(20px, -10px);
}

/* CONTENT LAYERS */
.section-panel,
.privacy-note {
  position: relative;
  z-index: 1;
}

#journey,
#explore {
  scroll-margin-top: 90px;
}


/*HERO*/
.home-hero {
  position: relative;

  min-height: calc(100vh - 82px);

  display: grid;
  grid-template-columns: 1fr;

  align-items: center;

  gap: 70px;

  padding:
    80px
    max(32px, calc((100vw - 1180px) / 2));

  overflow: hidden;

  /*Transparent so the global scene background can show through.*/
  background: transparent;
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

  background: rgba(119, 157, 126, 0.1);

  filter: blur(3px);
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


/* BUTTONS */
.primary-button {
  min-height: 48px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

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

  box-shadow:
    0 12px 28px
    rgba(54, 94, 68, 0.18);
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

.primary-button:focus-visible,
.secondary-button:focus-visible,
.text-link:focus-visible,
.scroll-hint:focus-visible,
.support-card:focus-visible {
  outline: 3px solid #789982;
  outline-offset: 4px;
}

.hero-note {
  margin-top: 20px;

  color: #7b877f;

  font-size: 13px;
}

/* SCROLL HINT */
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

  animation: scrollArrow 1.8s ease-in-out infinite;
}

@keyframes scrollArrow {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(6px);
  }
}


/* JOURNEY */
.journey-section {
  min-height: 100vh;

  padding:
    120px
    max(32px, calc((100vw - 1180px) / 2));

  background: rgba(238, 244, 239, 0.38);
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

  border:
    1px solid
    rgba(66, 98, 76, 0.12);

  border-radius: 24px;

  background:
    rgba(255, 255, 255, 0.72);

  backdrop-filter: blur(10px);
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

  color: #294433;

  font-size: 21px;
}

.journey-step p {
  margin: 0;

  color: #707c74;

  line-height: 1.6;
}


/* SUPPORT SECTION */
.support-section {
  min-height: 100vh;

  padding:
    120px
    max(32px, calc((100vw - 1180px) / 2));

  background: rgba(250, 251, 248, 0.4);
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

  background:
    rgba(255, 255, 255, 0.88);

  backdrop-filter: blur(9px);

  color: inherit;

  text-decoration: none;

  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease,
    background 220ms ease;
}

.support-card:hover {
  border-color: #b8cdbd;

  background: rgba(255, 255, 255, 0.97);

  transform: translateY(-8px);

  box-shadow:
    0 22px 45px
    rgba(52, 77, 59, 0.1);
}

.support-card-coming {
  cursor: default;
}

.support-card-coming:hover {
  border-color: #e0e8e2;

  background:
    rgba(255, 255, 255, 0.88);

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


/* CLOSING */
.closing-section {
  min-height: 76vh;

  display: flex;

  align-items: center;
  justify-content: center;

  padding: 100px 32px;

  background: rgba(235, 244, 233, 0.34);

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


/* PRIVACY */
.privacy-note {
  color: #587062;

  text-align: center;
}

.privacy-note p {
  max-width: 680px;

  margin: 7px auto 0;

  color: #4e5751;

  font-size: 13px;
  line-height: 1.6;
}

/* SCROLL REVEAL */
.hero-content,
.hero-companion,
.journey-copy,
.journey-step,
.section-heading,
.support-card,
.closing-content {
  opacity: 0;

  transform: translateY(24px);

  transition:
    opacity 520ms ease,
    transform 520ms ease;
}

.section-active .hero-content,
.section-active .hero-companion,
.section-active .journey-copy,
.section-active .journey-step,
.section-active .section-heading,
.section-active .support-card,
.section-active .closing-content {
  opacity: 1;

  transform: translateY(0);
}


/* Stagger the repeated items */
.section-active .journey-step:nth-child(1),
.section-active .support-card:nth-child(1) {
  transition-delay: 70ms;
}

.section-active .journey-step:nth-child(2),
.section-active .support-card:nth-child(2) {
  transition-delay: 150ms;
}

.section-active .journey-step:nth-child(3),
.section-active .support-card:nth-child(3) {
  transition-delay: 230ms;
}


/* RESPONSIVE — TABLET */
@media (max-width: 900px) {
  .scene-layer-one {
    width: 500px;
    height: 500px;

    right: -230px;
  }

  .scene-layer-two {
    width: 430px;
    height: 430px;
  }

  .home-hero {
    min-height: auto;

    grid-template-columns: 1fr;

    gap: 48px;

    padding-top: 70px;
    padding-bottom: 105px;
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


/* RESPONSIVE — MOBILE */
@media (max-width: 600px) {
  .home-hero,
  .journey-section,
  .support-section {
    padding-left: 22px;
    padding-right: 22px;
  }

  .home-hero h1 {
    font-size: clamp(44px, 13vw, 58px);

    letter-spacing: -1.2px;
  }

  .hero-intro {
    font-size: 16px;
  }

  .hero-actions,
  .closing-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .primary-button {
    width: 100%;
    box-sizing: border-box;
  }

  .secondary-button,
  .text-link {
    padding: 10px 0;

    text-align: center;
  }

  .journey-section,
  .support-section {
    min-height: auto;

    padding-top: 82px;
    padding-bottom: 82px;
  }

  .journey-step,
  .support-card {
    padding: 26px;

    border-radius: 22px;
  }

  .closing-section {
    min-height: 70vh;

    padding:
      80px
      22px;
  }

  .scroll-hint {
    bottom: 18px;
  }
}


/* REDUCED MOTION */
@media (prefers-reduced-motion: reduce) {
  .scene-shell,
  .scene-layer,
  .hero-content,
  .hero-companion,
  .journey-copy,
  .journey-step,
  .section-heading,
  .support-card,
  .closing-content,
  .primary-button {
    transition: none;
  }

  .scroll-arrow {
    animation: none;
  }
}
</style>