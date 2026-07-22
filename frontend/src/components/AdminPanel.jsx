import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart2, Trophy, LogOut, Menu, X, LayoutGrid, CalendarDays, Users, UserPlus, Sliders, Archive, MapPin, UserCog, Eye, EyeOff } from 'lucide-react'
import { api } from '../services/api'
import { DistrictsRanking } from './DistrictsRanking'
import { DailyScoreTable } from './DailyScoreTable'
import { TaskSlider } from './TaskSlider'
import { MonthPlanBar } from './MonthPlanBar'
import { MFYStatusPanel } from './MFYStatusPanel'
import { SAUserList, SACreateUser, SAScores, SADirections, SAMediaManager } from './SuperAdminPanel'
import { GpsPage } from './GpsPage'

const NAV_UMUMIY    = '__umumiy__'
const NAV_YONALISH  = '__yonalish__'
const NAV_REJA      = '__reja__'
const NAV_SA_USERS  = '__sa_users__'
const NAV_SA_CREATE = '__sa_create__'
const NAV_SA_SCORES = '__sa_scores__'
const NAV_SA_DIRS   = '__sa_dirs__'
const NAV_SA_MEDIA  = '__sa_media__'
const NAV_GPS       = '__gps__'

// URL segment  ↔  internal nav key
const URL_TO_NAV = {
  reja: NAV_REJA, reyting: NAV_UMUMIY, yonalish: NAV_YONALISH,
  'sa-users': NAV_SA_USERS, 'sa-create': NAV_SA_CREATE, 'sa-scores': NAV_SA_SCORES,
  'sa-dirs': NAV_SA_DIRS, 'sa-media': NAV_SA_MEDIA, 'gps': NAV_GPS,
}
const NAV_TO_URL = {
  [NAV_REJA]: 'reja', [NAV_UMUMIY]: 'reyting', [NAV_YONALISH]: 'yonalish',
  [NAV_SA_USERS]: 'sa-users', [NAV_SA_CREATE]: 'sa-create', [NAV_SA_SCORES]: 'sa-scores',
  [NAV_SA_DIRS]: 'sa-dirs', [NAV_SA_MEDIA]: 'sa-media', [NAV_GPS]: 'gps',
}

function toMonthParam(val) {
  return val ? `${val}-01` : null
}

