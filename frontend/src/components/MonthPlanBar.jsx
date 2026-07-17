import { useState, useEffect } from 'react'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'
import { api } from '../services/api'

export function MonthPlanBar({ directions = [], month }) {
  const [targets, setTargets] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [error, setError] = useState(null)

  const monthStr = month || (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })()

  // Directions that need monthly plan (uploadable, not admin-scored, not 1_ijro)
  const planDirs = directions.filter(d =>
    d.is_uploadable && !d.admin_scored && d.key !== '10_nomenklatura'
  )

  useEffect(() => {
    if (!planDirs.length) return
    setLoading(true)
    Promise.all(
      planDirs.map(d =>
        api.getMonthPlan(d.key, monthStr)
          .then(data => ({
            key: d.key,
            target: data.target_count ?? (d.default_target > 0 ? d.default_target : 1),
          }))
          .catch(() => ({
            key: d.key,
            target: d.default_target > 0 ? d.default_target : 1,
          }))
      )
    ).then(results => {
      const init = {}
      for (const { key, target } of results) init[key] = target || 1
      setTargets(init)
    }).finally(() => setLoading(false))
  }, [directions.length, monthStr]) // eslint-disable-line

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      for (const dir of planDirs) {
        const count = targets[dir.key]
        if (count > 0) {
          await api.saveMonthPlan(dir.key, monthStr, count, undefined)
        }
      }
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Oylik Reja</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Har yo'nalish uchun oyda nechta topshiriq kutilishini kiriting.
          Ball avtomatik taqsimlanadi: <span className="text-blue-400">max ball ÷ reja soni</span>
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Yo'nalish
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-28">
                Max ball
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-36">
                Oylik reja (ta)
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-32">
                Ball / topshiriq
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {planDirs.map(dir => {
              const count = targets[dir.key] || 1
              const perItem = count > 0
                ? (dir.max_score / count).toFixed(2)
                : '—'
              return (
                <tr key={dir.key} className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3 text-slate-700 dark:text-slate-200 font-medium">{dir.label}</td>
                  <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">{dir.max_score}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={count}
                      onChange={e => {
                        const n = Math.max(1, parseInt(e.target.value) || 1)
                        setTargets(p => ({ ...p, [dir.key]: n }))
                      }}
                      className="w-full text-center bg-white border border-slate-300 dark:bg-slate-700 dark:border-slate-600 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center text-emerald-400 font-bold text-base">
                    {perItem}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          {saving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />}
          Saqlash
        </button>
        {savedMsg && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Reja saqlandi!
          </span>
        )}
      </div>
    </div>
  )
}
