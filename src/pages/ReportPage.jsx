import { useState } from 'react'
import ReportModal from '../components/report/ReportModal'
import Heatmap from '../components/report/Heatmap'
import { getLastNDates } from '../hooks/useCompletions'
import { calculateCompletionRate, calculateLongestStreak } from '../hooks/useStreak'

export default function ReportPage({ habits, completions }) {
  const [showModal, setShowModal] = useState(false)
  const last7 = getLastNDates(7)

  const totalRate = habits.length > 0
    ? Math.round(habits.reduce((sum, h) => {
        const dates = completions.filter(c => c.habit_id === h.id).map(c => c.date)
        return sum + calculateCompletionRate(dates, last7)
      }, 0) / habits.length)
    : 0

  const perfectDays = last7.filter(date =>
    habits.length > 0 && habits.every(h =>
      completions.some(c => c.habit_id === h.id && c.date === date)
    )
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Insights</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Overview & Yearly activity</p>
        </div>
        <button
          id="open-report-btn"
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Full Report
        </button>
      </div>

      <Heatmap completions={completions} />

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="metric-card">
          <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">
            {totalRate}<span className="text-lg font-normal text-slate-400">%</span>
          </div>
          <div className="text-xs font-medium text-slate-500">Overall completion rate</div>
          <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-700"
              style={{ width: `${totalRate}%` }}
            />
          </div>
        </div>
        <div className="metric-card">
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {perfectDays}<span className="text-lg font-normal text-slate-400">/7</span>
          </div>
          <div className="text-xs font-medium text-slate-500">Perfect days</div>
          <div className="mt-2 text-xs text-slate-400">All habits completed</div>
        </div>
      </div>

      {/* Per-habit summary */}
      <div className="space-y-2">
        {habits.map(h => {
          const dates = completions.filter(c => c.habit_id === h.id).map(c => c.date)
          const rate = calculateCompletionRate(dates, last7)
          const done = last7.filter(d => dates.includes(d)).length
          const longest = calculateLongestStreak(dates)
          return (
            <div key={h.id} className="glass-card-solid p-4 flex items-center gap-4 animate-fade-in">
              <span className="text-2xl">{h.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{h.name}</p>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <span className="text-amber-500">🏆</span> {longest}d best
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all duration-700"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{done}/7 days</span>
                </div>
              </div>
              <div className="text-lg font-bold text-violet-600 dark:text-violet-400 w-12 text-right">{rate}%</div>
            </div>
          )
        })}

        {habits.length === 0 && (
          <div className="text-center py-16 glass-card-solid animate-fade-in">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-semibold text-slate-600 dark:text-slate-400">No data yet</p>
            <p className="text-sm text-slate-400 mt-1">Add habits and start completing them to see reports</p>
          </div>
        )}
      </div>

      {showModal && (
        <ReportModal
          habits={habits}
          completions={completions}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
