export default function TabNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'today', label: 'Today', icon: '✅' },
    { id: 'week', label: 'Week', icon: '📅' },
    { id: 'report', label: 'Report', icon: '📊' },
  ]

  return (
    <nav className="flex items-center bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1.5 gap-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={`tab-btn flex items-center gap-2 flex-1 justify-center ${
            activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'
          }`}
        >
          <span className="text-base leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
