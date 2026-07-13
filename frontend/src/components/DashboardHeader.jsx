import { Users, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react'

export function DashboardHeader({ stats }) {
  const totalSariq = stats.reduce((s, d) => s + d.sariq_count, 0)
  const totalYashil = stats.reduce((s, d) => s + d.yashil_count, 0)
  const totalQizil = stats.reduce((s, d) => s + d.qizil_count, 0)
  const total = totalSariq + totalYashil + totalQizil
  const avgPct = stats.length
    ? Math.round(stats.reduce((s, d) => s + d.percentage, 0) / stats.length)
    : 0

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Yoshlar Yetakchilari KPI</h1>
            <p className="text-slate-600 mt-1">Asaka tumani — ishlash ko'rsatkichlarini kuzatib borish</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-xs text-slate-600">Jami Yetakchilar</p>
              <p className="text-xl font-bold text-blue-900">76</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-semibold text-slate-700">O'rtacha Foiz</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">{avgPct}%</p>
            <p className="text-xs text-slate-600 mt-1">10 yo'nalish bo'yicha</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-slate-700">Tasdiqlanganlar</p>
            </div>
            <p className="text-2xl font-bold text-green-900">{totalYashil}</p>
            <p className="text-xs text-slate-600 mt-1">topshiriq</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-semibold text-slate-700">Kutilayotganlar</p>
            </div>
            <p className="text-2xl font-bold text-amber-900">{totalSariq}</p>
            <p className="text-xs text-slate-600 mt-1">tekshiruv kutmoqda</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-red-600" />
              <p className="text-xs font-semibold text-slate-700">Rad etilganlar</p>
            </div>
            <p className="text-2xl font-bold text-red-900">{totalQizil}</p>
            <p className="text-xs text-slate-600 mt-1">topshiriq</p>
          </div>
        </div>
      </div>
    </header>
  )
}
