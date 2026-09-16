<script setup>
import { ref } from 'vue'

const selectedFeeling = ref('')

const selectFeeling = (feeling) => {
  selectedFeeling.value = feeling
}
</script>

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
          The task has been recorded as completed. The goal is not to remove
          every urge immediately. Creating even a short pause can help you
          practise responding differently when the urge appears.
        </p>
      </div>

      <div class="feedback-section">
        <p class="feedback-label">
          OPTIONAL CHECK-IN
        </p>

        <h2>How do you feel after this pause?</h2>

        <p class="feedback-intro">
          There is no right answer. Choose what feels closest right now.
        </p>

        <div class="feedback-options">
          <button
            type="button"
            class="feedback-option"
            :class="{ selected: selectedFeeling === 'calmer' }"
            @click="selectFeeling('calmer')"
          >
            <span class="feedback-icon">🌿</span>

            <span class="feedback-copy">
              <strong>A little calmer</strong>
              <small>I feel a bit more settled.</small>
            </span>
          </button>

          <button
            type="button"
            class="feedback-option"
            :class="{ selected: selectedFeeling === 'same' }"
            @click="selectFeeling('same')"
          >
            <span class="feedback-icon">○</span>

            <span class="feedback-copy">
              <strong>About the same</strong>
              <small>Not much has changed yet.</small>
            </span>
          </button>

          <button
            type="button"
            class="feedback-option"
            :class="{ selected: selectedFeeling === 'unsettled' }"
            @click="selectFeeling('unsettled')"
          >
            <span class="feedback-icon">☁</span>

            <span class="feedback-copy">
              <strong>Still unsettled</strong>
              <small>I may want another kind of support.</small>
            </span>
          </button>
        </div>

        <div
          v-if="selectedFeeling"
          class="next-step"
        >
          <template v-if="selectedFeeling === 'calmer'">
            <p class="next-step-label">NEXT STEP</p>

            <h3>Ready to continue?</h3>

            <RouterLink
              to="/"
              class="next-step-button"
            >
              Back to home
            </RouterLink>
          </template>

          <template v-else-if="selectedFeeling === 'same'">
            <p class="next-step-label">NEXT STEP</p>

            <h3>Want to try something different?</h3>

            <RouterLink
              to="/urge"
              class="next-step-button"
            >
              Try another support option
            </RouterLink>
          </template>

          <template v-else>
            <p class="next-step-label">NEXT STEP</p>

            <h3>Would another kind of support help?</h3>

            <RouterLink
              to="/help"
              class="next-step-button"
            >
              Find support
            </RouterLink>
          </template>
        </div>

        <RouterLink
          v-if="!selectedFeeling"
          to="/"
          class="skip-feedback"
        >
          Prefer not to say
        </RouterLink>
      </div>

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

.support-note {
  margin: 30px 0 0;
  padding-top: 22px;
  border-top: 1px solid #e6ebe7;
  color: #879088;
  font-size: 13px;
  line-height: 1.6;
}

.feedback-section {
  margin-top: 30px;
  padding: 28px;

  border: 1px solid rgba(70, 115, 85, 0.12);
  border-radius: 24px;

  background: #f7faf7;
}

.feedback-label {
  margin: 0 0 10px;

  color: #688573;

  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.6px;
}

.feedback-section h2 {
  margin: 0;

  color: #294433;

  font-size: 24px;
}

.feedback-intro {
  margin: 10px 0 22px;

  color: #68766d;

  font-size: 16px;
  line-height: 1.6;
}

.feedback-options {
  display: grid;
  gap: 12px;
}

.feedback-option {
  display: flex;
  align-items: center;
  gap: 16px;

  width: 100%;

  padding: 16px 18px;

  border: 1px solid #d8e3da;
  border-radius: 16px;

  background: white;

  color: #294433;

  text-align: left;

  cursor: pointer;

  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.feedback-option:hover {
  border-color: #7fa08a;

  transform: translateY(-1px);
}

.feedback-option.selected {
  border-color: #47765a;

  background: #edf5ef;
}

.feedback-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 38px;
  height: 38px;

  border-radius: 50%;

  background: #edf5ef;

  font-size: 18px;
}

.feedback-option span:last-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.feedback-option strong {
  font-size: 16px;
}

.feedback-option small {
  color: #748078;

  font-size: 14px;
  line-height: 1.4;
}

.next-step {
  margin-top: 22px;
  padding: 22px;

  border-radius: 18px;

  background: #eaf3ec;

  text-align: center;
}

.next-step-label {
  margin: 0 0 8px;

  color: #688573;

  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
}

.next-step h3 {
  margin: 0 0 18px;

  color: #294433;

  font-size: 20px;
}

.next-step-button {
  display: inline-block;

  padding: 13px 22px;

  border-radius: 999px;

  background: #47765a;
  color: white;

  font-size: 15px;
  font-weight: 600;

  text-decoration: none;

  transition:
    background 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.next-step-button:hover {
  background: #386548;

  transform: translateY(-1px);

  box-shadow:
    0 8px 20px
    rgba(54, 94, 68, 0.16);
}

.skip-feedback {
  display: block;

  width: fit-content;
  margin: 18px auto 0;

  color: #63736a;

  font-size: 15px;
  font-weight: 500;

  text-decoration: none;
}

.skip-feedback:hover {
  color: #365c43;
  text-decoration: underline;
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