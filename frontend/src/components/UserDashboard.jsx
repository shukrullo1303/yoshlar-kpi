import { useState, useEffect, useRef } from 'react'
import { LogOut, Upload, CheckCircle2, Clock, XCircle, X, Loader2, ImageIcon, FileText, Trash2 } from 'lucide-react'
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

function UploadModal({ dir, month, onClose, onSuccess }) {
  const config = DIR_FIELDS[dir.direction]
  const [fields, setFields] = useState({})
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const setField = (k, v) => setFields(f => ({ ...f, [k]: v }))
  const addFiles = (e) => { setFiles(p => [...p, ...Array.from(e.target.files)]); e.target.value = '' }
  const removeFile = (i) => setFiles(p => p.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    setError(null)
    for (const f of (config?.extra || [])) {
      if (f.required && !fields[f.key]?.trim()) { setError(`"${f.label}" maydonini to'ldiring`); return }
    }
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base leading-tight">{dir.label}</h2>
            {config?.note && <p className="text-xs text-slate-500 mt-0.5">{config.note}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {config?.extra?.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === 'select' ? (
                <select value={fields[f.key] || ''} onChange={e => setField(f.key, e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Tanlang —</option>
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : (
                <input type={f.type} value={fields[f.key] || ''} onChange={e => setField(f.key, e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              )}
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Qo'shimcha izoh</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder="Qo'shimcha ma'lumot yoki izoh..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fayllar (rasm, PDF)</label>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-5 flex flex-col items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
              <Upload className="w-6 h-6" />
              <span className="text-sm font-medium">Fayl tanlash yoki bu yerga tashlang</span>
              <span className="text-xs text-slate-400">JPG, PNG, PDF — 10 MB gacha</span>
            </button>
            <input ref={fileRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={addFiles} />
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                    {f.type.startsWith('image/')
                      ? <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      : <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    <span className="flex-1 text-xs text-slate-700 truncate">{f.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => removeFile(i)} className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          {error && <p className="flex-1 text-sm text-red-600">{error}</p>}
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200">
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

function DirectionCard({ dir, index, onUpload }) {
  const canUpload = dir.is_uploadable && !!DIR_FIELDS[dir.direction]
  const p = pct(dir.score, dir.max_score)
  const barColor = p >= 80 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : p > 0 ? 'bg-blue-500' : 'bg-slate-200'

  return (
    <div onClick={canUpload ? onUpload : undefined}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all
        ${canUpload ? 'cursor-pointer hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5' : 'opacity-90'}`}>

      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0
          ${dir.admin_scored ? 'bg-slate-500' : 'bg-blue-600'}`}>
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug">{dir.label}</h3>
          <p className="text-xs text-slate-400 mt-1">Max: {dir.max_score} ball</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="text-2xl font-black text-slate-900">{dir.score}</div>
            <div className="text-xs text-slate-400">ball</div>
          </div>
          {canUpload && (
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <Upload className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${p}%` }} />
          </div>
          <span className="text-xs font-semibold text-slate-500 w-10 text-right">{p}%</span>
        </div>
      </div>

      <div className="px-5 pb-3">
        <p className="text-xs text-slate-500 leading-relaxed">{dir.info}</p>
      </div>

      <div className="px-5 pb-4 pt-1 flex gap-2 flex-wrap min-h-[2rem]">
        {dir.admin_scored ? (
          <span className="text-xs text-slate-400 italic">Admin baholaydi</span>
        ) : (
          <>
            {dir.approved_count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3" /> {dir.approved_count} tasdiqlangan
              </span>
            )}
            {dir.pending_count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                <Clock className="w-3 h-3" /> {dir.pending_count} kutmoqda
              </span>
            )}
            {dir.rejected_count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                <XCircle className="w-3 h-3" /> {dir.rejected_count} rad etilgan
              </span>
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

export function UserDashboard({ user, directions: directionsProp = [], onLogout }) {
  const [month, setMonth] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openDir, setOpenDir] = useState(null)

  const activeMonth = month || null

  const load = () => {
    setLoading(true); setError(null)
    api.getUserDashboard(activeMonth)
      .then(setData).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [activeMonth])
  const handleSuccess = () => { setOpenDir(null); load() }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(user.mahalla_name || user.username)?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 leading-tight truncate">
                {user.mahalla_name ? `${user.mahalla_name} MFY` : user.username}
              </p>
              <p className="text-xs text-slate-500">{user.district || 'Asaka tumani'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 hidden sm:block">Oy:</label>
              <input type="month"
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={e => setMonth(e.target.value ? `${e.target.value}-01` : '')} />
              {month && (
                <button onClick={() => setMonth('')} className="text-xs text-slate-400 hover:text-slate-600 underline hidden sm:block">
                  Barchasi
                </button>
              )}
            </div>
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
                  <DirectionCard key={dir.direction} dir={dir} index={i + 1} onUpload={() => setOpenDir(dir)} />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-64 xl:w-72 lg:flex-shrink-0 space-y-4 lg:sticky lg:top-20">
              <RankBadge rank={data.rank} total={data.total_profiles} />

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Jami ball</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-4xl font-black text-slate-900">{data.total_score}</span>
                  <span className="text-lg text-slate-400 mb-1">/ {data.max_total}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${pct(data.total_score, data.max_total)}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-2 text-right">
                  {pct(data.total_score, data.max_total)}% bajarildi
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  Yo'nalishlar bo'yicha
                </p>
                <div className="space-y-3">
                  {data.directions.map((dir, i) => {
                    const p = pct(dir.score, dir.max_score)
                    const bc = p >= 80 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : p > 0 ? 'bg-blue-500' : 'bg-slate-200'
                    return (
                      <div key={dir.direction}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs text-slate-600 truncate pr-2">{i + 1}. {dir.label}</span>
                          <span className="text-xs font-bold text-slate-800 flex-shrink-0">
                            {dir.score}<span className="text-slate-400 font-normal">/{dir.max_score}</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${bc}`} style={{ width: `${p}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Topshiriqlar</p>
                <div className="space-y-2">
                  {[
                    { label: 'Kutilmoqda',   count: data.directions.reduce((s,d)=>s+d.pending_count,0),  bg:'bg-amber-50',   text:'text-amber-700'  },
                    { label: 'Tasdiqlangan', count: data.directions.reduce((s,d)=>s+d.approved_count,0), bg:'bg-emerald-50', text:'text-emerald-700' },
                    { label: 'Rad etilgan',  count: data.directions.reduce((s,d)=>s+d.rejected_count,0), bg:'bg-red-50',     text:'text-red-700'    },
                  ].map(s => (
                    <div key={s.label} className={`flex justify-between items-center rounded-xl px-4 py-2.5 ${s.bg}`}>
                      <span className="text-sm text-slate-600">{s.label}</span>
                      <span className={`text-base font-bold ${s.text}`}>{s.count}</span>
                    </div>
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
    </div>
  )
}
