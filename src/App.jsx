import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useHabits } from './hooks/useHabits'
import { useCompletions } from './hooks/useCompletions'
import AuthPage from './components/auth/AuthPage'
import Header from './components/layout/Header'
import TabNav from './components/layout/TabNav'
import TodayPage from './pages/TodayPage'
import WeekPage from './pages/WeekPage'
import ReportPage from './pages/ReportPage'

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('today')
  const [darkMode, setDarkMode] = useState(getSystemDark)

  // Apply dark class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id

  const {
    habits,
    loading: habitsLoading,
    addHabit,
    updateHabit,
    deleteHabit,
  } = useHabits(userId)

  const {
    completions,
    loading: completionsLoading,
    toggleCompletion,
  } = useCompletions(userId)

  const loading = habitsLoading || completionsLoading

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-2xl">🔥</span>
          </div>
          <p className="text-slate-400 text-sm">Loading HabitFlow…</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  return (
    <div className="min-h-screen">
      <Header
        user={session.user}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Tab navigation */}
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Page content */}
        <div>
          {activeTab === 'today' && (
            <TodayPage
              habits={habits}
              completions={completions}
              loading={loading}
              onAddHabit={addHabit}
              onUpdateHabit={updateHabit}
              onDeleteHabit={deleteHabit}
              onToggle={toggleCompletion}
            />
          )}
          {activeTab === 'week' && (
            <WeekPage
              habits={habits}
              completions={completions}
              onToggle={toggleCompletion}
            />
          )}
          {activeTab === 'report' && (
            <ReportPage
              habits={habits}
              completions={completions}
            />
          )}
        </div>
      </main>
    </div>
  )
}
