<template>
  <main class="complete-page">
    <section class="complete-card">
      <div class="complete-icon">✓</div>

      <p class="eyebrow">TASK COMPLETE</p>

      <h1>Nice work</h1>

      <p class="intro">
        You took a short pause from checking and redirected your attention to
        something else.
      </p>

      <div class="reflection-box">
        <h2>A small step still counts</h2>

        <p>
          The goal is not to remove every urge immediately. Creating even a
          short pause can help you practise responding differently when the urge
          appears.
        </p>
      </div>

      <RouterLink to="/" class="home-button">
        Back to Home
      </RouterLink>

      <RouterLink to="/urge" class="another-option">
        Try another support option
      </RouterLink>

      <p class="support-note">
        Curbi is a wellbeing support tool and does not provide medical
        diagnosis.
      </p>
    </section>
  </main>
</template>

<style scoped>
.complete-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 72px 32px 48px;
}

.complete-card {
  max-width: 640px;
  margin: 0 auto;
  padding: 48px;
  border: 1px solid #e2e9e4;
  border-radius: 24px;
  background: white;
  text-align: center;
}

.complete-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  border-radius: 50%;
  background: #e7f0e9;
  color: #4f815f;
  font-size: 32px;
  font-weight: 700;
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
  font-size: clamp(36px, 4vw, 50px);
  line-height: 1.15;
}

.intro {
  max-width: 520px;
  margin: 18px auto 28px;
  color: #68736c;
  font-size: 17px;
  line-height: 1.7;
}

.reflection-box {
  margin-top: 30px;
  padding: 24px;
  border-radius: 16px;
  background: #f3f7f4;
  text-align: left;
}

.reflection-box h2 {
  margin: 0 0 10px;
  color: #294433;
  font-size: 18px;
}

.reflection-box p {
  margin: 0;
  color: #657168;
  font-size: 14px;
  line-height: 1.65;
}

.home-button {
  display: block;
  margin-top: 30px;
  padding: 15px 22px;
  border-radius: 10px;
  background: #4f815f;
  color: white;
  font-weight: 600;
  text-decoration: none;
  transition:
    transform 180ms ease,
    background 180ms ease;
}

.home-button:hover {
  background: #416f50;
  transform: translateY(-2px);
}

.another-option {
  display: inline-block;
  margin-top: 18px;
  color: #62766a;
  text-decoration: none;
}

.another-option:hover {
  text-decoration: underline;
}

.support-note {
  margin: 30px 0 0;
  padding-top: 22px;
  border-top: 1px solid #e6ebe7;
  color: #879088;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 700px) {
  .complete-page {
    padding: 44px 20px 32px;
  }

  .complete-card {
    padding: 34px 22px;
    border-radius: 20px;
  }
}
</style>