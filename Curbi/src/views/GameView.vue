<template>
  <main class="game-page">
    <section class="game-intro">
      <p class="eyebrow">QUICK BREAK</p>

      <h1>Take a small pause.</h1>

      <p class="intro">
        Tap into a short, low-pressure activity and give your attention
        somewhere else for a moment.
      </p>
    </section>

    <section class="game-area">
      <div class="game-card">
        <div class="game-visual">
          <span class="leaf">🍃</span>
        </div>

        <div class="game-copy">
          <p class="game-label">LEAF TAP</p>

          <h2>A gentle distraction game</h2>

          <p>
            Tap leaves as they appear. There is no score, ranking or pressure
            to perform.
          </p>

          <button class="start-game-button" type="button" disabled>
            Start game
          </button>

        </div>
      </div>
    </section>

    <RouterLink to="/" class="back-link">
      ← Back to home
    </RouterLink>
  </main>
</template>

<style scoped>
.game-page {
  min-height: calc(100vh - 76px);
  padding: 80px 32px;

  background:
    radial-gradient(
      circle at 85% 18%,
      rgba(220, 235, 205, 0.7),
      transparent 28%
    ),
    #f7faf7;

  color: #20392a;
}

.game-intro,
.game-area,
.back-link {
  width: min(100%, 1050px);
  margin-left: auto;
  margin-right: auto;
}

.game-intro {
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 52px;
  text-align: center;
}

.eyebrow {
  margin: 0 0 16px;

  color: #66856f;

  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2.2px;
}

h1 {
  margin: 0;

  font-size: clamp(44px, 6vw, 68px);
  font-weight: 600;
  line-height: 1.05;

  color: #20392a;
}

.intro {
  max-width: 620px;
  margin: 24px auto 0;

  color: #69766e;

  font-size: 17px;
  line-height: 1.7;
}

.game-card {
  display: grid;
  grid-template-columns: 1fr 1fr;

  min-height: 430px;

  overflow: hidden;

  border: 1px solid rgba(74, 111, 83, 0.12);
  border-radius: 30px;

  background: rgba(255, 255, 255, 0.88);

  box-shadow:
    0 24px 60px
    rgba(53, 78, 60, 0.08);
}

.game-visual {
  display: flex;
  align-items: center;
  justify-content: center;

  background:
    radial-gradient(
      circle,
      rgba(231, 241, 213, 0.95),
      rgba(224, 237, 226, 0.65)
    );
}

.leaf {
  font-size: 92px;
}

.game-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;

  padding: 54px;
}

.game-label {
  margin: 0 0 12px;

  color: #789082;

  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
}

.game-copy h2 {
  margin: 0 0 18px;

  color: #294433;

  font-size: 30px;
}

.game-copy > p:not(.game-label) {
  margin: 0 0 28px;

  color: #707c74;

  line-height: 1.7;
}

.start-game-button {
  width: fit-content;

  padding: 14px 24px;

  border: none;
  border-radius: 999px;

  background: #9eb5a5;
  color: white;

  font-size: 15px;
  font-weight: 600;

  cursor: not-allowed;
}

.back-link {
  display: block;

  margin-top: 28px;

  color: #47765a;

  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 760px) {
  .game-page {
    padding: 55px 22px;
  }

  .game-card {
    grid-template-columns: 1fr;
  }

  .game-visual {
    min-height: 220px;
  }

  .game-copy {
    padding: 32px;
  }
}
</style>