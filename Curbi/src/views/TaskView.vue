<template>
  <main class="task-page">
    <section class="task-card">
      <div class="task-icon">🌿</div>

      <p class="eyebrow">YOUR TASK</p>

      <h1>Take a 5-minute walk</h1>

      <p class="intro">
        Step away from checking for a few minutes and give your attention
        somewhere else.
      </p>

      <div class="task-time">
        <span>◷</span>
        <div>
          <p class="time-label">ESTIMATED TIME</p>
          <strong>5 minutes</strong>
        </div>
      </div>

      <div class="instructions">
        <h2>What to do</h2>

        <div class="instruction">
          <span class="step-number">1</span>
          <p>Stand up and move away from where you were checking.</p>
        </div>

        <div class="instruction">
          <span class="step-number">2</span>
          <p>Take a short walk somewhere nearby for about five minutes.</p>
        </div>

        <div class="instruction">
          <span class="step-number">3</span>
          <p>
            While walking, notice what is around you instead of returning to
            the checking behaviour.
          </p>
        </div>
      </div>

      <RouterLink to="/complete" class="complete-button">
        I've completed this task
      </RouterLink>

      <RouterLink to="/urge" class="another-task">
        Choose another option
      </RouterLink>

      <p class="support-note">
        You don't need to do this perfectly. The goal is simply to create a
        short pause from checking.
      </p>
    </section>
  </main>
</template>

<style scoped>
.task-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 64px 32px 48px;
}

.task-card {
  max-width: 680px;
  margin: 0 auto;
  padding: 44px;
  border: 1px solid #e2e9e4;
  border-radius: 24px;
  background: white;
}

.task-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
  border-radius: 18px;
  background: #eef4ef;
  font-size: 30px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #5d856a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

h1 {
  margin: 0;
  color: #20392a;
  font-size: clamp(34px, 4vw, 46px);
  line-height: 1.15;
}

.intro {
  margin: 18px 0 28px;
  color: #68736c;
  font-size: 17px;
  line-height: 1.7;
}

.task-time {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 32px;
  padding: 16px 18px;
  border-radius: 14px;
  background: #f3f7f4;
  color: #42634d;
}

.task-time > span {
  font-size: 25px;
}

.time-label {
  margin: 0 0 3px;
  color: #718078;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.3px;
}

.task-time strong {
  color: #294433;
  font-size: 15px;
}

.instructions {
  padding-top: 4px;
}

.instructions h2 {
  margin: 0 0 18px;
  color: #294433;
  font-size: 19px;
}

.instruction {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 18px;
}

.step-number {
  min-width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e7f0e9;
  color: #477256;
  font-size: 13px;
  font-weight: 700;
}

.instruction p {
  margin: 3px 0 0;
  color: #606d64;
  font-size: 15px;
  line-height: 1.6;
}

.complete-button {
  display: block;
  margin-top: 32px;
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

.complete-button:hover {
  background: #416f50;
  transform: translateY(-2px);
}

.another-task {
  display: block;
  margin-top: 16px;
  color: #62766a;
  text-align: center;
  text-decoration: none;
}

.another-task:hover {
  text-decoration: underline;
}

.support-note {
  margin: 28px 0 0;
  padding-top: 22px;
  border-top: 1px solid #e6ebe7;
  color: #879088;
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

@media (max-width: 700px) {
  .task-page {
    padding: 42px 20px 32px;
  }

  .task-card {
    padding: 30px 22px;
    border-radius: 20px;
  }
}
</style>