import { useState, useEffect } from 'react'
import { Save, CheckCircle2, Loader2, Target, CalendarDays, X } from 'lucide-react'
import { api } from '../services/api'

const PLAN_CONFIG = {
  '2_balans':        { unit: 'ta yangilanish', hint: "Sana va reja sonini kiriting" },
  '3_bandlik':       { unit: 'nafar yosh',      hint: "Sana va reja sonini kiriting" },
  '4_bosh_vaqt':    { unit: 'ta tadbir',        hint: "Sana va reja sonini kiriting" },
  '5_profilaktika':  { unit: 'ta suhbat',        hint: "Sana va reja sonini kiriting" },
  '6_murojaat':     { unit: 'ta murojaat',       hint: "Sana va reja sonini kiriting" },
  '7_brend':        { unit: 'ta loyiha',         hint: "Sana va reja sonini kiriting" },
  '8_talim':        { unit: "ta o'quvchi",       hint: "Sana va reja sonini kiriting" },
  '9_startap':      { unit: 'ta startap',        hint: "Sana va reja sonini kiriting" },
  '10_nomenklatura':{ unit: 'ta hujjat',         hint: "Sana va reja sonini kiriting" },
}

const UZ_DAYS   = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const UZ_MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']

function MonthCalendar({ month, selectedDates, onToggle }) {
  if (!month) return null
  const year = parseInt(month.slice(0, 4))
  const mon  = parseInt(month.slice(5, 7)) - 1

  const daysInMonth  = new Date(year, mon + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, mon, 1).getDay()
  const startOffset  = (firstDayOfWeek + 6) % 7

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(mon + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ d, dateStr, selected: selectedDates.includes(dateStr) })
  }

  return (
    <div className="select-none">
      <p className="text-xs font-semibold text-slate-400 text-center mb-2">
        {UZ_MONTHS[mon]} {year}
      </p>
      <div className="grid grid-cols-7 text-center mb-1">
        {UZ_DAYS.map(d => (
          <span key={d} className="text-[10px] font-bold text-slate-500 py-0.5">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) =>
          cell === null ? <div key={i} /> : (
            <button
              key={cell.dateStr}
              onClick={() => onToggle(cell.dateStr)}
              className={`aspect-square text-xs rounded-md font-medium transition-all ${
                cell.selected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cell.d}
            </button>
          )
        )}
      </div>
    </div>
  )
}

// Normalize backend plan_dates to [{date, count}]
function normalizePlanDates(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map(item =>
    typeof item === 'string'
      ? { date: item, count: 1 }
      : { date: item.date, count: Number(item.count) || 1 }
  )
}

export function MonthPlanBar({ direction, month, maxScore }) {
  const [entries, setEntries]         = useState([])   // [{date, count}]
  const [savedTotal, setSavedTotal]   = useState(null)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState(null)
  const [open, setOpen]               = useState(false)

  const config = PLAN_CONFIG[direction]

  const monthStr = month || (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
  })()

  useEffect(() => {
    if (!direction || !monthStr) return
    setLoading(true)
    setError(null)
    api.getMonthPlan(direction, monthStr)
      .then(data => {
        const norm = normalizePlanDates(data.plan_dates)
        setEntries(norm)
        setSavedTotal(data.target_count ?? null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [direction, monthStr])

  const selectedDates = entries.map(e => e.date)

  const toggleDate = (dateStr) => {
    setEntries(prev => {
      const exists = prev.find(e => e.date === dateStr)
      if (exists) return prev.filter(e => e.date !== dateStr)
      return [...prev, { date: dateStr, count: 1 }].sort((a, b) => a.date.localeCompare(b.date))
    })
  }

  const setCount = (dateStr, val) => {
    const n = Math.max(1, parseInt(val) || 1)
    setEntries(prev => prev.map(e => e.date === dateStr ? { ...e, count: n } : e))
  }

  const totalCount = entries.reduce((s, e) => s + e.count, 0)
  const perItem    = totalCount > 0 && maxScore ? (maxScore / totalCount).toFixed(2) : null

  const handleSave = async () => {
    if (entries.length === 0) return
    setSaving(true)
    setError(null)
    try {
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

  // Format date for display: "3-Iyul"
  const fmtDate = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}`
  }

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      {/* Summary row */}
      <div className="flex items-center gap-3 px-5 py-3 flex-wrap">
        <Target className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Oylik Reja</span>
          <p className="text-sm text-slate-300 mt-0.5">{config.hint}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {savedTotal != null && (
            <span className="text-sm text-slate-300">
              Jami: <span className="font-bold text-white">{savedTotal}</span> {config.unit}
              {savedTotal > 0 && maxScore && (
                <span className="text-slate-400 ml-2">
                  · har biri max <span className="text-emerald-400 font-bold">{(maxScore / savedTotal).toFixed(2)}</span> ball
                </span>
              )}
            </span>
          )}
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            {open ? 'Yopish' : "Sanalarni belgilash"}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="border-t border-slate-700 p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calendar */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Sana tanlash <span className="text-slate-600 font-normal normal-case">(bosib tanlang)</span>
              </p>
              <MonthCalendar month={monthStr} selectedDates={selectedDates} onToggle={toggleDate} />
            </div>

            {/* Entries list */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Tanlangan sanalar va reja soni
              </p>
              {entries.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-4">Hech qanday sana tanlanmagan</p>
              ) : (
                <div className="space-y-2">
                  {entries.map(e => (
                    <div key={e.date} className="flex items-center gap-3 bg-slate-700/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-slate-300 font-medium w-24 flex-shrink-0">
                        {fmtDate(e.date)}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={9999}
                        value={e.count}
                        onChange={ev => setCount(e.date, ev.target.value)}
                        className="w-20 text-center bg-slate-600 border border-slate-500 text-white rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-400 flex-1">{config.unit}</span>
                      <button
                        onClick={() => toggleDate(e.date)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="flex items-center justify-between px-3 py-2 border-t border-slate-600 mt-1">
                    <span className="text-sm font-bold text-slate-200">
                      Jami: {totalCount} {config.unit}
                    </span>
                    {perItem && (
                      <span className="text-xs text-emerald-400 font-semibold">
                        har biri max {perItem} ball
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

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
              disabled={saving || entries.length === 0}
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
