export function isTaskEligibleForUrge(task, urgeType) {
  if (!urgeType) {
    return true
  }

  const categories = Array.isArray(task.categories)
    ? task.categories
    : []

  if (task.source === 'user') {
    return categories.includes(urgeType)
  }

  if (categories.length === 0) {
    return true
  }

  return categories.includes(urgeType)
}