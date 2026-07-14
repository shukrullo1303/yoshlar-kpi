import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2, XCircle, Loader2, FileText, Download,
  ChevronDown, ChevronUp, RefreshCw, Target,
} from 'lucide-react'
import { api } from '../services/api'

function isImg(url) { return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url) }
function isPdf(url) { return /\.pdf(\?|$)/i.test(url) }

function AttachmentRow({ att, checked, onToggle, isPending }) {
  const url = att.file
  const name = decodeURIComponent(url.split('/').pop())
  const img = isImg(url)
  const pdf = isPdf(url)

  const takenDate = att.photo_taken_at ? new Date(att.photo_taken_at) : null
  const daysDiff  = takenDate ? Math.floor((Date.now() - takenDate) / 86400000) : null
  const isOld     = daysDiff !== null && daysDiff > 30

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
        checked
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
      }`}
      onClick={() => isPending && onToggle(att.id)}
    >
      {isPending && (
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(att.id)}
          onClick={e => e.stopPropagation()}
          className="mt-1 w-4 h-4 rounded accent-blue-600 flex-shrink-0"
        />
      )}

      {/* Thumbnail */}
      <div className="w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        {img ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : pdf ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <FileText className="w-6 h-6" />
            <span className="text-[10px] mt-0.5">PDF</span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <FileText className="w-6 h-6" />
            <span className="text-[10px] mt-0.5">Fayl</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{name}</p>
        {takenDate && (
          <p className={`text-[11px] flex items-center gap-1 ${isOld ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
            📷 {takenDate.toLocaleDateString('uz-UZ')}
            {isOld && ` — ${daysDiff} kun oldin!`}
          </p>
        )}
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="flex items-center gap-1 text-xs text-blue-600 hover:underline flex-shrink-0 mt-1"
      >
        <Download className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800 dark:text-slate-200">{String(value)}</span>
    </div>
  )
}

const STATUS_TABS = [
  { key: 'sariq',  label: 'Kutilmoqda',      activeBg: 'bg-amber-500',   inactiveText: 'text-amber-600'   },
  { key: 'yashil', label: 'Tasdiqlanganlar', activeBg: 'bg-emerald-600', inactiveText: 'text-emerald-600' },
  { key: 'qizil',  label: 'Rad etilganlar',  activeBg: 'bg-red-600',     inactiveText: 'text-red-600'     },
]

