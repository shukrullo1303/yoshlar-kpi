import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { Save, Plus, Eye, EyeOff, Download, RefreshCw, CheckCircle } from 'lucide-react'

// ─── Excel (CSV) eksport ───────────────────────────────────────────────────────
function exportCSV(profiles) {
  const headers = ['#', 'Login', 'Ism', 'Familya', 'To\'liq ism', 'Mahalla', 'Tuman', 'Holat']
  const rows = profiles.map((p, i) => [
    i + 1,
    p.username,
    p.first_name || '',
    p.last_name || '',
    p.full_name || '',
    p.mahalla_name || '',
    p.district || '',
    p.is_active ? 'Faol' : 'Nofaol',
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `foydalanuvchilar_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Bitta foydalanuvchi qatori ───────────────────────────────────────────────
function UserRow({ profile, idx, onSaved }) {
  const [saving, setSaving]   = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({
    username:     profile.username,
    first_name:   profile.first_name || '',
    last_name:    profile.last_name || '',
    mahalla_name: profile.mahalla_name || '',
    district:     profile.district || '',
    password:     '',
    is_active:    profile.is_active,
  })

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); setError('') }

  const save = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      const payload = { ...form }
      if (!payload.password.trim()) delete payload.password
      await api.saUpdateUser(profile.id, payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const isDirty =
    form.username !== profile.username ||
    form.first_name !== (profile.first_name || '') ||
    form.last_name !== (profile.last_name || '') ||
    form.mahalla_name !== (profile.mahalla_name || '') ||
    form.district !== (profile.district || '') ||
    form.password.trim() !== '' ||
    form.is_active !== profile.is_active

  return (
    <tr className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950'}>
      {/* # */}
      <td className="px-3 py-2 text-center text-xs text-slate-400 font-mono">{idx + 1}</td>

      {/* Login */}
      <td className="px-2 py-1.5">
        <input
          type="text" value={form.username}
          onChange={e => set('username', e.target.value)}
          className="input-field w-full text-xs font-mono"
        />
      </td>

      {/* Parol */}
      <td className="px-2 py-1.5">
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={e => set('password', e.target.value)}
            placeholder="yangi parol..."
            className="input-field w-full text-xs pr-7"
          />
          <button type="button" onClick={() => setShowPw(p => !p)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </td>

      {/* Ism */}
      <td className="px-2 py-1.5">
        <input
          type="text" value={form.first_name}
          onChange={e => set('first_name', e.target.value)}
          placeholder="Ism"
          className="input-field w-full text-xs"
        />
      </td>

      {/* Familya */}
      <td className="px-2 py-1.5">
        <input
          type="text" value={form.last_name}
          onChange={e => set('last_name', e.target.value)}
          placeholder="Familya"
          className="input-field w-full text-xs"
        />
      </td>

      {/* Mahalla */}
      <td className="px-2 py-1.5">
        <input
          type="text" value={form.mahalla_name}
          onChange={e => set('mahalla_name', e.target.value)}
          className="input-field w-full text-xs"
        />
      </td>

      {/* Faol */}
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox" checked={form.is_active}
          onChange={e => set('is_active', e.target.checked)}
          className="w-4 h-4 accent-blue-600 cursor-pointer"
        />
      </td>

      {/* Saqlash */}
      <td className="px-2 py-1.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          {error && (
            <span className="text-xs text-red-500 max-w-24 truncate" title={error}>!</span>
          )}
          {saved && !isDirty && (
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          )}
          {isDirty && (
            <button
              onClick={save} disabled={saving}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap">
              {saving
                ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                : <Save className="w-3 h-3" />}
              Saqlash
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Superadmin User Management ───────────────────────────────────────────────
export function SAUserList() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.saGetUsers()
      .then(setProfiles)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = profiles.filter(p =>
    !search ||
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.mahalla_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Foydalanuvchilar
          <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">({profiles.length} ta)</span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="input-field w-44 text-sm"
          />
          <button
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Har bir qatorda to'g'ridan-to'g'ri tahrirlash mumkin. O'zgarish kiritilgach "Saqlash" tugmasi paydo bo'ladi.
        Parol maydonini bo'sh qoldiring — o'zgarmaydi.
      </p>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          {search ? 'Hech narsa topilmadi' : 'Foydalanuvchilar yo\'q'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-left">
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 w-8">#</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-28">Login</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-32">Yangi parol</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-24">Ism</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-28">Familya</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-36">Mahalla</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 w-12">Faol</th>
                <th className="px-2 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <UserRow key={p.id} profile={p} idx={i} onSaved={load} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Create User ─────────────────────────────────────────────────────────────
export function SACreateUser() {
  const [form, setForm]       = useState({ username: '', password: '', first_name: '', last_name: '', mahalla_name: '', district: '' })
  const [saving, setSaving]   = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true); setError(''); setSuccess('')
    try {
      await api.saCreateUser(form)
      setSuccess(`"${form.username}" akkaunt yaratildi!`)
      setForm({ username: '', password: '', first_name: '', last_name: '', mahalla_name: '', district: '' })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Yangi foydalanuvchi</h2>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        <FormField label="Login *" value={form.username} onChange={v => set('username', v)} placeholder="username" />
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Parol *</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="parol..." className="w-full pr-9 input-field" />
            <button type="button" onClick={() => setShowPw(p => !p)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <FormField label="Ism" value={form.first_name} onChange={v => set('first_name', v)} />
        <FormField label="Familya" value={form.last_name} onChange={v => set('last_name', v)} />
        <FormField label="Mahalla nomi *" value={form.mahalla_name} onChange={v => set('mahalla_name', v)} />
        <FormField label="Tuman" value={form.district} onChange={v => set('district', v)} />

        <div className="sm:col-span-2 flex items-center justify-end gap-3 flex-wrap pt-1">
          {error   && <span className="text-xs text-red-500 mr-auto">{error}</span>}
          {success && <span className="text-xs text-emerald-600 dark:text-emerald-400 mr-auto">{success}</span>}
          <button onClick={save} disabled={saving || !form.username || !form.password || !form.mahalla_name}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
            <Plus className="w-4 h-4" />
            {saving ? 'Yaratilmoqda...' : 'Yaratish'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Score Adjustment ─────────────────────────────────────────────────────────
export function SAScores({ directions }) {
  const curMonth = new Date().toISOString().slice(0, 7)
  const [month, setMonth]     = useState(curMonth)
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState({})
  const [edits, setEdits]     = useState({})
  const [msgs, setMsgs]       = useState({})

  const load = useCallback(() => {
    setLoading(true); setEdits({}); setMsgs({})
    api.saGetScores(month + '-01')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [month])

  useEffect(() => { load() }, [load])

  const setEdit = (profileId, dirKey, val) =>
    setEdits(e => ({ ...e, [`${profileId}:${dirKey}`]: val }))

  const getEdit = (profileId, dirKey, original) => {
    const k = `${profileId}:${dirKey}`
    return k in edits ? edits[k] : String(original)
  }

  const save = async (profileId, dirKey) => {
    const k = `${profileId}:${dirKey}`
    const score = parseFloat(edits[k])
    if (isNaN(score)) return
    setSaving(s => ({ ...s, [k]: true }))
    setMsgs(m => ({ ...m, [k]: '' }))
    try {
      await api.saSetScore({ profile_id: profileId, direction: dirKey, month: month + '-01', score })
      setMsgs(m => ({ ...m, [k]: 'ok' }))
      load()
    } catch (e) {
      setMsgs(m => ({ ...m, [k]: e.message }))
    } finally {
      setSaving(s => ({ ...s, [k]: false }))
    }
  }

  const activeDirections = data?.directions || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ball o'zgartirish</h2>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="input-field text-sm w-36" />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Faqat admin tomonidan baholanmaydigan yo'nalishlar uchun ball belgilash mumkin.
        <strong className="text-amber-500"> 1_ijro</strong> o'zgartirilmaydi.
      </p>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="sticky left-0 bg-slate-100 dark:bg-slate-800 text-left px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 min-w-36">
                  Mahalla
                </th>
                {activeDirections.map(d => (
                  <th key={d.key} className="text-center px-2 py-2.5 font-semibold text-slate-700 dark:text-slate-300 min-w-24 border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                    <span className="block truncate max-w-20 mx-auto text-xs" title={d.label}>{d.key}</span>
                    <span className="text-xs font-normal text-slate-400">/{d.max_score}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, ri) => (
                <tr key={row.profile_id} className={ri % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950'}>
                  <td className={`sticky left-0 px-3 py-2 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 text-xs ${
                    ri % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950'
                  }`}>
                    {row.mahalla_name}
                  </td>
                  {activeDirections.map(d => {
                    const scoreObj = row.scores.find(s => s.direction === d.key)
                    const origScore = scoreObj?.score ?? 0
                    const k = `${row.profile_id}:${d.key}`
                    const isLocked = d.key === '1_ijro'
                    const edited = k in edits && edits[k] !== String(origScore)
                    return (
                      <td key={d.key} className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                        {isLocked ? (
                          <span className="text-slate-400 text-xs">{origScore}</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number" min="0" max={d.max_score} step="0.01"
                              value={getEdit(row.profile_id, d.key, origScore)}
                              onChange={e => setEdit(row.profile_id, d.key, e.target.value)}
                              className={`w-16 text-center text-xs px-1 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-blue-500
                                ${edited ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-500'
                                         : 'border-slate-300 dark:border-slate-600 bg-transparent text-slate-700 dark:text-slate-200'}`}
                            />
                            {edited && (
                              <button onClick={() => save(row.profile_id, d.key)} disabled={saving[k]}
                                title="Saqlash"
                                className="w-5 h-5 flex items-center justify-center rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 flex-shrink-0">
                                {saving[k]
                                  ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                  : <Save className="w-3 h-3" />}
                              </button>
                            )}
                            {msgs[k] === 'ok' && <span className="text-emerald-500 text-xs">✓</span>}
                            {msgs[k] && msgs[k] !== 'ok' && <span className="text-red-500 text-xs" title={msgs[k]}>!</span>}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400">Ma'lumot yuklanmadi</div>
      )}
    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────
function FormField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ''}
        className="w-full input-field" />
    </div>
  )
}
