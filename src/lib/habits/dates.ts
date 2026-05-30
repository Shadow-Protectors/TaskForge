export function getLastNDates(n: number = 7): string[] {
  const dates = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export function getWeekDays(): { name: string; date: string; label: string }[] {
  const today = new Date()
  const day = today.getDay() // 0=Sun
  const days = []
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - day + i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      name: weekdayNames[i],
      date: dateStr,
      label: d.getDate().toString()
    })
  }
  return days
}
