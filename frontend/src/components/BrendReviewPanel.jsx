import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, Loader2, Download, FileText, Target, RefreshCw } from 'lucide-react'
import { api } from '../services/api'

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url)
}

function isPdf(url) {
  return /\.pdf(\?|$)/i.test(url)
}

function ThumbPreview({ file }) {
  const url = file.file
  if (isImage(url)) {
    return (
      <img src={url} alt="" className="w-full h-28 object-cover rounded-lg bg-slate-100 dark:bg-slate-900" />
    )
  }
  if (isPdf(url)) {
    return (
      <div className="w-full h-28 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-50 dark:bg-slate-900">
        <iframe src={url} className="w-full h-full border-0 pointer-events-none" title="pdf" />
      </div>
    )
  }
  return (
    <div className="w-full h-28 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-slate-400">
      <FileText className="w-8 h-8 mb-1" />
      <span className="text-xs">Fayl</span>
    </div>
  )
}

function FullPreview({ file }) {
  const url = file.file
  const name = decodeURIComponent(url.split('/').pop())
  if (isImage(url)) {
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
        <img src={url} alt={name} className="w-full max-h-80 object-contain bg-slate-50 dark:bg-slate-900" />
        <div className="px-3 py-1.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{name}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 ml-2 flex items-center gap-1 flex-shrink-0">
            <Download className="w-3 h-3" /> Yuklab olish
          </a>
        </div>
      </div>
    )
  }
  if (isPdf(url)) {
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
        <iframe src={url} className="w-full border-0 bg-slate-100 dark:bg-slate-900" style={{ height: 420 }} title={name} />
        <div className="px-3 py-1.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{name}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 ml-2 flex items-center gap-1 flex-shrink-0">
            <Download className="w-3 h-3" /> Yuklab olish
          </a>
        </div>
      </div>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
      <FileText className="w-6 h-6 text-slate-400 flex-shrink-0" />
      <span className="text-xs text-slate-700 dark:text-slate-200 truncate">{name}</span>
      <Download className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 ml-auto" />
    </a>
  )
}

