import { useState, useEffect } from 'react'

const COMMON_EMOJIS = ['✅', '💪', '📚', '🏃', '🧘', '💧', '🥗', '😴', '🎯', '✍️',
  '🎸', '🧹', '💊', '🌿', '🐕', '💻', '🎨', '🗣️', '🧠', '❤️']

export default function HabitForm({ habit, onSave, onClose }) {
  const [name, setName] = useState(habit?.name || '')
  const [emoji, setEmoji] = useState(habit?.emoji || '✅')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = Boolean(habit)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Habit name is required'); return }
    setLoading(true)
    setError('')
    try {
      await onSave(name.trim(), emoji)
      onClose()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md animate-scale-in border border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {isEdit ? 'Edit Habit' : 'Add New Habit'}
            </h2>
            <button
              id="habit-form-close"
              onClick={onClose}
              className="btn-ghost p-2 rounded-lg"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Emoji display + picker */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Icon</label>
              <div className="text-5xl text-center py-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl mb-3">
                {emoji}
              </div>
              <div className="grid grid-cols-10 gap-1.5">
                {COMMON_EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    id={`emoji-${e}`}
                    onClick={() => setEmoji(e)}
                    className={`text-xl p-1.5 rounded-xl transition-all duration-150 ${
                      emoji === e
                        ? 'bg-violet-100 dark:bg-violet-900/40 ring-2 ring-violet-500'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Name input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="habit-name-input">
                Habit Name
              </label>
              <input
                id="habit-name-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Morning run, Read 20 pages…"
                maxLength={80}
                autoFocus
                className="input-field"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                id="habit-form-submit"
                type="submit"
                disabled={loading || !name.trim()}
                className="btn-primary flex-1"
              >
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Habit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
