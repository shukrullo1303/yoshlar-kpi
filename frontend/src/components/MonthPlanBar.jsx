import { useState, useEffect } from 'react'
import { Save, CheckCircle2, Loader2, Target, CalendarDays, X } from 'lucide-react'
import { api } from '../services/api'

// defaultWeekly: default plans per week (null = no pre-fill)
const PLAN_CONFIG = {
  '2_balans':         { unit: 'ta yangilanish', defaultWeekly: 2  },
  '3_bandlik':        { unit: 'nafar yosh',      defaultWeekly: 2  },
  '4_bosh_vaqt':     { unit: 'ta tadbir',        defaultWeekly: 1  },
  '5_profilaktika':   { unit: 'ta suhbat',        defaultWeekly: 2  },
  '6_murojaat':      { unit: 'ta murojaat',       defaultWeekly: 1  },
  '7_brend':         { unit: 'ta loyiha',         defaultWeekly: 10 },
  '8_talim':         { unit: "ta o'quvchi",       defaultWeekly: 2  },
  '9_startap':       { unit: 'ta startap',        defaultWeekly: 1  },
  '10_nomenklatura': { unit: 'ta hujjat',         defaultWeekly: null },
}

const UZ_DAYS   = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const UZ_MONTHS = [
  'Yanvar','Fevral','Mart','Aprel','May','Iyun',
  'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr',
]

// Calendar weeks (Mon–Sun) for the month
function getMonthWeeks(monthStr) {
  if (!monthStr) return []
  const year = parseInt(monthStr.slice(0, 4))
  const mon  = parseInt(monthStr.slice(5, 7)) - 1
  const daysInMonth = new Date(year, mon + 1, 0).getDate()
  const pad = n => String(n).padStart(2, '0')

  const weeks = []
  let current = []

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (new Date(year, mon, d).getDay() + 6) % 7  // 0=Mon … 6=Sun
    current.push({ day: d, dow, dateStr: `${year}-${pad(mon + 1)}-${pad(d)}` })
    if (dow === 6 || d === daysInMonth) {
      const s = current[0].day
      const e = current[current.length - 1].day
      weeks.push({
        startDate: `${year}-${pad(mon + 1)}-${pad(s)}`,
        label: `${s}–${e} ${UZ_MONTHS[mon]}`,
        startDay: s,
        endDay: e,
        days: [...current],
      })
      current = []
    }
  }
  return weeks
}

function entriesToWeekCounts(entries, weeks) {
  const counts = {}
  for (const week of weeks) {
    const inWeek = entries.filter(e => {
      const d = parseInt(e.date.slice(8, 10))
      return d >= week.startDay && d <= week.endDay
    })
    if (inWeek.length > 0)
      counts[week.startDate] = inWeek.reduce((s, e) => s + e.count, 0)
  }
  return counts
}

