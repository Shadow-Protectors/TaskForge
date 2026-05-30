'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getWeekDays, getLastNDates } from '@/lib/habits/dates'
import { calculateStreak, calculateLongestStreak, calculateCompletionRate } from '@/lib/habits/streak'
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Flame, 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  ChevronRight, 
  Edit3,
  Calendar,
  X
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import confetti from 'canvas-confetti'

interface Habit {
  id: string
  name: string
  emoji: string
  category: string
  color: string
  created_at: string
}

interface Completion {
  id: string
  habit_id: string
  date: string
}

const categories = ['General', 'Health', 'Fitness', 'Mind', 'Work', 'Learning']
const colors = [
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Sky', value: '#0ea5e9' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f43f5e' }
]

export default function HabitsPage() {
  const supabase = createClient()
  const weekDays = getWeekDays()
  const last30Days = getLastNDates(30)

  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [habitName, setHabitName] = useState('')
  const [habitEmoji, setHabitEmoji] = useState('💪')
  const [habitCategory, setHabitCategory] = useState('General')
  const [habitColor, setHabitColor] = useState('#8b5cf6')
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)

  const fetchData = useCallback(async (uid: string) => {
    setLoading(true)
    
    // Fetch habits
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true })

    // Fetch completions for the last 30 days
    const startDate = last30Days[0]
    const { data: completionsData } = await supabase
      .from('completions')
      .select('*')
      .eq('user_id', uid)
      .gte('date', startDate)

    setHabits(habitsData || [])
    setCompletions(completionsData || [])
    setLoading(false)
  }, [supabase, last30Days])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchData(user.id)
      }
    })
  }, [supabase, fetchData])

  const handleToggle = async (habitId: string, date: string) => {
    if (!userId) return

    const existing = completions.find(c => c.habit_id === habitId && c.date === date)

    if (existing) {
      // Delete completion
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
        
        // Trigger gamification celebration!
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#8b5cf6', '#10b981', '#0ea5e9']
        })
      }
    }
  }

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !habitName.trim()) return

    try {
      if (editingHabitId) {
        // Edit Habit
        const { data, error } = await supabase
          .from('habits')
          .update({ name: habitName, emoji: habitEmoji, category: habitCategory, color: habitColor })
          .eq('id', editingHabitId)
          .select()
          .single()

        if (error) throw error
        setHabits(prev => prev.map(h => h.id === editingHabitId ? data : h))
      } else {
        // Create Habit
        const { data, error } = await supabase
          .from('habits')
          .insert([{ user_id: userId, name: habitName, emoji: habitEmoji, category: habitCategory, color: habitColor }])
          .select()
          .single()

        if (error) throw error
        setHabits(prev => [...prev, data])
      }
      
      // Reset form
      setHabitName('')
      setHabitEmoji('💪')
      setHabitCategory('General')
      setHabitColor('#8b5cf6')
      setEditingHabitId(null)
      setIsModalOpen(false)
    } catch (err) {
      alert('Failed to save habit')
      console.error(err)
    }
  }

  const handleDeleteHabit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this habit? All history will be deleted.')) return

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)

      if (error) throw error
      setHabits(prev => prev.filter(h => h.id !== id))
      setCompletions(prev => prev.filter(c => c.habit_id !== id))
    } catch (err) {
      alert('Failed to delete habit')
      console.error(err)
    }
  }

  // Calculate global stats
  const totalCompletionsCount = completions.length
  
  // Get completions dates for individual habits to compute streak
  const getHabitStreak = (habitId: string) => {
    const dates = completions.filter(c => c.habit_id === habitId).map(c => c.date)
    return calculateStreak(dates)
  }

  const getHabitLongestStreak = (habitId: string) => {
    const dates = completions.filter(c => c.habit_id === habitId).map(c => c.date)
    return calculateLongestStreak(dates)
  }

  // Aggregate completion data for Recharts (30-day activity)
  const chartData = last30Days.map(date => {
    const dailyCompletions = completions.filter(c => c.date === date).length
    const activeHabitsOnDate = habits.length // simple baseline
    const rate = activeHabitsOnDate > 0 
      ? Math.round((dailyCompletions / activeHabitsOnDate) * 100)
      : 0
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rate
    }
  })

  // Unlocked achievements
  const achievements = [
    { name: 'Getting Started', desc: 'Complete 1 habit', threshold: 1, icon: '🌱' },
    { name: 'Week Warrior', desc: 'Complete 7 habits', threshold: 7, icon: '⚔️' },
    { name: 'Consistency King', desc: 'Complete 50 habits', threshold: 50, icon: '👑' },
    { name: 'Centurion', desc: 'Complete 100 habits', threshold: 100, icon: '💯' }
  ]
  const unlockedAchievements = achievements.filter(a => totalCompletionsCount >= a.threshold)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
        <Calendar className="w-12 h-12 text-violet-500 animate-pulse" />
        <p className="text-sm">Loading your personal arena...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Personal Habits Arena
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Build consistency, secure daily completions, and level up your skills.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingHabitId(null)
            setIsModalOpen(true)
          }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl py-3 px-5 font-semibold text-sm shadow-lg shadow-violet-600/10 active:scale-[0.99] transition duration-150 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Grid: Habits Checklist & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Columns: Habits Weekly Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-violet-400" />
              <span>Weekly Logs</span>
            </h2>

            {habits.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                <CheckSquare className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                <p className="text-sm">No habits registered. Create one to begin tracking!</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Grid header row */}
                <div className="hidden sm:grid grid-cols-10 gap-2 border-b border-slate-800/60 pb-3 text-xxs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-3">Habit</div>
                  {weekDays.map(day => (
                    <div key={day.date} className="text-center">
                      <p>{day.name}</p>
                      <p className="text-slate-600 mt-0.5">{day.label}</p>
                    </div>
                  ))}
                </div>

                {/* Habit Rows */}
                {habits.map((habit) => {
                  const currentStreak = getHabitStreak(habit.id)
                  return (
                    <div key={habit.id} className="flex flex-col sm:grid sm:grid-cols-10 gap-4 sm:gap-2 items-start sm:items-center py-4 border-b border-slate-800/30 last:border-b-0">
                      
                      {/* Name & Details */}
                      <div className="col-span-3 flex items-start gap-3 min-w-0">
                        <span className="text-2xl p-2 bg-slate-950 border border-slate-800 rounded-xl shadow-inner shrink-0" style={{ boxShadow: `inset 0 0 10px ${habit.color}15` }}>
                          {habit.emoji}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">{habit.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xxs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase tracking-wide border border-slate-750">
                              {habit.category}
                            </span>
                            {currentStreak > 0 && (
                              <div className="flex items-center gap-0.5 text-orange-400 font-bold text-xxs animate-pulse">
                                <Flame className="w-3.5 h-3.5 fill-orange-400" />
                                <span>{currentStreak}d</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Daily Completion Checkboxes */}
                      <div className="flex sm:contents justify-between w-full border-t border-slate-800/40 sm:border-t-0 pt-3 sm:pt-0">
                        {weekDays.map((day) => {
                          const isDone = completions.some(c => c.habit_id === habit.id && c.date === day.date)
                          return (
                            <div key={day.date} className="flex flex-col items-center flex-1 sm:flex-initial">
                              {/* Mobile day labels */}
                              <span className="sm:hidden text-xxs text-slate-500 font-bold mb-1.5">{day.name}</span>
                              <button
                                onClick={() => handleToggle(habit.id, day.date)}
                                className={`w-8 h-8 rounded-full border transition-all duration-300 flex items-center justify-center ${
                                  isDone 
                                    ? 'border-transparent text-slate-950 scale-105' 
                                    : 'border-slate-800 text-transparent hover:border-slate-600'
                                }`}
                                style={{ 
                                  backgroundColor: isDone ? habit.color : 'transparent',
                                  boxShadow: isDone ? `0 0 12px ${habit.color}40` : 'none'
                                }}
                              >
                                <span className={`text-xxs font-extrabold ${isDone ? 'text-slate-950' : 'text-slate-500'}`}>
                                  ✓
                                </span>
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      {/* Delete button (Desktop only, or small screen flex overlay) */}
                      <div className="absolute right-6 sm:static col-span-10 sm:col-auto flex justify-end">
                        <button
                          onClick={() => {
                            setHabitName(habit.name)
                            setHabitEmoji(habit.emoji)
                            setHabitCategory(habit.category)
                            setHabitColor(habit.color)
                            setEditingHabitId(habit.id)
                            setIsModalOpen(true)
                          }}
                          className="p-1.5 text-slate-500 hover:text-violet-400 rounded-lg hover:bg-slate-850/50 transition-colors mr-1"
                          title="Edit Habit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-850/50 transition-colors"
                          title="Delete Habit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Streaks, Achievements & Gamification */}
        <div className="space-y-6">
          
          {/* Achievement Box */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Achievements ({unlockedAchievements.length})</span>
            </h2>
            <div className="space-y-3">
              {achievements.map((ach) => {
                const isUnlocked = totalCompletionsCount >= ach.threshold
                return (
                  <div 
                    key={ach.name} 
                    className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all duration-200 ${
                      isUnlocked 
                        ? 'bg-slate-950/60 border-slate-800 text-slate-200' 
                        : 'bg-slate-950/20 border-slate-900/50 text-slate-600'
                    }`}
                  >
                    <span className={`text-2xl filter shrink-0 ${isUnlocked ? 'grayscale-0' : 'grayscale opacity-30'}`}>
                      {ach.icon}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${isUnlocked ? 'text-slate-200' : 'text-slate-500'}`}>{ach.name}</p>
                      <p className="text-xxs text-slate-500 mt-0.5">{ach.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Streaks Analytics Box */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span>Streak Board</span>
            </h2>
            {habits.length === 0 ? (
              <p className="text-xs text-slate-600 italic">Streaks will populate once habits are added.</p>
            ) : (
              <div className="space-y-3">
                {habits.map(habit => {
                  const currentStr = getHabitStreak(habit.id)
                  const longestStr = getHabitLongestStreak(habit.id)
                  return (
                    <div key={habit.id} className="bg-slate-950/40 border border-slate-900/80 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{habit.emoji}</span>
                        <span className="text-xs text-slate-300 truncate font-semibold">{habit.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xxs font-bold text-slate-500">
                        <div className="text-right">
                          <p className="text-orange-400 font-extrabold flex items-center gap-0.5 justify-end">
                            <Flame className="w-3.5 h-3.5 fill-orange-400" />
                            {currentStr}d
                          </p>
                          <p className="text-slate-600 mt-0.5">Current</p>
                        </div>
                        <div className="text-right border-l border-slate-800 pl-3">
                          <p className="text-slate-200 font-extrabold">{longestStr}d</p>
                          <p className="text-slate-600 mt-0.5">Longest</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Analytics Chart */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
        <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <span>Consistency Rate (Last 30 Days)</span>
        </h2>
        {habits.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-600 text-xs italic">
            Chart data will update once completions are logged.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  name="Completion Rate"
                  stroke="#8b5cf6" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorRate)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Habit Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-100">
                {editingHabitId ? 'Edit Habit' : 'Create New Habit'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveHabit} className="space-y-4">
              
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Habit Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Read 15 pages, Drink Water"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                />
              </div>

              {/* Grid: Emoji & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Emoji Icon</label>
                  <input
                    type="text"
                    required
                    placeholder="💪"
                    value={habitEmoji}
                    onChange={(e) => setHabitEmoji(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors text-center text-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-250 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                  >
                    {categories.map(c => (
                      <option key={c} value={c} className="bg-slate-900">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Theme Color Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Theme Color</label>
                <div className="flex items-center gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setHabitColor(color.value)}
                      className={`w-8 h-8 rounded-full border transition-transform duration-150 ${
                        habitColor === color.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl py-2.5 font-semibold text-sm transition-colors border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl py-2.5 font-semibold text-sm transition-colors shadow-lg shadow-violet-600/10"
                >
                  {editingHabitId ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
