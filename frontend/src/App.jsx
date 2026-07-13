import { useState, useEffect } from 'react'
import { DashboardHeader } from './components/DashboardHeader'
import { TaskCategories } from './components/TaskCategories'
import { DistrictsRanking } from './components/DistrictsRanking'
import { LoginPage } from './components/LoginPage'
import { api } from './services/api'
import { LogOut } from 'lucide-react'

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [stats, setStats] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState(null)
  const [month, setMonth] = useState('')

  // Sahifa ochilganda sessiya bor-yo'qligini tekshirish
  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  // Foydalanuvchi kirganida va oy o'zgarganda ma'lumot olish
  useEffect(() => {
    if (!user) return
    fetchStats()
  }, [user, month])

  const fetchStats = async () => {
    setDataLoading(true)
    setError(null)
    try {
      const data = await api.getDashboardStats(month || null)
      setStats(data)
    } catch (err) {
      if (err.message.includes('403') || err.message.includes('401')) {
        setUser(null)
      } else {
        setError(err.message)
      }
    } finally {
      setDataLoading(false)
    }
  }

  const handleLogout = async () => {
    try { await api.logout() } catch (_) {}
    setUser(null)
    setStats([])
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 border border-red-200 text-center max-w-md">
          <p className="text-red-600 font-semibold text-lg mb-2">Xato yuz berdi</p>
          <p className="text-slate-600 text-sm mb-4">{error}</p>
          <button onClick={fetchStats} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
            Qayta urinish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-end items-center gap-3 max-w-7xl mx-auto">
        <span className="text-sm text-slate-600">
          {user.full_name || user.username}
          {user.is_superuser && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Superadmin</span>}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Chiqish
        </button>
      </div>

      <DashboardHeader stats={stats} />

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-10">
        {/* Oy filtri */}
        <div className="flex items-center gap-4 bg-white rounded-lg px-4 py-3 border border-slate-200 shadow-sm w-fit">
          <label className="text-sm font-medium text-slate-700">Hisobot oyi:</label>
          <input
            type="month"
            className="text-sm border border-slate-300 rounded px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => setMonth(e.target.value ? `${e.target.value}-01` : '')}
          />
          {month && (
            <button onClick={() => setMonth('')} className="text-xs text-slate-500 hover:text-slate-700 underline">
              Tozalash
            </button>
          )}
        </div>

        <TaskCategories stats={stats} />
        <DistrictsRanking />
      </main>
    </div>
  )
}
