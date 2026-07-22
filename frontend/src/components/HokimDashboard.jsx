import { useState } from 'react'
import { LogOut, Moon, Sun, BarChart3, MapPin } from 'lucide-react'
import { DistrictsRanking } from './DistrictsRanking'
import { GpsPage } from './GpsPage'
import { api } from '../services/api'

const THIS_MONTH = new Date().toISOString().slice(0, 7) + '-01'

export function HokimDashboard({ user, directions, onLogout, darkMode, toggleDark }) {
  const [monthFrom, setMonthFrom] = useState(THIS_MONTH)
  const [monthTo, setMonthTo]     = useState(THIS_MONTH)
  const [tab, setTab]             = useState('reyting') // 'reyting' | 'gps'

  return (
    <div className={`h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950`}>
      {/* Header */}
      <header id="admin-header" className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tab === 'gps' ? 'bg-green-600' : 'bg-blue-600'}`}>
              {tab === 'gps' ? <MapPin className="w-5 h-5 text-white" /> : <BarChart3 className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white leading-none text-sm sm:text-base">
                {tab === 'gps' ? 'Mусора mashinalari kuzatuvi' : 'Yoshlar KPI'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {tab === 'gps' ? 'Asaka tuman — jonli GPS monitoring' : 'Asaka tuman hokimi'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setTab('reyting')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === 'reyting'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Reyting
              </button>
              <button
                onClick={() => setTab('gps')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === 'gps'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <MapPin className="w-4 h-4" />
                GPS
              </button>
            </div>

            <span className="hidden sm:block text-sm text-slate-600 dark:text-slate-300">
              {user.full_name || user.username}
            </span>
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      {tab === 'gps' ? (
        <div className="flex flex-1 overflow-hidden min-h-0">
          <GpsPage />
        </div>
      ) : (
        <>
          {/* Date filter bar */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Davr:</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 dark:text-slate-400">Dan</label>
                <input
                  type="month"
                  value={monthFrom ? monthFrom.slice(0, 7) : ''}
                  onChange={e => setMonthFrom(e.target.value ? e.target.value + '-01' : '')}
                  className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 dark:text-slate-400">Gacha</label>
                <input
                  type="month"
                  value={monthTo ? monthTo.slice(0, 7) : ''}
                  onChange={e => setMonthTo(e.target.value ? e.target.value + '-01' : '')}
                  className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => { setMonthFrom(THIS_MONTH); setMonthTo(THIS_MONTH) }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Joriy oy
              </button>
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto max-w-screen-2xl mx-auto w-full">
            <DistrictsRanking
              monthFrom={monthFrom}
              monthTo={monthTo}
              directions={directions}
              apiMethod={api.getHokimRanking}
            />
          </main>
        </>
      )}
    </div>
  )
}
