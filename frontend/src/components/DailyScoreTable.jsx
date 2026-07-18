import { useState, useEffect, useCallback } from 'react'
import { Save, CheckCircle2, Circle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../services/api'

// ─── Date helpers ────────────────────────────────────────────────────────────

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toMonthStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

function isWeekend(d) {
  const day = d.getDay()
  return day === 0 || day === 6
}

function getWorkdaysInMonth(year, month) {
  const days = new Date(year, month + 1, 0).getDate()
  const result = []
  for (let d = 1; d <= days; d++) {
    const dt = new Date(year, month, d)
    if (!isWeekend(dt)) result.push(dt)
  }
  return result
}

// Returns weeks as arrays of 7 cells (Mon–Sun), null for days outside the month
function getCalendarWeeks(year, month) {
  const totalDays = new Date(year, month + 1, 0).getDate()
  const allDays = Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1))

  const weeks = []
  let week = new Array(7).fill(null)

  allDays.forEach(dt => {
    // getDay(): 0=Sun,1=Mon,...,6=Sat → map to Mon=0..Sun=6
    const col = (dt.getDay() + 6) % 7
    week[col] = dt
    if (col === 6) {
      weeks.push(week)
      week = new Array(7).fill(null)
    }
  })
  // Push last incomplete week
  if (week.some(d => d !== null)) weeks.push(week)
  return weeks
}

const DAY_LABELS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const MONTH_NAMES = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

// ─── 1_ijro: Calendar + Attendance table ──────────────────────────────────

