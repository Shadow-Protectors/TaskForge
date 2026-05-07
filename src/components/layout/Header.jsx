import { supabase } from '../../lib/supabase'
import { APP_NAME } from '../../config/constants'

export default function Header({ user, darkMode, onToggleDark }) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-lg">🔥</span>
          </div>
          <span className="font-bold text-lg gradient-text hidden sm:block">{APP_NAME}</span>
        </div>

        {/* User info + controls */}
        <div className="flex items-center gap-2">
          {user && (
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-[140px]">
              {user.email}
            </span>
          )}

          {/* Dark mode toggle */}
          <button
            id="dark-mode-toggle"
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
            className="btn-ghost rounded-xl p-2.5"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Logout */}
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="btn-ghost rounded-xl px-3 py-2 text-sm font-medium"
          >
            <span className="hidden sm:inline">Sign out</span>
            <svg className="w-5 h-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
