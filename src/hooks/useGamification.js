import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useGamification(userId) {
  const [totalCompletions, setTotalCompletions] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchTotalCompletions = async () => {
    if (!userId) return
    setLoading(true)
    
    // Fetch total count of completions for this user
    const { count, error } = await supabase
      .from('completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (!error) {
      setTotalCompletions(count || 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTotalCompletions()
  }, [userId])

  // XP logic
  const XP_PER_HABIT = 10
  const XP_PER_LEVEL = 100
  
  const xp = totalCompletions * XP_PER_HABIT
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const xpInCurrentLevel = xp % XP_PER_LEVEL
  const progress = (xpInCurrentLevel / XP_PER_LEVEL) * 100

  // Achievements logic (simplified for now)
  const achievements = [
    { id: 'first_habit', name: 'Getting Started', description: 'Complete your first habit', icon: '🌱', threshold: 1 },
    { id: 'week_warrior', name: 'Week Warrior', description: 'Complete 7 habits', icon: '⚔️', threshold: 7 },
    { id: 'consistency_king', name: 'Consistency King', description: 'Complete 50 habits', icon: '👑', threshold: 50 },
    { id: 'centurion', name: 'Centurion', description: 'Complete 100 habits', icon: '💯', threshold: 100 },
  ]

  const unlockedAchievements = achievements.filter(a => totalCompletions >= a.threshold)

  return {
    level,
    xp,
    xpInCurrentLevel,
    progress,
    totalCompletions,
    unlockedAchievements,
    loading,
    refreshGamification: fetchTotalCompletions
  }
}