function AdminProfileModal({ user, onClose, onUpdated }) {
  const [username, setUsername]       = useState(user?.username || '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showOld, setShowOld]         = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState(null)
  const [success, setSuccess]         = useState(null)

  const handleSave = async () => {
    setError(null); setSuccess(null)
    if (username === (user?.username || '') && !newPassword) {
      setError("O'zgartirish uchun kamida login yoki parolni to'ldiring"); return
    }
    setSaving(true)
    try {
      const res = await api.updateProfile({ username, old_password: oldPassword, new_password: newPassword })
      setSuccess(res.message)
      setOldPassword(''); setNewPassword('')
      if (onUpdated) onUpdated(res.username)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Profil sozlamalari</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Login (username)</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white text-slate-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Parolni o'zgartirish</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Eski parol</label>
                <div className="relative">
                  <input type={showOld ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                    placeholder="Joriy parol"
                    className="w-full pr-9 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white text-slate-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowOld(p => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Yangi parol</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Kamida 6 ta belgi"
                    className="w-full pr-9 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white text-slate-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowNew(p => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {error   && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>}
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600">
            Yopish
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminPanel({ user, directions: directionsProp = [], onLogout, darkMode, toggleDark }) {
  const { '*': urlPage = '' } = useParams()
  const navigate = useNavigate()

  const curMonth = new Date().toISOString().slice(0, 7)
  const [monthFrom, setMonthFrom]                 = useState(curMonth)
  const [monthTo, setMonthTo]                     = useState(curMonth)
  const [stats, setStats]                         = useState([])
  const [subView, setSubView]                     = useState('tasks') // 'tasks' | 'plan' | 'mfy'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen]             = useState(false)
  const [currentUser, setCurrentUser]             = useState(user)

  // nav is derived from URL — no useState needed
  const nav = URL_TO_NAV[urlPage] || urlPage || ''

  // When directions load and URL has no page, redirect to first direction
  useEffect(() => {
    if (directionsProp.length > 0 && !urlPage) {
      navigate(`/admin/${directionsProp[0].key}`, { replace: true })
    }
  }, [directionsProp, urlPage])

  // Reset subView when page changes
  useEffect(() => { setSubView('tasks') }, [urlPage])

  const activeMonthFrom = toMonthParam(monthFrom)
  const activeMonthTo   = toMonthParam(monthTo)
  const activeMonth     = activeMonthFrom

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

  const activeDirection  = directions.find(d => d.key === nav)
  const totalPending = stats.reduce((s, d) => s + (d.sariq_count ?? 0), 0)

  const handleNav = (key) => {
    navigate(`/admin/${NAV_TO_URL[key] || key}`)
    setMobileSidebarOpen(false)
  }

  const clearMonths = () => { const m = new Date().toISOString().slice(0, 7); setMonthFrom(m); setMonthTo(m) }

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

    // GPS page
    if (nav === NAV_GPS) return <GpsPage darkMode={darkMode} />

    // Superadmin pages
    if (nav === NAV_SA_USERS)  return <SAUserList />
    if (nav === NAV_SA_CREATE) return <SACreateUser />
    if (nav === NAV_SA_SCORES) return <SAScores directions={directionsProp} />
    if (nav === NAV_SA_DIRS)   return <SADirections />
    if (nav === NAV_SA_MEDIA)  return <SAMediaManager />

    // Ranking views
    if (nav === NAV_UMUMIY || nav === NAV_YONALISH) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <DistrictsRanking
            initialTab={nav === NAV_UMUMIY ? 'umumiy' : 'yonalish'}
            monthFrom={activeMonthFrom}
            monthTo={activeMonthTo || activeMonthFrom}
            hideTabs={true}
            directions={directionsProp}
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

      {user?.is_superuser && (
        <div className="pt-4 border-t border-amber-500/30 dark:border-amber-500/20">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2 px-2">Superadmin</p>
          <nav className="space-y-0.5">
            <button onClick={() => handleNav(NAV_SA_USERS)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                nav === NAV_SA_USERS ? 'bg-amber-500 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}>
              <Users className="w-4 h-4 flex-shrink-0" /> Foydalanuvchilar
            </button>
            <button onClick={() => handleNav(NAV_SA_CREATE)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                nav === NAV_SA_CREATE ? 'bg-amber-500 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}>
              <UserPlus className="w-4 h-4 flex-shrink-0" /> Yangi akkaunt
            </button>
            <button onClick={() => handleNav(NAV_SA_SCORES)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                nav === NAV_SA_SCORES ? 'bg-amber-500 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}>
              <Sliders className="w-4 h-4 flex-shrink-0" /> Ball o'zgartirish
            </button>
            <button onClick={() => handleNav(NAV_SA_DIRS)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                nav === NAV_SA_DIRS ? 'bg-amber-500 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}>
              <LayoutGrid className="w-4 h-4 flex-shrink-0" /> Yo'nalishlar
            </button>
            <button onClick={() => handleNav(NAV_SA_MEDIA)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                nav === NAV_SA_MEDIA ? 'bg-amber-500 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}>
              <Archive className="w-4 h-4 flex-shrink-0" /> Media fayllar
            </button>
          </nav>
        </div>
      )}
    </div>
  )

  return (
    <div className="h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div id="admin-header" className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex-shrink-0">
        <div className="container py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${nav === NAV_GPS ? 'bg-green-600' : 'bg-blue-600'}`}>
                {nav === NAV_GPS ? <MapPin className="w-4 h-4" /> : '⚙'}
              </span>
              <div className="hidden sm:block">
                <h1 className="text-sm sm:text-base font-bold leading-none">
                  {nav === NAV_GPS ? 'Musora mashinalari kuzatuvi' : 'Yoshlar KPI'}
                </h1>
                {nav === NAV_GPS && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Asaka tuman — jonli GPS monitoring</p>
                )}
              </div>
            </div>

            {user?.is_superuser && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex-shrink-0">
                <button
                  onClick={() => directionsProp.length > 0 && handleNav(directionsProp[0].key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    nav !== NAV_GPS
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}>
                  <BarChart2 className="w-4 h-4" />
                  <span className="hidden sm:inline">KPI</span>
                </button>
                <button
                  onClick={() => handleNav(NAV_GPS)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    nav === NAV_GPS
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}>
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">GPS</span>
                </button>
              </div>
            )}

            {totalPending > 0 && nav !== NAV_GPS && (
              <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full flex-shrink-0" title="Kutilmoqda">
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

            <button onClick={() => setProfileOpen(true)}
              title="Profil sozlamalari"
              className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden md:flex truncate max-w-40">
              <span className="truncate">{currentUser?.full_name || currentUser?.username || user.full_name || user.username}</span>
              {user.is_superuser && (
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full flex-shrink-0">Superadmin</span>
              )}
              <UserCog className="w-4 h-4 flex-shrink-0" />
            </button>

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

      {nav === NAV_GPS ? (
        <div className="flex flex-1 overflow-hidden min-h-0">
          {renderMain()}
        </div>
      ) : (
        <div className="flex flex-1 container py-6 gap-6 items-start">
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-5 sticky top-6 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {sidebarContent}
          </aside>
          <main className="flex-1 min-w-0 overflow-y-auto max-h-[calc(100vh-5rem)]">
            {renderMain()}
          </main>
        </div>
      )}

      {profileOpen && (
        <AdminProfileModal
          user={currentUser || user}
          onClose={() => setProfileOpen(false)}
          onUpdated={(newUsername) => {
            setCurrentUser(u => ({ ...u, username: newUsername || u?.username }))
            setProfileOpen(false)
          }}
        />
      )}
    </div>
  )
}