export function TaskListPanel({ direction, maxScore, month }) {
  const [taskStatus, setTaskStatus]   = useState('sariq')
  const [tasks, setTasks]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [counts, setCounts]           = useState({ sariq: 0, yashil: 0, qizil: 0 })
  const [perEventScore, setPerEventScore] = useState(null)

  // Per-task UI state
  const [expandedId, setExpandedId]       = useState(null)
  const [checkedAtts, setCheckedAtts]     = useState({})   // taskId → Set<attId>
  const [rejectingId, setRejectingId]     = useState(null)
  const [rejectComments, setRejectComments] = useState({}) // taskId → string
  const [busy, setBusy]                   = useState({})   // taskId → bool
  const [actionErrors, setActionErrors]   = useState({})   // taskId → string

  useEffect(() => {
    if (!direction || !month) { setPerEventScore(null); return }
    api.getMonthPlan(direction, month)
      .then(data => {
        if (data.target_count && data.max_score) {
          setPerEventScore(Math.round((data.max_score / data.target_count) * 100) / 100)
        } else {
          setPerEventScore(null)
        }
      })
      .catch(() => setPerEventScore(null))
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

  const loadTasks = useCallback(async (st) => {
    setLoading(true)
    try {
      const data = await api.getSliderTasks(direction, month, st)
      setTasks(data)
      setExpandedId(null)
      setRejectingId(null)
      // Init checked: all attachments selected
      const init = {}
      data.forEach(t => {
        init[t.id] = new Set((t.attachments || []).map(a => a.id))
      })
      setCheckedAtts(init)
    } catch (_) {}
    finally { setLoading(false) }
  }, [direction, month])

  useEffect(() => { loadCounts(); loadTasks(taskStatus) }, [direction, month]) // eslint-disable-line
  useEffect(() => { loadCounts(); loadTasks(taskStatus) }, [taskStatus])       // eslint-disable-line

  const getChecked = (task) =>
    checkedAtts[task.id] ?? new Set((task.attachments || []).map(a => a.id))

  const toggleAtt = (task, attId) => {
    const cur = getChecked(task)
    const next = new Set(cur)
    next.has(attId) ? next.delete(attId) : next.add(attId)
    setCheckedAtts(prev => ({ ...prev, [task.id]: next }))
  }

  const computeScore = (task) => {
    const count = getChecked(task).size
    if (!count) return 0
    if (perEventScore !== null) return Math.min(+(count * perEventScore).toFixed(2), maxScore)
    return maxScore
  }

  const handleApprove = async (task) => {
    setBusy(prev => ({ ...prev, [task.id]: true }))
    setActionErrors(prev => ({ ...prev, [task.id]: null }))
    try {
      const score = computeScore(task)
      await api.reviewTask(task.id, 'tasdiqlash', score)
      await loadCounts()
      await loadTasks(taskStatus)
    } catch (e) {
      setActionErrors(prev => ({ ...prev, [task.id]: e.message }))
    } finally {
      setBusy(prev => ({ ...prev, [task.id]: false }))
    }
  }

  const handleReject = async (task) => {
    const comment = (rejectComments[task.id] || '').trim()
    if (!comment) return
    setBusy(prev => ({ ...prev, [task.id]: true }))
    setActionErrors(prev => ({ ...prev, [task.id]: null }))
    try {
      await api.reviewTask(task.id, 'rad_etish', undefined, comment)
      setRejectingId(null)
      await loadCounts()
      await loadTasks(taskStatus)
    } catch (e) {
      setActionErrors(prev => ({ ...prev, [task.id]: e.message }))
    } finally {
      setBusy(prev => ({ ...prev, [task.id]: false }))
    }
  }

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id)
    setRejectingId(null)
  }

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-2 flex-1 flex-wrap">
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
        <button onClick={() => { loadCounts(); loadTasks(taskStatus) }}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Plan hint */}
      {perEventScore !== null && (
        <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-2.5 text-blue-700 dark:text-blue-300">
          <Target className="w-4 h-4 flex-shrink-0" />
          Har bir fayl uchun ball: <strong className="ml-1">{perEventScore}</strong>
          <span className="text-blue-500 dark:text-blue-400 ml-2">(max {maxScore})</span>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <CheckCircle2 className="w-12 h-12 mb-3 opacity-25" />
          <p className="text-base font-medium">
            {taskStatus === 'sariq' ? "Kutilayotgan topshiriqlar yo'q" :
             taskStatus === 'yashil' ? "Tasdiqlangan topshiriqlar yo'q" :
             "Rad etilgan topshiriqlar yo'q"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const isExpanded  = expandedId === task.id
            const isRejecting = rejectingId === task.id
            const isBusy      = !!busy[task.id]
            const attError    = actionErrors[task.id]
            const checked     = getChecked(task)
            const score       = computeScore(task)
            const isPending   = task.status === 'sariq'

            return (
              <div
                key={task.id}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isExpanded
                    ? 'border-blue-400 dark:border-blue-500 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                } bg-white dark:bg-slate-800`}
              >
                {/* Row (always visible) */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => toggleExpand(task.id)}
                >
                  {/* Status dot */}
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    task.status === 'yashil' ? 'bg-emerald-500' :
                    task.status === 'sariq'  ? 'bg-amber-400'   : 'bg-red-400'
                  }`} />

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {task.leader?.mahalla_name} MFY
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {task.leader?.full_name && <span>{task.leader.full_name} · </span>}
                      {task.created_at}
                    </p>
                  </div>

                  {/* Attachment count */}
                  {task.attachments?.length > 0 && (
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full flex-shrink-0">
                      {task.attachments.length} fayl
                    </span>
                  )}

                  {/* Score / status badge */}
                  <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                    task.status === 'yashil' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                    task.status === 'qizil'  ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                                               'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                  }`}>
                    {task.status === 'yashil' ? `${task.score} ball` :
                     task.status === 'qizil'  ? 'Rad etilgan' : 'Kutilmoqda'}
                  </span>

                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </div>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700">
                    {/* ── Action bar (always at top → visible without scroll) ── */}
                    {isPending && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 flex-wrap">
                        {perEventScore !== null ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Tanlangan:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{checked.size} ta</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{score}</span>
                            <span className="text-slate-400 text-xs">/ {maxScore}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                            Ball: <span className="font-bold text-slate-900 dark:text-white">{maxScore}</span>
                          </div>
                        )}

                        {attError && (
                          <p className="text-xs text-red-500 flex-1">{attError}</p>
                        )}

                        <div className="flex gap-2 ml-auto">
                          {!isRejecting ? (
                            <>
                              <button
                                onClick={() => handleApprove(task)}
                                disabled={isBusy || checked.size === 0}
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                              >
                                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Tasdiqlash
                              </button>
                              <button
                                onClick={() => setRejectingId(task.id)}
                                disabled={isBusy}
                                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                              >
                                <XCircle className="w-4 h-4" /> Rad etish
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setRejectingId(null)}
                              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                              Bekor
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reject form */}
                    {isPending && isRejecting && (
                      <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 space-y-2">
                        <textarea
                          value={rejectComments[task.id] || ''}
                          onChange={e => setRejectComments(prev => ({ ...prev, [task.id]: e.target.value }))}
                          placeholder="Rad etish sababini kiriting..."
                          rows={2}
                          className="w-full text-sm border border-red-300 dark:border-red-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button
                          onClick={() => handleReject(task)}
                          disabled={isBusy || !(rejectComments[task.id] || '').trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Rad etishni tasdiqlash
                        </button>
                      </div>
                    )}

                    {/* ── Scrollable body ── */}
                    <div className="overflow-y-auto max-h-[22rem] p-4 space-y-4">
                      {/* Task info */}
                      {(task.event_name || task.event_type_display || task.youth_count || task.location ||
                        task.event_time || task.profilaktika_type_display || task.student_fio ||
                        task.startup_name || task.startup_owner_fio || task.text_comment) && (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3.5 space-y-2 border border-slate-100 dark:border-slate-700">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Ma'lumotlar</p>
                          <InfoRow label="Izoh"          value={task.text_comment} />
                          <InfoRow label="Tadbir nomi"   value={task.event_name} />
                          <InfoRow label="Tadbir turi"   value={task.event_type_display} />
                          <InfoRow label="Yoshlar soni"  value={task.youth_count} />
                          <InfoRow label="Joy"           value={task.location} />
                          <InfoRow label="Vaqt"          value={task.event_time} />
                          <InfoRow label="Profilaktika"  value={task.profilaktika_type_display} />
                          <InfoRow label="O'quvchi FIO"  value={task.student_fio} />
                          <InfoRow label="Startap nomi"  value={task.startup_name} />
                          <InfoRow label="Startapchi FIO" value={task.startup_owner_fio} />
                        </div>
                      )}

                      {/* Approved/rejected status for non-pending */}
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

                      {/* Attachments */}
                      {task.attachments?.length > 0 ? (
                        <div className="space-y-2">
                          {isPending && (
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Fayllar ({task.attachments.length} ta)
                              </p>
                              <button
                                onClick={() => {
                                  const all = new Set(task.attachments.map(a => a.id))
                                  const cur = getChecked(task)
                                  const nextAll = cur.size === all.size ? new Set() : all
                                  setCheckedAtts(prev => ({ ...prev, [task.id]: nextAll }))
                                }}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {getChecked(task).size === task.attachments.length ? 'Hammasini bekor' : 'Hammasini tanlash'}
                              </button>
                            </div>
                          )}
                          {task.attachments.map(att => (
                            <AttachmentRow
                              key={att.id}
                              att={att}
                              checked={checked.has(att.id)}
                              onToggle={(id) => toggleAtt(task, id)}
                              isPending={isPending}
                            />
                          ))}
                        </div>
                      ) : (
                        !task.event_name && !task.text_comment && !task.startup_name && !task.student_fio && (
                          <p className="text-sm text-slate-400 italic text-center py-4">Fayl yuklanmagan</p>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
