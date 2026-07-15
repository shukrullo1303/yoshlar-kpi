import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2, FileText, Download, Target } from 'lucide-react'
import { api } from '../services/api'

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url)
}

function isPdf(url) {
  return /\.pdf(\?|$)/i.test(url)
}

// Convert absolute localhost URL to relative so Vite proxy handles it (fixes SAMEORIGIN iframe block)
function toRelative(url) {
  if (!url) return url
  try {
    const u = new URL(url)
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return u.pathname + u.search
  } catch (_) {}
  return url
}

function FilePreview({ file }) {
  const url = toRelative(file.file)
  const name = decodeURIComponent(url.split('/').pop())

  if (isImage(url)) {
    const takenAt = file.photo_taken_at
    const takenDate = takenAt ? new Date(takenAt) : null
    const now = new Date()
    const daysDiff = takenDate ? Math.floor((now - takenDate) / 86400000) : null
    const isOld = daysDiff !== null && daysDiff > 30
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
        <img src={url} alt={name} className="w-full max-h-96 object-contain bg-slate-50 dark:bg-slate-900" />
        <div className="px-3 py-2 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{name}</span>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex-shrink-0 ml-2 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Yuklab olish
            </a>
          </div>
          {takenDate && (
            <div className={`text-xs flex items-center gap-1 ${isOld ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
              📷 Olingan: {takenDate.toLocaleDateString('uz-UZ')}
              {isOld && ` — ${daysDiff} kun oldin (eski rasm!)`}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isPdf(url)) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
        <iframe
          src={url}
          className="w-full bg-slate-100 dark:bg-slate-900 border-0"
          style={{ height: '600px' }}
          title={name}
        />
        <div className="px-3 py-2 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{name}</span>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex-shrink-0 ml-2 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Yuklab olish
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900">
      <FileText className="w-8 h-8 text-slate-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{name}</p>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-blue-600 hover:underline flex-shrink-0">
        <Download className="w-3.5 h-3.5" /> Yuklab olish
      </a>
    </div>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800 dark:text-slate-200">{String(value)}</span>
    </div>
  )
}

const STATUS_TABS = [
  { key: 'sariq',  label: 'Kutilmoqda',      activeBg: 'bg-amber-500',   inactiveText: 'text-amber-600'  },
  { key: 'yashil', label: 'Tasdiqlanganlar', activeBg: 'bg-emerald-600', inactiveText: 'text-emerald-600' },
  { key: 'qizil',  label: 'Rad etilganlar',  activeBg: 'bg-red-600',     inactiveText: 'text-red-600'    },
]

export function TaskSlider({ direction, maxScore, month }) {
  const [taskStatus, setTaskStatus] = useState('sariq')
  const [tasks, setTasks] = useState([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [score, setScore] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [counts, setCounts] = useState({ sariq: 0, yashil: 0, qizil: 0 })
  const [planScore, setPlanScore] = useState(null)
  const [planLoading, setPlanLoading] = useState(true)

  // If no month selected, fall back to current month so plan always loads
  const planMonth = month || (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })()

  useEffect(() => {
    if (!direction) { setPlanScore(null); setPlanLoading(false); return }
    setPlanLoading(true)
    api.getMonthPlan(direction, planMonth)
      .then(data => {
        const tc = data.target_count ?? (data.default_target > 0 ? data.default_target : null)
        if (tc && data.max_score) {
          setPlanScore(Math.round((data.max_score / tc) * 100) / 100)
        } else {
          setPlanScore(null)
        }
      })
      .catch(() => setPlanScore(null))
      .finally(() => setPlanLoading(false))
  }, [direction, planMonth])

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

  const loadTasks = useCallback(async (st) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getSliderTasks(direction, month, st)
      setTasks(data)
      setIdx(0)
      setRejecting(false)
      setRejectComment('')
      setActionError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [direction, month])

  useEffect(() => { loadCounts(); loadTasks(taskStatus) }, [direction, month]) // eslint-disable-line
  useEffect(() => { loadCounts(); loadTasks(taskStatus) }, [taskStatus]) // eslint-disable-line

  // Reset score + UI when navigating tasks
  useEffect(() => {
    setScore(planScore !== null ? String(planScore) : '')
    setRejecting(false)
    setRejectComment('')
    setActionError(null)
  }, [idx, maxScore, planScore])

  const handleApprove = async () => {
    const task = tasks[idx]
    setBusy(true)
    setActionError(null)
    try {
      await api.reviewTask(task.id, 'tasdiqlash', score !== '' ? Number(score) : null)
      await loadCounts()
      const updated = await api.getSliderTasks(direction, month, taskStatus)
      setTasks(updated)
      setIdx(i => Math.min(i, Math.max(updated.length - 1, 0)))
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleReject = async () => {
    if (!rejectComment.trim()) return
    const task = tasks[idx]
    setBusy(true)
    setActionError(null)
    try {
      await api.reviewTask(task.id, 'rad_etish', undefined, rejectComment.trim())
      setRejecting(false)
      setRejectComment('')
      await loadCounts()
      const updated = await api.getSliderTasks(direction, month, taskStatus)
      setTasks(updated)
      setIdx(i => Math.min(i, Math.max(updated.length - 1, 0)))
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const task = tasks[idx]
  const scoreMax = planScore ?? maxScore  // per-task cap; falls back to direction max only if no plan/default

  return (
    <div className="space-y-5">
      {/* Status tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-4">
        {STATUS_TABS.map(tab => (
          <button key={tab.key} onClick={() => setTaskStatus(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              taskStatus === tab.key
                ? `${tab.activeBg} text-white shadow-sm`
                : `bg-slate-100 dark:bg-slate-700 ${tab.inactiveText} hover:bg-slate-200 dark:hover:bg-slate-600`
            }`}>
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              taskStatus === tab.key ? 'bg-white/25 text-white' : 'bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300'
            }`}>{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Plan badge */}
      <div className="flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 border
        bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300">
        <Target className="w-4 h-4 flex-shrink-0" />
        <span>1 topshiriq uchun max ball:</span>
        {planLoading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />
          : planScore !== null
            ? <strong className="ml-1 text-emerald-600 dark:text-emerald-400 text-base">{planScore}</strong>
            : <span className="ml-1 text-amber-600 dark:text-amber-400 font-semibold">Reja qo'yilmagan</span>
        }
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl p-5 text-sm">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <CheckCircle2 className="w-12 h-12 mb-3 opacity-25" />
          <p className="text-base font-medium">
            {taskStatus === 'sariq' ? "Kutilayotgan topshiriqlar yo'q" :
             taskStatus === 'yashil' ? "Tasdiqlangan topshiriqlar yo'q" :
             "Rad etilgan topshiriqlar yo'q"}
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200">{idx + 1}</span> / {tasks.length} ta topshiriq
            </span>
            <div className="flex gap-1 flex-wrap justify-end max-w-xs">
              {tasks.slice(0, 30).map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === idx ? 'bg-blue-600 w-4' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 w-2'}`} />
              ))}
              {tasks.length > 30 && <span className="text-xs text-slate-400">+{tasks.length - 30}</span>}
            </div>
          </div>

          <div className="flex items-stretch gap-2">
            <button onClick={() => setIdx(i => Math.max(i - 1, 0))} disabled={idx === 0}
              className="flex-shrink-0 self-center p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-20 transition-all shadow-sm">
              <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: '75vh' }}>
              {/* Card header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{task.leader?.mahalla_name} MFY</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{task.leader?.district} · {task.created_at}</p>
                  </div>
                  <span className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${
                    task.status === 'yashil' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                    task.status === 'qizil'  ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                                               'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                  }`}>
                    {task.status === 'yashil' ? 'Tasdiqlangan' : task.status === 'qizil' ? 'Rad etilgan' : 'Kutilmoqda'}
                  </span>
                </div>
              </div>

              {/* ── Action bar at TOP (always visible, no scroll needed) ── */}
              {taskStatus === 'sariq' && (
                <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3">
                  {actionError && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{actionError}</p>}
                  {rejecting ? (
                    <div className="space-y-2">
                      <textarea value={rejectComment} onChange={e => setRejectComment(e.target.value)}
                        placeholder="Rad etish sababini kiriting..." rows={2}
                        className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500" />
                      <div className="flex gap-2">
                        <button onClick={handleReject} disabled={busy || !rejectComment.trim()}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Rad etishni tasdiqlash
                        </button>
                        <button onClick={() => { setRejecting(false); setRejectComment('') }}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors">
                          Bekor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      {planLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Reja yuklanmoqda...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Ball:</label>
                          <input
                            type="number" min={0} max={scoreMax} step={0.01} value={score}
                            onChange={e => {
                              const v = Number(e.target.value)
                              setScore(v > scoreMax ? String(scoreMax) : e.target.value)
                            }}
                            placeholder={String(scoreMax)}
                            className="w-24 text-center border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {scoreMax} ball max
                          </span>
                        </div>
                      )}
                      {!planLoading && score === '' && planScore === null && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">Avval reja qo'ying</span>
                      )}
                      <button onClick={handleApprove} disabled={busy || score === '' || planLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Tasdiqlash
                      </button>
                      <button onClick={() => setRejecting(true)} disabled={busy}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
                        <XCircle className="w-4 h-4" /> Rad etish
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {(task.text_comment || task.event_name || task.youth_count || task.location ||
                  task.event_time || task.profilaktika_type_display || task.student_fio ||
                  task.startup_name || task.startup_owner_fio) && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-2.5 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Ma'lumotlar</p>
                    <InfoRow label="Izoh" value={task.text_comment} />
                    <InfoRow label="Tadbir nomi" value={task.event_name} />
                    <InfoRow label="Tadbir turi" value={task.event_type_display} />
                    <InfoRow label="Yoshlar soni" value={task.youth_count} />
                    <InfoRow label="Joy" value={task.location} />
                    <InfoRow label="Vaqt" value={task.event_time} />
                    <InfoRow label="Profilaktika" value={task.profilaktika_type_display} />
                    <InfoRow label="O'quvchi FIO" value={task.student_fio} />
                    <InfoRow label="Startap nomi" value={task.startup_name} />
                    <InfoRow label="Startapchi FIO" value={task.startup_owner_fio} />
                  </div>
                )}

                {task.attachments?.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Yuklangan fayllar ({task.attachments.length} ta)
                    </p>
                    {task.attachments.map((att, i) => <FilePreview key={i} file={att} />)}
                  </div>
                ) : (
                  !task.text_comment && !task.event_name && !task.startup_name && !task.student_fio && (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-4">Fayl yoki ma'lumot yuklanmagan</p>
                  )
                )}

                {task.status === 'yashil' && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Berilgan ball</span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{task.score} / {maxScore}</span>
                  </div>
                )}
                {task.status === 'qizil' && task.admin_comment && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
                    <p className="text-xs font-semibold text-red-500 mb-1">Rad etish sababi</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{task.admin_comment}</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => setIdx(i => Math.min(i + 1, tasks.length - 1))} disabled={idx === tasks.length - 1}
              className="flex-shrink-0 self-center p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-20 transition-all shadow-sm">
              <ChevronRight className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
