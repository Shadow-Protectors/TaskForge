export function calculateStreak(completedDates: string[]): number {
  if (!completedDates || completedDates.length === 0) return 0

  const dateSet = new Set(completedDates)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let current = new Date(today)

  const todayStr = current.toISOString().split('T')[0]
  if (!dateSet.has(todayStr)) {
    current.setDate(current.getDate() - 1)
  }

  // Iterate backwards and count consecutive completions
  for (let i = 0; i < 365; i++) {
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

export function calculateLongestStreak(completedDates: string[]): number {
  if (!completedDates || completedDates.length === 0) return 0

  // Sort unique dates in ascending order
  const dates = Array.from(new Set(completedDates))
    .map(d => new Date(d + 'T00:00:00').getTime())
    .sort((a, b) => a - b)

  let maxStreak = 1
  let currentStreak = 1
  const MS_PER_DAY = 24 * 60 * 60 * 1000

  for (let i = 1; i < dates.length; i++) {
    const diff = dates[i] - dates[i - 1]
    if (diff === MS_PER_DAY) {
      currentStreak++
    } else if (diff > MS_PER_DAY) {
      currentStreak = 1
    }
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak
    }
  }

  return maxStreak
}

export function calculateCompletionRate(completedDates: string[], targetDates: string[]): number {
  if (!targetDates || targetDates.length === 0) return 0
  const dateSet = new Set(completedDates)
  const completedCount = targetDates.filter(d => dateSet.has(d)).length
  return Math.round((completedCount / targetDates.length) * 100)
}
