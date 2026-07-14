import { useState, useEffect } from 'react'
import { BarChart2, Trophy, LogOut, Menu, X } from 'lucide-react'
import { api } from '../services/api'
import { DistrictsRanking } from './DistrictsRanking'
import { DailyScoreTable } from './DailyScoreTable'
import { TaskSlider } from './TaskSlider'

const NAV_UMUMIY = '__umumiy__'
const NAV_YONALISH = '__yonalish__'

export function AdminPanel({ user, directions: directionsProp = [], onLogout }) {
  const [month, setMonth] = useState('')
  const [stats, setStats] = useState([])
  const [nav, setNav] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const activeMonthParam = month || null

  useEffect(() => {
    if (directionsProp.length > 0 && !nav) {
      setNav(directionsProp[0].key)
    }
  }, [directionsProp])

  useEffect(() => {
    api.getDashboardStats(activeMonthParam)
      .then(setStats)
      .catch(() => setStats([]))
  }, [activeMonthParam])

  const directions = directionsProp.map(d => {
    const stat = stats.find(s => s.direction === d.key)
    return {
      key: d.key,
      label: d.label,
      maxScore: d.max_score,
      adminScored: d.admin_scored,
      pending: stat?.sariq_count ?? 0,
    }
  })

  const activeDirection = directions.find(d => d.key === nav)
  const totalPending = stats.reduce((s, d) => s + (d.sariq_count ?? 0), 0)

  const handleNav = (key) => {
    setNav(key)
    setMobileSidebarOpen(false)
  }

  function renderMain() {
    if (!nav) return null

    if (nav === NAV_UMUMIY || nav === NAV_YONALISH) {
      return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <DistrictsRanking
            initialTab={nav === NAV_UMUMIY ? 'umumiy' : 'yonalish'}
            month={activeMonthParam}
            hideTabs={true}
          />
        </div>
      )
    }

    if (activeDirection?.adminScored) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{activeDirection?.label}</h2>
            <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
              Admin tomonidan baholanadi (max {activeDirection?.maxScore} ball)
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <DailyScoreTable
              direction={nav}
              maxScore={nav === '1_ijro' ? 1 : activeDirection?.maxScore}
              month={activeMonthParam}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">{activeDirection?.label}</h2>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            Yuklangan materiallarni tekshirish va baholash — max {activeDirection?.maxScore} ball
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <TaskSlider
            key={nav}
            direction={nav}
            maxScore={activeDirection?.maxScore ?? 0}
            month={activeMonthParam}
          />
        </div>
      </div>
    )
  }

  const sidebarContent = (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2 px-2">10 ta yo'nalish</p>
        <nav className="space-y-0.5">
          {directions.map(d => (
            <button
              key={d.key}
              onClick={() => handleNav(d.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                nav === d.key ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="truncate text-left leading-snug">{d.label}</span>
              {d.pending > 0 && (
                <span className={`ml-2 flex-shrink-0 text-xs font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center ${
                  nav === d.key ? 'bg-white/20' : 'bg-red-500 text-white'
                }`}>{d.pending}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2 px-2">Reytinglar</p>
        <nav className="space-y-0.5">
          <button
            onClick={() => handleNav(NAV_UMUMIY)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              nav === NAV_UMUMIY ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 flex-shrink-0" /> Umumiy reyting
          </button>
          <button
            onClick={() => handleNav(NAV_YONALISH)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              nav === NAV_YONALISH ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4 flex-shrink-0" /> Yo'nalish bo'yicha
          </button>
        </nav>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900 flex-shrink-0">
        <div className="container py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger — only on mobile */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">⚙</span>
            <h1 className="text-sm sm:text-base font-bold truncate">Admin Panel</h1>
            {totalPending > 0 && (
              <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                {totalPending}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 hidden sm:block">Oy:</label>
              <input
                type="month"
                className="text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-32 sm:w-auto"
                onChange={e => setMonth(e.target.value ? `${e.target.value}-01` : '')}
              />
              {month && (
                <button onClick={() => setMonth('')} className="text-xs text-slate-500 hover:text-slate-300 underline hidden sm:block">
                  Tozalash
                </button>
              )}
            </div>
            <span className="text-sm text-slate-400 hidden md:block truncate max-w-32">
              {user.full_name || user.username}
              {user.is_superuser && (
                <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">Superadmin</span>
              )}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-bold text-slate-100">Yo'nalishlar</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex flex-1 container py-6 gap-6 items-start">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 space-y-5 sticky top-6 max-h-[calc(100vh-5rem)] overflow-y-auto">
          {sidebarContent}
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-y-auto max-h-[calc(100vh-5rem)]">
          {renderMain()}
        </main>
      </div>
    </div>
  )
}
