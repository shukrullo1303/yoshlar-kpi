import { useState, useEffect } from 'react'
import { BarChart2, Trophy, LogOut, Menu, X, LayoutGrid, CalendarDays, Lock } from 'lucide-react'
import { api } from '../services/api'
import { DistrictsRanking } from './DistrictsRanking'
import { DailyScoreTable } from './DailyScoreTable'
import { TaskSlider } from './TaskSlider'
import { MonthPlanBar } from './MonthPlanBar'
import { MFYStatusPanel } from './MFYStatusPanel'

const NAV_UMUMIY   = '__umumiy__'
const NAV_YONALISH = '__yonalish__'
const NAV_REJA     = '__reja__'

function toMonthParam(val) {
  return val ? `${val}-01` : null
}

export function AdminPanel({ user, directions: directionsProp = [], onLogout, darkMode, toggleDark }) {
  const [monthFrom, setMonthFrom]                 = useState('')
  const [monthTo, setMonthTo]                     = useState('')
  const [stats, setStats]                         = useState([])
  const [nav, setNav]                             = useState('')
  const [subView, setSubView]                     = useState('tasks') // 'tasks' | 'plan' | 'mfy'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [rejaDirection, setRejaDirection]         = useState('')

  const activeMonthFrom = toMonthParam(monthFrom)
  const activeMonthTo   = toMonthParam(monthTo)
  const activeMonth     = activeMonthFrom

  useEffect(() => {
    if (directionsProp.length > 0 && !nav) {
      setNav(directionsProp[0].key)
    }
  }, [directionsProp])

  useEffect(() => {
    api.getDashboardStats(activeMonthFrom, activeMonthTo || activeMonthFrom)
      .then(setStats)
      .catch(() => setStats([]))
  }, [activeMonthFrom, activeMonthTo])

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
  const totalPending    = stats.reduce((s, d) => s + (d.sariq_count ?? 0), 0)

  const handleNav = (key) => {
    setNav(key)
    setSubView('tasks')
    setMobileSidebarOpen(false)
  }

  const clearMonths = () => { setMonthFrom(''); setMonthTo('') }

  // Sub-tabs rendered for non-admin-scored directions
  function SubTabs({ includeAdminScored = false }) {
    const tabs = includeAdminScored
      ? [
          { key: 'tasks', label: 'Topshiriqlar' },
          { key: 'mfy',   label: "MFYlar kesimida", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
        ]
      : [
          { key: 'tasks', label: 'Topshiriqlar' },
          { key: 'mfy',   label: "MFYlar kesimida", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
        ]
    return (
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setSubView(t.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              subView === t.key ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
    )
  }

  function renderMain() {
    if (!nav) return null

    // Ranking views
    if (nav === NAV_UMUMIY || nav === NAV_YONALISH) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <DistrictsRanking
            initialTab={nav === NAV_UMUMIY ? 'umumiy' : 'yonalish'}
            monthFrom={activeMonthFrom}
            monthTo={activeMonthTo || activeMonthFrom}
            hideTabs={true}
          />
        </div>
      )
    }

    // Dedicated Reja page
    if (nav === NAV_REJA) {
      return (
        <MonthPlanBar
          directions={directionsProp}
          month={activeMonth}
        />
      )
    }

    // Admin-scored directions (e.g. 1_ijro)
    if (activeDirection?.adminScored) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{activeDirection?.label}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Admin tomonidan baholanadi (max {activeDirection?.maxScore} ball)</p>
            </div>
            <SubTabs includeAdminScored />
          </div>
          {subView === 'mfy' ? (
            <MFYStatusPanel
              directions={directions}
              fixedDirection={nav}
              monthFrom={activeMonthFrom}
              monthTo={activeMonthTo || activeMonthFrom}
            />
          ) : (() => {
            // 10_nomenklatura locks until 25th of the selected month
            if (nav === '10_nomenklatura') {
              const today = new Date()
              const refMonth = activeMonth || `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`
              const [y, m] = refMonth.split('-').map(Number)
              const unlockDate = new Date(y, m - 1, 25)
              if (today < unlockDate) {
                const UZ_MONTHS_SHORT = ['Yan','Fev','Mar','Apr','May','Iyu','Iyu','Avg','Sen','Okt','Noy','Dek']
                return (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200">Baholash hali ochilmagan</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        10-yo'nalish baholash <span className="text-amber-400 font-semibold">25-{UZ_MONTHS_SHORT[m-1]}</span>dan keyin ochiladi
                      </p>
                    </div>
                  </div>
                )
              }
            }
            return (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
                <DailyScoreTable
                  direction={nav}
                  maxScore={activeDirection?.maxScore}
                  month={activeMonth}
                />
              </div>
            )
          })()}
        </div>
      )
    }

    // Regular (uploadable) directions
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{activeDirection?.label}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {subView === 'tasks' && `Materiallarni tekshirish — max ${activeDirection?.maxScore} ball`}
              {subView === 'mfy'   && 'MFYlar kesimida topshiriq holati'}
            </p>
          </div>
          <SubTabs />
        </div>

        {subView === 'mfy' && (
          <MFYStatusPanel
            directions={directions}
            fixedDirection={nav}
            monthFrom={activeMonthFrom}
            monthTo={activeMonthTo || activeMonthFrom}
          />
        )}

        {subView === 'tasks' && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
              <TaskSlider
                key={nav}
                direction={nav}
                maxScore={activeDirection?.maxScore ?? 0}
                month={activeMonth}
              />
            </div>
          </>
        )}
      </div>
    )
  }

  const sidebarContent = (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2 px-2">10 ta yo'nalish</p>
        <nav className="space-y-0.5">
          {directions.map(d => (
            <button key={d.key} onClick={() => handleNav(d.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                nav === d.key ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}>
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

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2 px-2">Reja</p>
        <nav className="space-y-0.5 mb-4">
          <button onClick={() => handleNav(NAV_REJA)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              nav === NAV_REJA ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}>
            <CalendarDays className="w-4 h-4 flex-shrink-0" /> Oylik Reja
          </button>
        </nav>
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2 px-2">Reytinglar</p>
        <nav className="space-y-0.5">
          <button onClick={() => handleNav(NAV_UMUMIY)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              nav === NAV_UMUMIY ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}>
            <Trophy className="w-4 h-4 flex-shrink-0" /> Umumiy reyting
          </button>
          <button onClick={() => handleNav(NAV_YONALISH)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              nav === NAV_YONALISH ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}>
            <BarChart2 className="w-4 h-4 flex-shrink-0" /> Yo'nalish bo'yicha
          </button>
        </nav>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex-shrink-0">
        <div className="container py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">⚙</span>
            <h1 className="text-sm sm:text-base font-bold truncate">Admin Panel</h1>
            {totalPending > 0 && (
              <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                {totalPending}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 rounded-lg px-3 py-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Dan:</span>
              <input type="month" value={monthFrom} onChange={e => setMonthFrom(e.target.value)}
                className="text-xs sm:text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none w-28" />
              <span className="text-slate-400 dark:text-slate-600">—</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Gacha:</span>
              <input type="month" value={monthTo} min={monthFrom} onChange={e => setMonthTo(e.target.value)}
                className="text-xs sm:text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none w-28" />
              {(monthFrom || monthTo) && (
                <button onClick={clearMonths} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span className="text-sm text-slate-600 dark:text-slate-400 hidden md:block truncate max-w-32">
              {user.full_name || user.username}
              {user.is_superuser && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">Superadmin</span>
              )}
            </span>

            <button onClick={toggleDark}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title={darkMode ? 'Light mode' : 'Dark mode'}>
              {darkMode ? '☀️' : '🌙'}
            </button>

            <button onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
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
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 p-4 overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Yo'nalishlar</span>
              <button onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex flex-1 container py-6 gap-6 items-start">
        <aside className="hidden lg:block w-64 flex-shrink-0 space-y-5 sticky top-6 max-h-[calc(100vh-5rem)] overflow-y-auto">
          {sidebarContent}
        </aside>
        <main className="flex-1 min-w-0 overflow-y-auto max-h-[calc(100vh-5rem)]">
          {renderMain()}
        </main>
      </div>
    </div>
  )
}
