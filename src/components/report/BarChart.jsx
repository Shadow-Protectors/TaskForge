export default function BarChart({ value, maxValue = 100, color = '#7c3aed' }) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0
  const height = 60
  const barH = Math.round((pct / 100) * height)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="32" height={height} viewBox={`0 0 32 ${height}`} className="overflow-visible">
        {/* Background */}
        <rect x="4" y="0" width="24" height={height} rx="6" fill="currentColor"
          className="text-slate-100 dark:text-slate-700" />
        {/* Bar */}
        {barH > 0 && (
          <rect
            x="4"
            y={height - barH}
            width="24"
            height={barH}
            rx="6"
            fill={color}
            className="bar-animate"
            style={{ '--bar-height': `${barH}px` }}
          />
        )}
      </svg>
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{pct}%</span>
    </div>
  )
}
