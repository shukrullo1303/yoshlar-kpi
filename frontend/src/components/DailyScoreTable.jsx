import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Save, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { api } from '../services/api'

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isWeekend(d) {
  const day = d.getDay()
  return day === 0 || day === 6
}

function prevWorkday(d) {
  const prev = new Date(d)
  prev.setDate(prev.getDate() - 1)
  while (isWeekend(prev)) prev.setDate(prev.getDate() - 1)
  return prev
}

function nextWorkday(d) {
  const next = new Date(d)
  next.setDate(next.getDate() + 1)
  while (isWeekend(next)) next.setDate(next.getDate() + 1)
  return next
}

function todayOrLastWorkday() {
  const d = new Date()
  while (isWeekend(d)) d.setDate(d.getDate() - 1)
  return d
}

const DAY_NAMES = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const MONTH_NAMES = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

export function DailyScoreTable({ direction, maxScore, month }) {
  const isDaily = direction === '1_ijro'

  const [currentDate, setCurrentDate] = useState(() => {
    if (isDaily) return todayOrLastWorkday()
    return month ? new Date(month) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })

  const [rows, setRows] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const dateStr = toDateStr(currentDate)

  const loadScores = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      const data = await api.getBulkScores(direction, dateStr)
      setRows(data)
      const init = {}
      data.forEach(r => { init[r.profile_id] = r.score ?? (isDaily ? 0 : '') })
      setScores(init)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [direction, dateStr, isDaily])

  useEffect(() => { loadScores() }, [loadScores])

  useEffect(() => {
    if (!isDaily && month) {
      setCurrentDate(new Date(month))
    }
  }, [month, isDaily])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = rows.map(r => ({
        profile_id: r.profile_id,
        score: parseFloat(scores[r.profile_id] ?? 0) || 0,
      }))
      await api.saveBulkScores(direction, dateStr, payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await loadScores()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = (pid) => {
    setScores(prev => ({ ...prev, [pid]: prev[pid] === 1 ? 0 : 1 }))
  }

  const setScore = (pid, val) => {
    setScores(prev => ({ ...prev, [pid]: val }))
  }

  const scoredCount = rows.filter(r => (scores[r.profile_id] ?? 0) > 0).length
  const filledCount = rows.filter(r => {
    const s = scores[r.profile_id]
    return s !== null && s !== '' && s !== undefined && s !== 0
  }).length

  const isToday = isDaily && toDateStr(new Date()) === dateStr

  const dateLabel = isDaily
    ? `${DAY_NAMES[currentDate.getDay()]}, ${currentDate.getDate()} ${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2">
        <div className="flex items-center gap-2">
          {isDaily && (
            <button
              onClick={() => setCurrentDate(prevWorkday(currentDate))}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="px-2">
            <p className="font-semibold text-slate-800">{dateLabel}</p>
            {isDaily && isToday && <p className="text-xs text-blue-600 font-medium">Bugun</p>}
          </div>
          {isDaily && (
            <button
              onClick={() => setCurrentDate(nextWorkday(currentDate))}
              disabled={isToday}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
            {isDaily
              ? <><span className="font-bold text-blue-600">{scoredCount}</span> / {rows.length} ta baholandi</>
              : <><span className="font-bold text-blue-600">{filledCount}</span> / {rows.length} ta to'ldirildi</>
            }
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Saqlandi
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Saqlash
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white text-xs">
                <th className="px-4 py-3 text-left w-10">#</th>
                <th className="px-4 py-3 text-left">MFY nomi</th>
                <th className="px-4 py-3 text-center">
                  {isDaily ? 'Qatnashdi (0 / 1)' : `Ball (0 – ${maxScore})`}
                </th>
                {isDaily && <th className="px-4 py-3 text-center w-28">Holat</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => {
                const score = scores[row.profile_id] ?? (isDaily ? 0 : '')
                const isPresent = isDaily ? score === 1 : null
                const rowBg = isDaily
                  ? (isPresent ? 'bg-emerald-50' : 'bg-white')
                  : 'bg-white hover:bg-slate-50'

                return (
                  <tr key={row.profile_id} className={`transition-colors ${rowBg}`}>
                    <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{row.mahalla_name} MFY</td>
                    <td className="px-4 py-2.5 text-center">
                      {isDaily ? (
                        <button
                          onClick={() => toggle(row.profile_id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {isPresent
                            ? <><CheckCircle2 className="w-4 h-4" /> Qatnashdi</>
                            : <><Circle className="w-4 h-4" /> Yo'q</>
                          }
                        </button>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          max={maxScore}
                          step={0.5}
                          value={score}
                          onChange={e => setScore(row.profile_id, e.target.value)}
                          className="w-20 text-center border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </td>
                    {isDaily && (
                      <td className="px-4 py-2.5 text-center">
                        {row.task_id ? (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Saqlangan</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
