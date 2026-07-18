import { useState, useEffect, useRef } from 'react'
import { LogOut, Upload, CheckCircle2, Clock, XCircle, X, Loader2, ImageIcon, FileText, Trash2, UserCog, AlertCircle } from 'lucide-react'
import { api } from '../services/api'

function pct(score, max) {
  return max ? Math.min(100, Math.round((score / max) * 100)) : 0
}

function RankBadge({ rank, total }) {
  if (!rank) return null
  const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
  const isTop = rank <= 3
  const isBot = rank > total - 3
  const grad = isTop ? 'from-emerald-500 to-emerald-600' : isBot ? 'from-red-500 to-red-600' : 'from-amber-500 to-amber-600'
  return (
    <div className={`bg-gradient-to-br ${grad} rounded-2xl p-5 text-white text-center shadow-lg`}>
      {emoji && <div className="text-3xl mb-1">{emoji}</div>}
      <div className="text-5xl font-black">{rank}</div>
      <div className="text-sm font-semibold opacity-90 mt-1">- o'rin</div>
      <div className="text-xs opacity-70 mt-0.5">{total} MFY ichida</div>
    </div>
  )
}

const DIR_FIELDS = {
  '2_balans':       { extra: [], note: "Yoshlar balansi ro'yxati va yangilanishlar" },
  '3_bandlik':      { extra: [], note: "Ish joylashtirilgan yoshlar haqida hujjat" },
  '4_bosh_vaqt':    {
    extra: [
      { key: 'event_name',  label: 'Tadbir nomi',        type: 'text',           required: true },
      { key: 'event_type',  label: 'Tadbir turi',         type: 'select', options: [
        ['sport','Sport'], ['kibersport','Kibersport'], ['musiqa','Musiqa'],
        ['manaviy',"Ma'naviy-ma'rifiy"], ['boshqa','Boshqa'],
      ]},
      { key: 'youth_count', label: 'Ishtirokchilar soni', type: 'number' },
      { key: 'location',    label: 'Joy',                 type: 'text' },
      { key: 'event_time',  label: 'Tadbir vaqti',        type: 'datetime-local' },
    ],
    note: "Tadbir rasmlari va ishtirokchilar ro'yxatini yuklang",
  },
  '5_profilaktika': {
    extra: [
      { key: 'profilaktika_type', label: 'Profilaktika turi', type: 'select', required: true, options: [
        ['suhbat','Profilaktik suhbat'], ['pq1','PQ-1 hujjat kiritish'],
      ]},
    ],
    note: 'Profilaktika suhbati bayonnomasi yoki PQ-1 hujjatini yuklang',
  },
  '6_murojaat': { extra: [], note: 'Murojaat va javob hujjatlarini yuklang' },
  '7_brend':    { extra: [], note: 'Brend loyiha materiallari va natijalarini yuklang' },
  '8_talim':    {
    extra: [{ key: 'student_fio', label: "O'quvchi F.I.O", type: 'text', required: true }],
    note: "O'quvchi hujjati va tasdiqlash materiallarini yuklang",
  },
  '9_startap':  {
    extra: [
      { key: 'startup_name',      label: 'Startap nomi',     type: 'text', required: true },
      { key: 'startup_owner_fio', label: 'Startapchi F.I.O', type: 'text', required: true },
    ],
    note: 'Startap loyiha tavsifi va tasdiqlash hujjatini yuklang',
  },
}

