import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { WEEK_DAYS } from '../config/constants'

// Returns dates for the past N days including today as YYYY-MM-DD strings
export function getLastNDates(n = WEEK_DAYS) {
  const dates = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

// Returns dates for the current week (Sun–Sat) as YYYY-MM-DD strings
export function getCurrentWeekDates() {
  const today = new Date()
  const day = today.getDay() // 0=Sun
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - day + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export function useCompletions(userId) {
  const [completions, setCompletions] = useState([]) // array of { id, habit_id, date }
  const [loading, setLoading] = useState(true)

  const fetchCompletions = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const startDate = getLastNDates(30)[0] // fetch last 30 days for streaks
    const { data, error } = await supabase
      .from('completions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .order('date', { ascending: false })

    if (!error) setCompletions(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchCompletions()
  }, [fetchCompletions])

  const isCompleted = (habitId, date) =>
    completions.some(c => c.habit_id === habitId && c.date === date)

  const toggleCompletion = async (habitId, date) => {
    const existing = completions.find(c => c.habit_id === habitId && c.date === date)

    if (existing) {
      // Remove completion
      const { error } = await supabase
        .from('completions')
        .delete()
        .eq('id', existing.id)

      if (!error) {
        setCompletions(prev => prev.filter(c => c.id !== existing.id))
      }
    } else {
      // Add completion
      const { data, error } = await supabase
        .from('completions')
        .insert([{ user_id: userId, habit_id: habitId, date }])
        .select()
        .single()

      if (!error && data) {
        setCompletions(prev => [data, ...prev])
      }
    }
  }

  // Get completion dates for a specific habit
  const getHabitDates = (habitId) =>
    completions.filter(c => c.habit_id === habitId).map(c => c.date)

  return { completions, loading, fetchCompletions, isCompleted, toggleCompletion, getHabitDates }
}
