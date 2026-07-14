import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { api } from '../services/api'

export function MFYStatusPanel({ directions, fixedDirection, monthFrom, monthTo }) {
  const [selDir, setSelDir] = useState(fixedDirection || '')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [filter, setFilter] = useState('all') // all | submitted | not_submitted | pending

  useEffect(() => {
    if (fixedDirection) {
      setSelDir(fixedDirection)
    } else if (directions.length && !selDir) {
      setSelDir(directions[0].key)
    }
  }, [fixedDirection, directions])

  useEffect(() => {
    if (!selDir) return
    setLoading(true)
    setExpandedId(null)
    setFilter('all')
    api.getMFYStatus(selDir, monthFrom, monthTo)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [selDir, monthFrom, monthTo])

  const submitted    = rows.filter(r => r.submitted).length
  const notSubmitted = rows.filter(r => !r.submitted).length
  const withPending  = rows.filter(r => r.pending_count > 0).length
  const approved     = rows.filter(r => r.approved_count > 0).length

  const filtered = rows.filter(r => {
    if (filter === 'submitted')     return r.submitted
    if (filter === 'not_submitted') return !r.submitted
    if (filter === 'pending')       return r.pending_count > 0
    if (filter === 'approved')      return r.approved_count > 0
    return true
  })

  return (
    <div className="space-y-4">
      {/* Direction selector — only shown when not fixed to a direction */}
      {!fixedDirection && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
            Yo'nalish
          </label>
          <select
            value={selDir}
            onChange={e => setSelDir(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {directions.map(d => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Summary stats */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Yuklagan',    count: submitted,    filter: 'submitted',     bg: 'bg-emerald-900/30 border-emerald-700', text: 'text-emerald-400' },
            { label: 'Tasdiqlangan',count: approved,     filter: 'approved',      bg: 'bg-emerald-950/50 border-emerald-800', text: 'text-emerald-300' },
            { label: 'Kutmoqda',    count: withPending,  filter: 'pending',       bg: 'bg-amber-900/30 border-amber-700',     text: 'text-amber-400'   },
            { label: 'Yuklamagan',  count: notSubmitted, filter: 'not_submitted', bg: 'bg-red-900/30 border-red-700',         text: 'text-red-400'     },
          ].map(s => (
            <button
              key={s.filter}
              onClick={() => setFilter(filter === s.filter ? 'all' : s.filter)}
              className={`rounded-xl p-3 text-center border transition-all ${s.bg} ${filter === s.filter ? 'ring-2 ring-white/30' : ''}`}
            >
              <div className={`text-2xl font-black ${s.text}`}>{s.count}</div>
              <div className={`text-xs mt-1 ${s.text} opacity-80`}>{s.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Ma'lumot yo'q</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              <span className="w-6 text-center">#</span>
              <span className="flex-1">MFY</span>
              <span className="flex items-center gap-3 flex-shrink-0 pr-8">
                <span className="w-6 text-center text-emerald-500" title="Tasdiqlangan"><CheckCircle2 className="w-3.5 h-3.5 inline" /></span>
                <span className="w-6 text-center text-amber-500" title="Kutmoqda"><Clock className="w-3.5 h-3.5 inline" /></span>
                <span className="w-6 text-center text-red-400" title="Rad etilgan"><XCircle className="w-3.5 h-3.5 inline" /></span>
                <span className="w-14 text-right">Ball</span>
              </span>
            </div>

            {filtered.map((row, idx) => {
              const isExpanded = expandedId === row.id
              const leftBorder =
                !row.submitted       ? 'border-l-4 border-l-red-400' :
                row.pending_count > 0 ? 'border-l-4 border-l-amber-400' :
                row.approved_count > 0 ? 'border-l-4 border-l-emerald-400' :
                                       'border-l-4 border-l-slate-300 dark:border-l-slate-600'

              return (
                <div key={row.id} className={leftBorder}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : row.id)}
                  >
                    <span className="text-xs text-slate-400 w-6 text-center flex-shrink-0">{idx + 1}</span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-snug">
                        {row.name} MFY
                      </p>
                      {row.full_name && (
                        <p className="text-xs text-slate-400 truncate">{row.full_name}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`w-6 text-center text-sm font-bold ${row.approved_count > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}>
                        {row.approved_count || '—'}
                      </span>
                      <span className={`w-6 text-center text-sm font-bold ${row.pending_count > 0 ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}>
                        {row.pending_count || '—'}
                      </span>
                      <span className={`w-6 text-center text-sm font-bold ${row.rejected_count > 0 ? 'text-red-500' : 'text-slate-300 dark:text-slate-600'}`}>
                        {row.rejected_count || '—'}
                      </span>
                      <span className="w-14 text-right text-sm font-bold text-slate-700 dark:text-slate-200">
                        {row.total_score > 0 ? row.total_score : (
                          <span className="text-slate-300 dark:text-slate-600 font-normal">0</span>
                        )}
                      </span>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-3 bg-slate-50 dark:bg-slate-900/40">
                      {row.tasks.length === 0 ? (
                        <p className="text-sm text-slate-400 py-3 text-center italic">
                          Hech qanday material yuklanmagan
                        </p>
                      ) : (
                        <div className="space-y-1.5 pt-2">
                          {row.tasks.map(t => (
                            <div key={t.id} className="flex items-center gap-3 text-sm bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                t.status === 'yashil' ? 'bg-emerald-500' :
                                t.status === 'sariq'  ? 'bg-amber-400'   : 'bg-red-400'
                              }`} />
                              <span className="text-slate-400 flex-shrink-0 text-xs font-mono">{t.month}</span>
                              <span className="flex-1 truncate text-slate-700 dark:text-slate-300 text-xs">
                                {t.event_name || (
                                  <span className="italic text-slate-400">
                                    {t.status === 'sariq' ? 'Ko\'rib chiqilmoqda' :
                                     t.status === 'qizil' ? 'Rad etilgan' : 'Tasdiqlangan'}
                                  </span>
                                )}
                              </span>
                              {t.status === 'qizil' && t.admin_comment && (
                                <span className="text-xs text-red-400 truncate max-w-36 flex-shrink-0" title={t.admin_comment}>
                                  {t.admin_comment}
                                </span>
                              )}
                              <span className={`text-xs font-bold flex-shrink-0 ${
                                t.status === 'yashil' ? 'text-emerald-600 dark:text-emerald-400' :
                                t.status === 'sariq'  ? 'text-amber-500 dark:text-amber-400'    : 'text-red-400'
                              }`}>
                                {t.status === 'yashil' ? `+${t.score}` : t.status === 'sariq' ? '...' : '✕'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
