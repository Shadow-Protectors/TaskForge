/**
 * Calculates the current consecutive-day streak for a habit.
 * @param {string[]} completedDates - Array of YYYY-MM-DD strings when habit was completed
 * @returns {number} Current streak count
 */
export function calculateStreak(completedDates) {
  if (!completedDates || completedDates.length === 0) return 0

  const dateSet = new Set(completedDates)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let current = new Date(today)

  // If today is not completed, start checking from yesterday
  const todayStr = current.toISOString().split('T')[0]
  if (!dateSet.has(todayStr)) {
    current.setDate(current.getDate() - 1)
  }

  while (true) {
    const dateStr = current.toISOString().split('T')[0]
    if (dateSet.has(dateStr)) {
      streak++
      current.setDate(current.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Calculates completion rate over the last N days.
 * @param {string[]} completedDates
 * @param {string[]} targetDates - Array of YYYY-MM-DD to check against
 * @returns {number} Completion rate 0–100
 */
export function calculateCompletionRate(completedDates, targetDates) {
  if (!targetDates || targetDates.length === 0) return 0
  const dateSet = new Set(completedDates)
  const completed = targetDates.filter(d => dateSet.has(d)).length
  return Math.round((completed / targetDates.length) * 100)
}