function IjroCalendarView({ month }) {
  const initDate = month ? new Date(month) : (() => {
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1)
  })()
  const [currentMonth, setCurrentMonth] = useState(initDate)
  const [selectedDate, setSelectedDate] = useState(null)
  const [dayData, setDayData] = useState({}) // dateStr -> {rows, scorePerDay, workdays}
  const [rows, setRows] = useState([])
  const [scores, setScores] = useState({})   // profile_id -> 0 or 1
  const [scorePerDay, setScorePerDay] = useState(0)
  const [workdays, setWorkdays] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const year = currentMonth.getFullYear()
  const month_ = currentMonth.getMonth()
  const weeks = getCalendarWeeks(year, month_)
  const workdayDates = getWorkdaysInMonth(year, month_)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  useEffect(() => {
    if (month) setCurrentMonth(new Date(month))
  }, [month])

  useEffect(() => {
    setSelectedDate(null)
    setRows([])
    setScores({})
    setDayData({})
  }, [currentMonth])

  const loadDay = useCallback(async (dateStr) => {
    if (dayData[dateStr]) {
      const cached = dayData[dateStr]
      setRows(cached.rows)
      setScorePerDay(cached.scorePerDay)
      setWorkdays(cached.workdays)
      const init = {}
      cached.rows.forEach(r => { init[r.profile_id] = (r.score ?? 0) > 0 ? 1 : 0 })
      setScores(init)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.getBulkScores('1_ijro', dateStr)
      const r = data.rows || []
      const spd = data.score_per_day || 0
      const wd = data.workdays || 0
      setRows(r)
      setScorePerDay(spd)
      setWorkdays(wd)
      const init = {}
      r.forEach(row => { init[row.profile_id] = (row.score ?? 0) > 0 ? 1 : 0 })
      setScores(init)
      setDayData(prev => ({ ...prev, [dateStr]: { rows: r, scorePerDay: spd, workdays: wd } }))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [dayData])

  const selectDate = (dt) => {
    const ds = toDateStr(dt)
    setSelectedDate(ds)
    setSaved(false)
    loadDay(ds)
  }

  const handleSave = async () => {
    if (!selectedDate) return
    setSaving(true)
    setError(null)
    try {
      const payload = rows.map(r => ({
        profile_id: r.profile_id,
        score: scores[r.profile_id] ?? 0,
      }))
      await api.saveBulkScores('1_ijro', selectedDate, payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      // Invalidate cache for this day
      setDayData(prev => {
        const next = { ...prev }
        delete next[selectedDate]
        return next
      })
      await loadDay(selectedDate)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const presentCount = rows.filter(r => (scores[r.profile_id] ?? 0) === 1).length

  const toggle = (pid) => {
    setScores(prev => ({ ...prev, [pid]: prev[pid] === 1 ? 0 : 1 }))
  }

  const getDateStatus = (dt) => {
    const ds = toDateStr(dt)
    const cached = dayData[ds]
    if (!cached) return null
    const total = cached.rows.length
    const present = cached.rows.filter(r => (r.score ?? 0) > 0).length
    return { present, total }
  }

  const isFuture = (dt) => {
    const d = new Date(dt)
    d.setHours(0, 0, 0, 0)
    return d > today
  }

  return (
    <div className="space-y-5 overflow-x-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(new Date(year, month_ - 1, 1))}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">
            {MONTH_NAMES[month_]} {year}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {workdayDates.length} ish kuni · har kun {(20 / workdayDates.length).toFixed(2)} ball
          </p>
        </div>
        <button
          onClick={() => setCurrentMonth(new Date(year, month_ + 1, 1))}
          disabled={new Date(year, month_ + 1, 1) > new Date(today.getFullYear(), today.getMonth(), 1)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 text-xs text-center">
          {DAY_LABELS.map((d, i) => (
            <div
              key={d}
              className={`py-2.5 font-semibold tracking-wide ${
                i >= 5 ? 'bg-red-900 text-red-300' : 'bg-slate-800 text-white'
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((dt, col) => {
                if (!dt) return <div key={col} className="py-3 bg-slate-50 dark:bg-slate-900" />
                const ds = toDateStr(dt)
                const weekend = isWeekend(dt)
                const status = !weekend ? getDateStatus(dt) : null
                const isSelected = !weekend && selectedDate === ds
                const isFut = isFuture(dt)
                const isToday = toDateStr(dt) === toDateStr(today)
                const allPresent = status && status.present === status.total && status.total > 0
                const somePresent = status && status.present > 0 && !allPresent

                if (weekend) {
                  return (
                    <div
                      key={ds}
                      className="py-3 px-2 text-center bg-red-50 dark:bg-red-950/30 cursor-not-allowed"
                    >
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-red-300">
                        {dt.getDate()}
                      </span>
                      <div className="text-[10px] mt-0.5 text-red-200">dam</div>
                    </div>
                  )
                }

                return (
                  <button
                    key={ds}
                    onClick={() => !isFut && selectDate(dt)}
                    disabled={isFut}
                    className={`
                      py-3 px-2 text-center transition-all text-sm font-semibold
                      ${isFut ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer'}
                      ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-600' : ''}
                      ${!isSelected && allPresent ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : ''}
                      ${!isSelected && somePresent ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : ''}
                      ${!isSelected && !allPresent && !somePresent ? 'text-slate-700 dark:text-slate-200' : ''}
                    `}
                  >
                    <span className={`
                      inline-flex items-center justify-center w-8 h-8 rounded-full text-sm
                      ${isToday && !isSelected ? 'ring-2 ring-blue-500' : ''}
                    `}>
                      {dt.getDate()}
                    </span>
                    {status ? (
                      <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-200' : ''}`}>
                        {status.present}/{status.total}
                      </div>
                    ) : (
                      <div className="text-[10px] mt-0.5 opacity-0">—</div>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Attendance table for selected day */}
      {selectedDate && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Har kun: {scorePerDay.toFixed(2)} ball · {workdays} ish kuni
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2">
                <span className="font-bold text-blue-600">{presentCount}</span> / {rows.length} ta qatnashdi
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
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white text-xs">
                    <th className="px-4 py-3 text-left w-10">#</th>
                    <th className="px-4 py-3 text-left">MFY nomi</th>
                    <th className="px-4 py-3 text-center">Qatnashdi</th>
                    <th className="px-4 py-3 text-center w-24">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {rows.map((row, idx) => {
                    const present = (scores[row.profile_id] ?? 0) === 1
                    return (
                      <tr key={row.profile_id} className={`transition-colors ${present ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-white dark:bg-slate-800'}`}>
                        <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{row.mahalla_name} MFY</td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => toggle(row.profile_id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              present
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                          >
                            {present
                              ? <><CheckCircle2 className="w-4 h-4" /> Qatnashdi</>
                              : <><Circle className="w-4 h-4" /> Yo'q</>}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {row.task_id ? (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Saqlangan</span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <p className="text-center text-slate-400 text-sm py-6">Kun tanlang</p>
      )}
    </div>
  )
}

// ─── Monthly numeric score table (other admin_scored directions) ──────────

function MonthlyScoreTable({ direction, maxScore, month }) {
  const [rows, setRows] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const monthStr = month || toMonthStr(new Date())

  const loadScores = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      const data = await api.getBulkScores(direction, monthStr)
      const r = data.rows || data
      setRows(r)
      const init = {}
      r.forEach(row => { init[row.profile_id] = row.score ?? '' })
      setScores(init)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [direction, monthStr])

  useEffect(() => { loadScores() }, [loadScores])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = rows.map(r => ({
        profile_id: r.profile_id,
        score: parseFloat(scores[r.profile_id] ?? 0) || 0,
      }))
      await api.saveBulkScores(direction, monthStr, payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await loadScores()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filledCount = rows.filter(r => {
    const s = scores[r.profile_id]
    return s !== null && s !== '' && s !== undefined && Number(s) !== 0
  }).length

  const monthLabel = (() => {
    if (!monthStr) return ''
    const d = new Date(monthStr + 'T00:00:00')
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
  })()

  return (
    <div className="space-y-5 overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="font-semibold text-slate-800 dark:text-slate-100">{monthLabel}</p>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2">
            <span className="font-bold text-blue-600">{filledCount}</span> / {rows.length} ta to'ldirildi
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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white text-xs">
                <th className="px-4 py-3 text-left w-10">#</th>
                <th className="px-4 py-3 text-left">MFY nomi</th>
                <th className="px-4 py-3 text-center">Ball (0 – {maxScore})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {rows.map((row, idx) => {
                const score = scores[row.profile_id] ?? ''
                return (
                  <tr key={row.profile_id} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{row.mahalla_name} MFY</td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="number"
                        min={0}
                        max={maxScore}
                        step={0.5}
                        value={score}
                        onChange={e => setScores(prev => ({ ...prev, [row.profile_id]: e.target.value }))}
                        className="w-20 text-center border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 dark:bg-slate-700 dark:text-white"
                      />
                    </td>
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

// ─── Public export ────────────────────────────────────────────────────────────

export function DailyScoreTable({ direction, maxScore, month }) {
  if (direction === '1_ijro') {
    return <IjroCalendarView month={month} />
  }
  return <MonthlyScoreTable direction={direction} maxScore={maxScore} month={month} />
}