function ProfileModal({ onClose, onUpdated }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSave = async () => {
    setError(null); setSuccess(null)
    if (!firstName && !lastName && !newPassword) {
      setError("O'zgartirish uchun kamida bitta maydonni to'ldiring"); return
    }
    setSaving(true)
    try {
      const res = await api.updateProfile(firstName, lastName, oldPassword, newPassword)
      setSuccess(res.message)
      setOldPassword(''); setNewPassword('')
      if (onUpdated) onUpdated(res.full_name)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Profil sozlamalari</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ism</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Ism"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white text-slate-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Familiya</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Familiya"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white text-slate-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Parolni o'zgartirish</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Eski parol</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                  placeholder="Joriy parol"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white text-slate-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Yangi parol</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white text-slate-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>}
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600">
            Yopish
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Saqlash
          </button>
        </div>
      </div>
    </div>
  )
}

function UploadModal({ dir, month, onClose, onSuccess }) {
  const config = DIR_FIELDS[dir.direction]
  const [fields, setFields] = useState({})
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const setField = (k, v) => setFields(f => ({ ...f, [k]: v }))
  const addFiles = (e) => {
    const captured = Array.from(e.target.files)  // capture synchronously before clearing input
    e.target.value = ''
    if (captured.length) setFiles(p => [...p, ...captured])
  }
  const removeFile = (i) => setFiles(p => p.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    setError(null)
    for (const f of (config?.extra || [])) {
      if (f.required && !fields[f.key]?.trim()) { setError(`"${f.label}" maydonini to'ldiring`); return }
    }
    if (files.length === 0) { setError('Kamida bitta fayl (rasm yoki PDF) yuklash majburiy'); return }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('direction', dir.direction)
      fd.append('month', month || new Date().toISOString().slice(0, 7) + '-01')
      if (comment) fd.append('text_comment', comment)
      Object.entries(fields).forEach(([k, v]) => { if (v) fd.append(k, v) })
      files.forEach(f => fd.append('files', f))
      await api.submitTask(fd)
      onSuccess()
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">{dir.label}</h2>
            {config?.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{config.note}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {config?.extra?.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === 'select' ? (
                <select value={fields[f.key] || ''} onChange={e => setField(f.key, e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 dark:bg-slate-700 dark:text-white">
                  <option value="">— Tanlang —</option>
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : (
                <input type={f.type} value={fields[f.key] || ''} onChange={e => setField(f.key, e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 dark:bg-slate-700 dark:text-white" />
              )}
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Qo'shimcha izoh</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder="Qo'shimcha ma'lumot yoki izoh..."
              className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white text-slate-900 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Fayllar (rasm, PDF)</label>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 rounded-xl p-5 flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">
              <Upload className="w-6 h-6" />
              <span className="text-sm font-medium">Fayl tanlash yoki bu yerga tashlang</span>
              <span className="text-xs text-slate-400">JPG, PNG, PDF — 10 MB gacha</span>
            </button>
            <input ref={fileRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={addFiles} />
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-600">
                    {f.type.startsWith('image/')
                      ? <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      : <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 truncate">{f.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => removeFile(i)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
          {error && <p className="flex-1 text-sm text-red-600">{error}</p>}
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600">
            Bekor qilish
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Yuborish
          </button>
        </div>
      </div>
    </div>
  )
}

function RejectedModal({ direction, directionLabel, month, directions, onClose }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getRejectedTasks(direction, month)
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [direction, month])

  const dirLabel = (key) => {
    if (directionLabel) return directionLabel
    return directions?.find(d => d.direction === key)?.label || key
  }

  const UZ_MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
  const formatMonth = (m) => {
    if (!m) return ''
    const [y, mo] = m.split('-')
    return `${UZ_MONTHS[parseInt(mo) - 1]} ${y}`
  }

  function isImage(url) {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url || '')
  }
  function toRelative(url) {
    if (!url) return url
    try { const u = new URL(url); return u.pathname + u.search } catch (_) {}
    return url
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-4.5 h-4.5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">
                {directionLabel ? `${directionLabel} — rad etilganlar` : "Barcha rad etilgan topshiriqlar"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Eng yangilaridan boshlab</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">Rad etilgan topshiriqlar yo'q</div>
          ) : tasks.map(task => (
            <div key={task.id} className="rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden">
              {/* Top bar */}
              <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 truncate">{dirLabel(task.direction)}</p>
                  <p className="text-xs text-red-500 dark:text-red-500">{formatMonth(task.month)}</p>
                </div>
                <span className="text-xs text-red-400 dark:text-red-500 flex-shrink-0">{task.created_at}</span>
              </div>

              {/* Rejection reason */}
              {task.admin_comment && (
                <div className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-red-100 dark:border-red-900/30">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-0.5">Rad etish sababi:</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{task.admin_comment}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments preview */}
              {task.attachments?.length > 0 && (
                <div className="px-4 py-3 bg-white dark:bg-slate-800 flex gap-2 flex-wrap">
                  {task.attachments.slice(0, 4).map((att, i) => {
                    const url = toRelative(att.file)
                    return isImage(url) ? (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 flex-shrink-0 hover:opacity-80 transition-opacity">
                        <img src={url} alt="" className="w-full h-full object-cover bg-slate-100 dark:bg-slate-700" />
                      </a>
                    ) : (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="w-14 h-14 rounded-lg border border-slate-200 dark:border-slate-600 flex-shrink-0 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <span className="text-[9px] text-slate-400">PDF</span>
                      </a>
                    )
                  })}
                  {task.attachments.length > 4 && (
                    <div className="w-14 h-14 rounded-lg border border-slate-200 dark:border-slate-600 flex-shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-700">
                      <span className="text-xs font-bold text-slate-500">+{task.attachments.length - 4}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            Yopish
          </button>
        </div>
      </div>
    </div>
  )
}

function DirectionCard({ dir, index, onUpload, onViewRejected }) {
  const canUpload = dir.is_uploadable && !!DIR_FIELDS[dir.direction]
  const p = pct(dir.score, dir.max_score)
  const barColor = p >= 80 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : p > 0 ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'

  return (
    <div onClick={canUpload ? onUpload : undefined}
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all
        ${canUpload ? 'cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-0.5' : 'opacity-90'}`}>

      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0
          ${dir.admin_scored ? 'bg-slate-500' : 'bg-blue-600'}`}>
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">{dir.label}</h3>
          <p className="text-xs text-slate-400 mt-1">
            Max: {dir.max_score} ball
            {dir.plan_max_per_item && (
              <span className="ml-1.5 text-blue-500 dark:text-blue-400">· {dir.plan_max_per_item} ball/ta</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{dir.score}</div>
            {dir.plan_target ? (
              <div className={`text-xs font-semibold ${
                dir.approved_count >= dir.plan_target
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-blue-500 dark:text-blue-400'
              }`}>
                {dir.approved_count}/{dir.plan_target} topshiriq
              </div>
            ) : (
              <div className="text-xs text-slate-400">ball</div>
            )}
          </div>
          {canUpload && (
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
              <Upload className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${p}%` }} />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-10 text-right">{p}%</span>
        </div>
      </div>

      <div className="px-5 pb-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{dir.info}</p>
      </div>

      <div className="px-5 pb-4 pt-1 flex gap-2 flex-wrap min-h-[2rem]">
        {dir.admin_scored ? (
          <span className="text-xs text-slate-400 italic">Admin baholaydi</span>
        ) : (
          <>
            {dir.approved_count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> {dir.approved_count} tasdiqlangan
              </span>
            )}
            {dir.pending_count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                <Clock className="w-3 h-3" /> {dir.pending_count} kutmoqda
              </span>
            )}
            {dir.rejected_count > 0 && (
              <button
                onClick={e => { e.stopPropagation(); onViewRejected(dir) }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                <XCircle className="w-3 h-3" /> {dir.rejected_count} rad etilgan
              </button>
            )}
            {!dir.approved_count && !dir.pending_count && !dir.rejected_count && (
              <span className="text-xs text-slate-400">Hali material yuklanmagan — bosing</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function UserDashboard({ user, directions: directionsProp = [], onLogout, onUserUpdate, darkMode, toggleDark }) {
  const [month, setMonth] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openDir, setOpenDir] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [rejectedDir, setRejectedDir] = useState(null) // {direction, label} | 'all'

  const activeMonth = month || null

  const load = () => {
    setLoading(true); setError(null)
    api.getUserDashboard(activeMonth)
      .then(setData).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [activeMonth])
  const handleSuccess = () => { setOpenDir(null); load() }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-900">

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm">
        <div className="container py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(user.mahalla_name || user.username)?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                {user.mahalla_name ? `${user.mahalla_name} MFY` : user.username}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.district || 'Asaka tumani'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Oy:</label>
              <input type="month"
                className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-slate-700 dark:text-white bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={e => setMonth(e.target.value ? `${e.target.value}-01` : '')} />
              {month && (
                <button onClick={() => setMonth('')} className="text-xs text-slate-400 hover:text-slate-600 underline hidden sm:block">
                  Barchasi
                </button>
              )}
            </div>
            <button
              onClick={() => setProfileOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              title="Profil sozlamalari"
            >
              <UserCog className="w-4 h-4" />
            </button>
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
        ) : data && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Main */}
            <div className="flex-1 min-w-0 space-y-5 w-full">
              {/* Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl px-6 py-5 flex items-center justify-between gap-4 shadow-lg">
                <div className="min-w-0">
                  <p className="font-bold text-lg sm:text-xl truncate">Salom, {data.mahalla_name} MFY!</p>
                  <p className="text-blue-200 text-xs sm:text-sm mt-1">
                    Yo'nalish kartochkasiga bosib material yuklang
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-4xl sm:text-5xl font-black">{data.total_score}</div>
                  <div className="text-blue-200 text-sm">/ {data.max_total} ball</div>
                </div>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.directions.map((dir, i) => (
                  <DirectionCard key={dir.direction} dir={dir} index={i + 1}
                    onUpload={() => setOpenDir(dir)}
                    onViewRejected={d => setRejectedDir({ direction: d.direction, label: d.label })}
                  />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-64 xl:w-72 lg:flex-shrink-0 space-y-4 lg:sticky lg:top-20">
              <RankBadge rank={data.rank} total={data.total_profiles} />

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Jami ball</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-4xl font-black text-slate-900 dark:text-slate-100">{data.total_score}</span>
                  <span className="text-lg text-slate-400 mb-1">/ {data.max_total}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${pct(data.total_score, data.max_total)}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-2 text-right">
                  {pct(data.total_score, data.max_total)}% bajarildi
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                  Yo'nalishlar bo'yicha
                </p>
                <div className="space-y-3">
                  {data.directions.map((dir, i) => {
                    const p = pct(dir.score, dir.max_score)
                    const bc = p >= 80 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : p > 0 ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                    return (
                      <div key={dir.direction}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs text-slate-600 dark:text-slate-300 truncate pr-2">{i + 1}. {dir.label}</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex-shrink-0">
                            {dir.score}<span className="text-slate-400 font-normal">/{dir.max_score}</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${bc}`} style={{ width: `${p}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Topshiriqlar</p>
                <div className="space-y-2">
                  {[
                    { label: 'Kutilmoqda',   count: data.directions.reduce((s,d)=>s+d.pending_count,0),  bg:'bg-amber-50 dark:bg-amber-900/20',   text:'text-amber-700 dark:text-amber-400'  },
                    { label: 'Tasdiqlangan', count: data.directions.reduce((s,d)=>s+d.approved_count,0), bg:'bg-emerald-50 dark:bg-emerald-900/20', text:'text-emerald-700 dark:text-emerald-400' },
                    { label: 'Rad etilgan',  count: data.directions.reduce((s,d)=>s+d.rejected_count,0), bg:'bg-red-50 dark:bg-red-900/20',     text:'text-red-700 dark:text-red-400',
                      onClick: data.directions.reduce((s,d)=>s+d.rejected_count,0) > 0
                        ? () => setRejectedDir('all') : undefined },
                  ].map(s => (
                    s.onClick ? (
                      <button key={s.label} onClick={s.onClick}
                        className={`w-full flex justify-between items-center rounded-xl px-4 py-2.5 ${s.bg} hover:opacity-80 transition-opacity text-left`}>
                        <span className="text-sm text-slate-600 dark:text-slate-300">{s.label}</span>
                        <span className={`text-base font-bold ${s.text}`}>{s.count}</span>
                      </button>
                    ) : (
                      <div key={s.label} className={`flex justify-between items-center rounded-xl px-4 py-2.5 ${s.bg}`}>
                        <span className="text-sm text-slate-600 dark:text-slate-300">{s.label}</span>
                        <span className={`text-base font-bold ${s.text}`}>{s.count}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {openDir && (
        <UploadModal dir={openDir} month={activeMonth} onClose={() => setOpenDir(null)} onSuccess={handleSuccess} />
      )}
      {profileOpen && (
        <ProfileModal
          onClose={() => setProfileOpen(false)}
          onUpdated={(fullName) => {
            setProfileOpen(false)
            if (onUserUpdate) onUserUpdate(fullName)
          }}
        />
      )}
      {rejectedDir && (
        <RejectedModal
          direction={rejectedDir === 'all' ? undefined : rejectedDir.direction}
          directionLabel={rejectedDir === 'all' ? undefined : rejectedDir.label}
          month={activeMonth}
          directions={data?.directions}
          onClose={() => setRejectedDir(null)}
        />
      )}
    </div>
  )
}