export function MonthPlanBar({ direction, month, maxScore, defaultOpen = false }) {
  const [weekCounts, setWeekCounts] = useState({})
  const [savedTotal, setSavedTotal] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [error, setError]           = useState(null)
  const [open, setOpen]             = useState(defaultOpen)

  const config = PLAN_CONFIG[direction]

  const monthStr = month || (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })()

  const weeks = getMonthWeeks(monthStr)

  useEffect(() => {
    if (!direction || !monthStr) return
    setLoading(true)
    setError(null)
    api.getMonthPlan(direction, monthStr)
      .then(data => {
        const raw  = data.plan_dates || []
        const norm = raw.map(item =>
          typeof item === 'string'
            ? { date: item, count: 1 }
            : { date: item.date, count: Number(item.count) || 1 }
        )
        if (norm.length > 0) {
          setWeekCounts(entriesToWeekCounts(norm, weeks))
        } else if (config?.defaultWeekly) {
          const defaults = {}
          for (const w of weeks) defaults[w.startDate] = config.defaultWeekly
          setWeekCounts(defaults)
        }
        setSavedTotal(data.target_count ?? null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [direction, monthStr])

  const totalCount = Object.values(weekCounts).reduce((s, c) => s + (c || 0), 0)
  const perItem    = totalCount > 0 && maxScore ? (maxScore / totalCount).toFixed(2) : null

  const toggleWeek = (startDate) => {
    setWeekCounts(prev => {
      if (prev[startDate] != null) {
        const next = { ...prev }; delete next[startDate]; return next
      }
      return { ...prev, [startDate]: config?.defaultWeekly ?? 1 }
    })
  }

  const setWeekCount = (startDate, val) => {
    const n = parseInt(val)
    setWeekCounts(prev => {
      if (!val || isNaN(n) || n <= 0) {
        const next = { ...prev }; delete next[startDate]; return next
      }
      return { ...prev, [startDate]: n }
    })
  }

  const handleSave = async () => {
    if (totalCount === 0) return
    setSaving(true); setError(null)
    try {
      const entries = Object.entries(weekCounts)
        .filter(([, c]) => c > 0)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
      const data = await api.saveMonthPlan(direction, monthStr, undefined, entries)
      setSavedTotal(data.target_count)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!config) return null

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-5 py-3 flex-wrap">
        <Target className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Oylik Reja</span>
          {savedTotal != null && (
            <p className="text-sm text-slate-300 mt-0.5">
              Jami: <span className="font-bold text-white">{savedTotal}</span> {config.unit}
              {savedTotal > 0 && maxScore && (
                <span className="text-slate-400 ml-2">
                  · har biri max{' '}
                  <span className="text-emerald-400 font-bold">{(maxScore / savedTotal).toFixed(2)}</span> ball
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            {open ? 'Yopish' : 'Rejani belgilash'}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="border-t border-slate-700 px-4 pt-4 pb-5 space-y-2">

          {/* Day-of-week header */}
          <div className="flex items-center gap-2 px-1 mb-1">
            {/* left spacer: checkbox(20) + week-num(36) */}
            <div className="flex-shrink-0" style={{ width: 60 }} />
            {/* 7 columns */}
            <div className="flex-1 grid grid-cols-7 text-center">
              {UZ_DAYS.map(d => (
                <span key={d} className="text-[10px] font-bold text-slate-500">{d}</span>
              ))}
            </div>
            {/* right spacer: input(68) + unit(80) + X(20) */}
            <div className="flex-shrink-0" style={{ width: 178 }} />
          </div>

          {/* Week rows */}
          {weeks.map((week, i) => {
            const count      = weekCounts[week.startDate]
            const isSelected = count != null

            return (
              <div
                key={week.startDate}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all border ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/30'
                    : 'bg-slate-700/40 border-transparent hover:border-slate-600'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleWeek(week.startDate)}
                  className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-500 hover:border-slate-400'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                {/* Week number */}
                <span className="text-[11px] font-bold text-slate-500 flex-shrink-0 w-9 text-center">
                  {i + 1}-h
                </span>

                {/* Calendar grid — 7 columns, Mon…Sun */}
                <div className="flex-1 grid grid-cols-7 text-center">
                  {Array.from({ length: 7 }, (_, col) => {
                    const info = week.days.find(d => d.dow === col)
                    return (
                      <span
                        key={col}
                        className={`text-xs font-semibold leading-5 ${
                          info
                            ? isSelected
                              ? 'text-blue-300'
                              : 'text-slate-300'
                            : 'text-transparent select-none'
                        }`}
                      >
                        {info ? info.day : '·'}
                      </span>
                    )
                  })}
                </div>

                {/* Count input */}
                <input
                  type="number"
                  min={1}
                  max={9999}
                  placeholder={config.defaultWeekly ?? '0'}
                  value={count ?? ''}
                  onFocus={() => { if (!isSelected) toggleWeek(week.startDate) }}
                  onChange={e => setWeekCount(week.startDate, e.target.value)}
                  className={`w-16 text-center rounded-lg px-1 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex-shrink-0 ${
                    isSelected
                      ? 'bg-slate-600 border border-slate-500 text-white'
                      : 'bg-slate-700 border border-slate-600 text-slate-500'
                  }`}
                />

                <span className="text-xs text-slate-500 flex-shrink-0 w-20 truncate">
                  {config.unit}
                </span>

                {/* Remove button */}
                {isSelected ? (
                  <button
                    onClick={() => toggleWeek(week.startDate)}
                    className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-4 flex-shrink-0" />
                )}
              </div>
            )
          })}

          {/* Running total */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between px-3 py-2.5 bg-slate-700/40 rounded-lg mt-1">
              <span className="text-sm font-bold text-slate-200">
                Jami: {totalCount} {config.unit}
              </span>
              {perItem && (
                <span className="text-xs text-emerald-400 font-semibold">
                  har biri max {perItem} ball
                </span>
              )}
            </div>
          )}

          {/* Save row */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-700">
            {error && <p className="text-xs text-red-400 flex-1">{error}</p>}
            {saved && (
              <span className="flex items-center gap-1 text-sm text-emerald-400 font-medium flex-1">
                <CheckCircle2 className="w-4 h-4" /> Saqlandi
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || totalCount === 0}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors ml-auto"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Saqlash
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
