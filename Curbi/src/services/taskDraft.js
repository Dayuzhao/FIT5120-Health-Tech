// One-shot hand-off of an AI-suggested task from the chat panel to My Tasks.
// Kept in memory only: nothing is saved until the user confirms in the editor.
let pendingDraft = null

export function setTaskDraft(suggestion) {
  pendingDraft = {
    title: suggestion.title,
    body: suggestion.body || suggestion.description || '',
    categories: Array.isArray(suggestion.categories) ? [...suggestion.categories] : [],
    durationSeconds: suggestion.durationSeconds,
  }
}

// Returns the draft once, then clears it so a revisit does not reopen the editor.
export function takeTaskDraft() {
  const draft = pendingDraft
  pendingDraft = null
  return draft
}
