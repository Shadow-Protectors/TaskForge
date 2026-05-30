'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { calculateStreak } from '@/lib/habits/streak'
import {
  Folder,
  Flame,
  Trophy,
  Sparkles,
  Clock,
  ChevronRight,
  ClipboardList,
  ArrowRight,
  UserCheck
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface Project {
  id: string
  name: string
  owner_id: string
  created_at: string
}

interface Habit {
  id: string
  name: string
  emoji: string
  color: string
}

interface Completion {
  id: string
  habit_id: string
  date: string
}

interface ActivityLog {
  id: string
  action: string
  created_at: string
  project_id: string
  projects: { name: string }
  profiles: { name: string }
}

interface Props {
  userId: string
  habits: Habit[]
  initialCompletions: Completion[]
  initialCompletionsCount: number
  activities: ActivityLog[]
  projects: Project[]
  todayStr: string
}

export default function DashboardClient({
  userId,
  habits,
  initialCompletions,
  initialCompletionsCount,
  activities,
  projects,
  todayStr,
}: Props) {
  const supabase = createClient()
  const [completions, setCompletions] = useState<Completion[]>(initialCompletions)
  const [completionsCount, setCompletionsCount] = useState(initialCompletionsCount)
  const [, startTransition] = useTransition()

  const handleToggleHabit = async (habitId: string) => {
    const existing = completions.find(c => c.habit_id === habitId && c.date === todayStr)

    if (existing) {
      // Optimistic update
      setCompletions(prev => prev.filter(c => c.id !== existing.id))
      setCompletionsCount(c => Math.max(0, c - 1))

      const { error } = await supabase
        .from('completions')
        .delete()
        .eq('id', existing.id)

      if (error) {
        // Rollback on error
        setCompletions(prev => [...prev, existing])
        setCompletionsCount(c => c + 1)
      }
    } else {
      const tempId = `temp-${Date.now()}`
      const newCompletion = { id: tempId, habit_id: habitId, date: todayStr }

      // Optimistic update
      setCompletions(prev => [newCompletion, ...prev])
      setCompletionsCount(c => c + 1)

      confetti({
        particleCount: 60,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#a78bfa', '#34d399', '#60a5fa']
      })

      const { data, error } = await supabase
        .from('completions')
        .insert([{ user_id: userId, habit_id: habitId, date: todayStr }])
        .select()
        .single()

      if (error) {
        // Rollback
        setCompletions(prev => prev.filter(c => c.id !== tempId))
        setCompletionsCount(c => Math.max(0, c - 1))
      } else if (data) {
        // Replace temp with real record
        setCompletions(prev => prev.map(c => c.id === tempId ? data : c))
      }
    }
  }

  const getHabitStreak = (habitId: string) => {
    const dates = completions.filter(c => c.habit_id === habitId).map(c => c.date)
    return calculateStreak(dates)
  }

  // Gamification levels
  const XP_PER_LEVEL = 100
  const totalXp = completionsCount * 10
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
  const xpInCurrentLevel = totalXp % XP_PER_LEVEL
  const progressPercent = (xpInCurrentLevel / XP_PER_LEVEL) * 100

  const achievements = [
    { name: 'Getting Started', desc: 'Complete 1 habit', threshold: 1, icon: '🌱' },
    { name: 'Week Warrior', desc: 'Complete 7 habits', threshold: 7, icon: '⚔️' },
    { name: 'Consistency King', desc: 'Complete 50 habits', threshold: 50, icon: '👑' }
  ]
  const unlockedAchievements = achievements.filter(a => completionsCount >= a.threshold)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* Banner / Title */}
      <div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Command Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Your collaborative snapshot and personal checklist for today.
        </p>
      </div>

      {/* Main Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Team Projects & Live Activity */}
        <div className="lg:col-span-2 space-y-8">

          {/* Projects Summary */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2.5">
                <ClipboardList className="w-5 h-5 text-indigo-400" />
                <span>My Active Workspace</span>
              </h2>
              <span className="text-xs font-semibold bg-indigo-950/50 text-indigo-300 px-3 py-1 rounded-full border border-indigo-900/30">
                {projects.length} Projects
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl">
                <Folder className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                <p className="text-sm text-slate-500">No active projects. Use the sidebar to create one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group bg-slate-950/40 border border-slate-900/80 rounded-2xl p-5 hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 bg-indigo-950/50 border border-indigo-900/30 rounded-xl flex items-center justify-center mb-3">
                        <Folder className="w-5 h-5 text-indigo-400 group-hover:scale-105 transition-transform" />
                      </div>
                      <h3 className="font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold mt-4 justify-end group-hover:translate-x-0.5 transition-transform">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Activity Logs */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>Workspace Activity Feed</span>
            </h2>

            {activities.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-4">No recent task activities to display.</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start justify-between border-b border-slate-800/30 pb-3.5 last:border-b-0 last:pb-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 animate-pulse" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          <span className="font-bold text-slate-200">{activity.profiles?.name || 'Someone'}</span>{' '}
                          {activity.action}
                        </p>
                        <span className="text-xs text-slate-500 font-medium">
                          In {activity.projects?.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 shrink-0 font-bold pl-2">
                      {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Personal Habits & Gamification */}
        <div className="space-y-8">

          {/* Gamification Level Status */}
          <div className="bg-gradient-to-br from-violet-950/20 via-indigo-950/10 to-emerald-950/5 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

            <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-violet-400" />
              <span>Profile Badge</span>
            </h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-violet-500/10">
                <span className="text-xs font-bold text-violet-200 uppercase tracking-widest leading-none">Lvl</span>
                <span className="text-xl font-black text-white leading-none mt-1">{level}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
                  <span>XP Progress</span>
                  <span>{xpInCurrentLevel} / 100 XP</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  {totalXp} XP across {completionsCount} completions
                </p>
              </div>
            </div>

            {unlockedAchievements.length > 0 && (
              <div className="border-t border-slate-800/60 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unlocked</p>
                <div className="flex flex-wrap gap-1.5">
                  {unlockedAchievements.map(a => (
                    <span
                      key={a.name}
                      className="text-xs bg-violet-950/40 text-violet-300 border border-violet-900/40 px-2 py-0.5 rounded-full font-semibold"
                    >
                      {a.icon} {a.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Today's Habits Checklist */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-violet-400" />
                <span>Today's Habits</span>
              </h2>
              <Link
                href="/habits"
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-0.5"
              >
                <span>Manage</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {habits.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-xs">No habits configured.</p>
                <Link href="/habits" className="text-xs text-violet-400 hover:underline mt-2 inline-block font-semibold">
                  Configure Habits →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => {
                  const isDone = completions.some(c => c.habit_id === habit.id && c.date === todayStr)
                  const currentStreak = getHabitStreak(habit.id)

                  return (
                    <div
                      key={habit.id}
                      onClick={() => handleToggleHabit(habit.id)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer select-none transition-all duration-200 ${
                        isDone
                          ? 'bg-slate-950/60 border-slate-800/80'
                          : 'bg-slate-950/20 border-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{habit.emoji}</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {habit.name}
                          </p>
                          {currentStreak > 0 && (
                            <div className="flex items-center gap-0.5 text-orange-400 font-bold text-xs mt-0.5">
                              <Flame className="w-3 h-3 fill-orange-400" />
                              <span>{currentStreak}d streak</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                          isDone ? 'border-transparent' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: isDone ? habit.color : 'transparent' }}
                      >
                        <span className={`text-xs font-black ${isDone ? 'text-slate-950' : 'text-transparent'}`}>✓</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  )
}