export function BrendReviewPanel({ direction, maxScore, month }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [expanded, setExpanded] = useState(null)
  const [planScore, setPlanScore] = useState(null)
  const [score, setScore] = useState('')
  const [rejectComment, setRejectComment] = useState('')
  const [mode, setMode] = useState(null) // 'approve' | 'reject'
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [tab, setTab] = useState('sariq')
  const [counts, setCounts] = useState({ sariq: 0, yashil: 0, qizil: 0 })

  const load = useCallback(async (st) => {
    setLoading(true); setError(null)
    try {
      const data = await api.getSliderTasks(direction, month, st)
      setTasks(data)
      setSelected(new Set())
      setExpanded(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [direction, month])

  const loadCounts = useCallback(async () => {
    try {
      const [s, y, q] = await Promise.all([
        api.getSliderTasks(direction, month, 'sariq'),
        api.getSliderTasks(direction, month, 'yashil'),
        api.getSliderTasks(direction, month, 'qizil'),
      ])
      setCounts({ sariq: s.length, yashil: y.length, qizil: q.length })
    } catch (_) {}
  }, [direction, month])

  useEffect(() => {
    api.getMonthPlan(direction, month || '')
      .then(data => {
        if (data.target_count && data.max_score) {
          const ps = Math.round((data.max_score / data.target_count) * 100) / 100
          setPlanScore(ps)
          setScore(String(ps))
        }
      })
      .catch(() => {})
  }, [direction, month])

  useEffect(() => { loadCounts(); load(tab) }, [direction, month]) // eslint-disable-line
  useEffect(() => { loadCounts(); load(tab) }, [tab]) // eslint-disable-line

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const pending = tasks.filter(t => t.status === 'sariq')
    if (selected.size === pending.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pending.map(t => t.id)))
    }
  }

  const handleBulkAction = async () => {
    if (!selected.size) return
    setBusy(true)
    setActionError(null)
    try {
      if (mode === 'approve') {
        await api.bulkReviewTasks([...selected], 'tasdiqlash', score !== '' ? Number(score) : null)
      } else {
        if (!rejectComment.trim()) { setActionError("Rad etish sababini kiriting"); setBusy(false); return }
        await api.bulkReviewTasks([...selected], 'rad_etish', null, rejectComment.trim())
      }
      setMode(null)
      setRejectComment('')
      await loadCounts()
      await load(tab)
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const pendingTasks = tasks.filter(t => t.status === 'sariq')
  const allPendingSelected = pendingTasks.length > 0 && selected.size === pendingTasks.length

  const TAB_STYLES = { sariq: 'bg-amber-500', yashil: 'bg-emerald-600', qizil: 'bg-red-600' }
  const TAB_LABELS = { sariq: 'Kutilmoqda', yashil: 'Tasdiqlangan', qizil: 'Rad etilgan' }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-4">
        {Object.keys(TAB_LABELS).map(k => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === k ? `${TAB_STYLES[k]} text-white shadow-sm` : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}>
            {TAB_LABELS[k]}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === k ? 'bg-white/25 text-white' : 'bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>
              {counts[k]}
            </span>
          </button>
        ))}
        <button onClick={() => { loadCounts(); load(tab) }}
          className="ml-auto p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Plan hint */}
      {planScore !== null && (
        <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-2.5 text-blue-700 dark:text-blue-300">
          <Target className="w-4 h-4 flex-shrink-0" />
          Rejaga asosan har bir loyiha uchun ball: <strong className="ml-1">{planScore}</strong>
        </div>
      )}

      {/* Bulk action bar — only for sariq */}
      {tab === 'sariq' && tasks.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={allPendingSelected} onChange={toggleAll}
                className="w-4 h-4 rounded accent-blue-600" />
              Barchasini tanlash ({pendingTasks.length} ta)
            </label>
            {selected.size > 0 && (
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {selected.size} ta tanlandi
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setMode(mode === 'approve' ? null : 'approve')}
                disabled={!selected.size}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 ${
                  mode === 'approve' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                }`}>
                <CheckCircle2 className="w-4 h-4" /> Tasdiqlash
              </button>
              <button
                onClick={() => setMode(mode === 'reject' ? null : 'reject')}
                disabled={!selected.size}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 ${
                  mode === 'reject' ? 'bg-red-600 text-white' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                }`}>
                <XCircle className="w-4 h-4" /> Rad etish
              </button>
            </div>
          </div>

          {/* Approve form */}
          {mode === 'approve' && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Ball:</label>
              <input type="number" min={0} max={planScore !== null ? planScore : maxScore} step={0.01} value={score}
                onChange={e => {
                  const cap = planScore !== null ? planScore : maxScore
                  const v = Number(e.target.value)
                  setScore(v > cap ? String(cap) : e.target.value)
                }}
                placeholder="0.0"
                className="w-24 text-center border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <span className="text-sm text-slate-400">/ {planScore !== null ? planScore : maxScore}</span>
              <span className="text-xs text-slate-500">(1 topshiriq uchun max)</span>
              {score === '' && planScore === null && (
                <span className="text-xs text-amber-600 dark:text-amber-400">Avval reja qo'ying</span>
              )}
              {actionError && <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>}
              <button onClick={handleBulkAction} disabled={busy || score === ''}
                className="ml-auto flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {selected.size} tasini tasdiqlash
              </button>
            </div>
          )}

          {/* Reject form */}
          {mode === 'reject' && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <textarea value={rejectComment} onChange={e => setRejectComment(e.target.value)}
                placeholder="Rad etish sababi..." rows={2}
                className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500" />
              {actionError && <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>}
              <button onClick={handleBulkAction} disabled={busy || !rejectComment.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                {selected.size} tasini rad etish
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-25" />
          <p>Topshiriqlar yo'q</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map(task => {
            const isSelected = selected.has(task.id)
            const isPending = task.status === 'sariq'
            const isExpanded = expanded === task.id

            return (
              <div key={task.id}
                className={`rounded-xl border-2 transition-all ${
                  isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}>
                {/* Card header */}
                <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                  {isPending && (
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(task.id)}
                      className="mt-0.5 w-4 h-4 rounded accent-blue-600 flex-shrink-0 cursor-pointer" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {task.leader?.mahalla_name} MFY
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{task.created_at}</p>
                  </div>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    task.status === 'yashil' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                    task.status === 'qizil'  ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                                               'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                  }`}>
                    {task.status === 'yashil' ? `${task.score} ball` : task.status === 'qizil' ? 'Rad' : 'Kutilmoqda'}
                  </span>
                </div>

                {/* Thumbnails */}
                {task.attachments?.length > 0 && (
                  <div className={`px-4 pb-3 grid gap-2 ${task.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {task.attachments.slice(0, 4).map((att, i) => (
                      <div key={i} className="relative">
                        <ThumbPreview file={att} />
                        {i === 3 && task.attachments.length > 4 && (
                          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">+{task.attachments.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Expand toggle */}
                <div className="px-4 pb-4">
                  <button onClick={() => setExpanded(isExpanded ? null : task.id)}
                    className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline text-center py-1">
                    {isExpanded ? 'Yig\'ish ▲' : `To'liq ko'rish ▼ (${task.attachments?.length || 0} fayl)`}
                  </button>

                  {isExpanded && task.attachments?.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {task.attachments.map((att, i) => <FullPreview key={i} file={att} />)}
                    </div>
                  )}

                  {task.status === 'qizil' && task.admin_comment && (
                    <div className="mt-2 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-600 dark:text-red-400">{task.admin_comment}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
