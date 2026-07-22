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
    is_hokim:     profile.is_hokim || false,
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
    form.is_active !== profile.is_active ||
    form.is_hokim !== (profile.is_hokim || false)

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

      {/* Hokim */}
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox" checked={form.is_hokim}
          onChange={e => set('is_hokim', e.target.checked)}
          className="w-4 h-4 accent-purple-600 cursor-pointer"
        />
      </td>

      {/* Saqlash — sticky right, always visible */}
      <td className={`sticky right-0 px-2 py-1.5 text-center border-l border-slate-200 dark:border-slate-700 ${
        idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950'
      }`}>
        <div className="flex items-center justify-center gap-1.5">
          {error && (
            <span className="text-xs text-red-500" title={error}>!</span>
          )}
          {saved && !isDirty && (
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          )}
          <button
            onClick={save} disabled={saving || !isDirty}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              isDirty
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-default'
            }`}>
            {saving
              ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              : <Save className="w-3 h-3" />}
            Saqlash
          </button>
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
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 w-14">Hokim</th>
                <th className="sticky right-0 bg-slate-100 dark:bg-slate-800 px-2 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 w-24 border-l border-slate-200 dark:border-slate-700"></th>
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
  const [form, setForm]       = useState({ username: '', password: '', first_name: '', last_name: '', mahalla_name: '', district: '', is_hokim: false })
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
      setForm({ username: '', password: '', first_name: '', last_name: '', mahalla_name: '', district: '', is_hokim: false })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const isDisabled = saving || !form.username || !form.password || (!form.is_hokim && !form.mahalla_name)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Yangi foydalanuvchi</h2>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">

        {/* Role selector */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Rol *</label>
          <div className="flex gap-2">
            <button type="button"
              onClick={() => set('is_hokim', false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${!form.is_hokim ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              MFY yetakchisi
            </button>
            <button type="button"
              onClick={() => set('is_hokim', true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.is_hokim ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              Hokim
            </button>
          </div>
        </div>

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
        {!form.is_hokim && (
          <FormField label="Mahalla nomi *" value={form.mahalla_name} onChange={v => set('mahalla_name', v)} />
        )}
        <FormField label="Tuman" value={form.district} onChange={v => set('district', v)} placeholder="Asaka" />

        <div className="sm:col-span-2 flex items-center justify-end gap-3 flex-wrap pt-1">
          {error   && <span className="text-xs text-red-500 mr-auto">{error}</span>}
          {success && <span className="text-xs text-emerald-600 dark:text-emerald-400 mr-auto">{success}</span>}
          <button onClick={save} disabled={isDisabled}
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
        Barcha yo'nalishlar bo'yicha oylik ball belgilash mumkin.
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
                    const edited = k in edits && edits[k] !== String(origScore)
                    return (
                      <td key={d.key} className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0">
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

// ─── Direction row (inline edit) ─────────────────────────────────────────────
function DirRow({ dir, idx, onSaved }) {
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({
    label:          dir.label,
    max_score:      String(dir.max_score),
    order:          String(dir.order),
    admin_scored:   dir.admin_scored,
    is_uploadable:  dir.is_uploadable,
    is_active:      dir.is_active,
    default_target: String(dir.default_target),
  })

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); setError('') }

  const isDirty =
    form.label          !== dir.label ||
    form.max_score      !== String(dir.max_score) ||
    form.order          !== String(dir.order) ||
    form.admin_scored   !== dir.admin_scored ||
    form.is_uploadable  !== dir.is_uploadable ||
    form.is_active      !== dir.is_active ||
    form.default_target !== String(dir.default_target)

  const save = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      await api.saUpdateDirection(dir.id, {
        label:          form.label.trim(),
        max_score:      parseInt(form.max_score),
        order:          parseInt(form.order),
        admin_scored:   form.admin_scored,
        is_uploadable:  form.is_uploadable,
        is_active:      form.is_active,
        default_target: parseInt(form.default_target) || 0,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950'}>
      <td className="px-2 py-1.5 text-center text-xs text-slate-400 font-mono w-8">{dir.order}</td>
      <td className="px-2 py-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 w-24">{dir.key}</td>
      <td className="px-2 py-1.5 min-w-48">
        <input type="text" value={form.label} onChange={e => set('label', e.target.value)}
          className="input-field w-full text-xs" />
      </td>
      <td className="px-2 py-1.5 w-20">
        <input type="number" min="1" value={form.max_score} onChange={e => set('max_score', e.target.value)}
          className="input-field w-full text-xs text-center" />
      </td>
      <td className="px-2 py-1.5 w-16">
        <input type="number" min="0" value={form.order} onChange={e => set('order', e.target.value)}
          className="input-field w-full text-xs text-center" />
      </td>
      <td className="px-2 py-1.5 w-16">
        <input type="number" min="0" value={form.default_target} onChange={e => set('default_target', e.target.value)}
          className="input-field w-full text-xs text-center" />
      </td>
      <td className="px-2 py-1.5 text-center w-10">
        <input type="checkbox" checked={form.admin_scored} onChange={e => set('admin_scored', e.target.checked)}
          className="w-4 h-4 accent-blue-600 cursor-pointer" />
      </td>
      <td className="px-2 py-1.5 text-center w-10">
        <input type="checkbox" checked={form.is_uploadable} onChange={e => set('is_uploadable', e.target.checked)}
          className="w-4 h-4 accent-blue-600 cursor-pointer" />
      </td>
      <td className="px-2 py-1.5 text-center w-10">
        <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
          className="w-4 h-4 accent-emerald-500 cursor-pointer" />
      </td>
      <td className={`sticky right-0 px-2 py-1.5 text-center border-l border-slate-200 dark:border-slate-700 ${
        idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950'
      }`}>
        <div className="flex items-center justify-center gap-1.5">
          {error && <span className="text-xs text-red-500" title={error}>!</span>}
          {saved && !isDirty && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
          <button onClick={save} disabled={saving || !isDirty}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              isDirty ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-default'
            }`}>
            {saving ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Save className="w-3 h-3" />}
            Saqlash
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Direction Management ─────────────────────────────────────────────────────
export function SADirections() {
  const [dirs, setDirs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating]     = useState(false)
  const [createErr, setCreateErr]   = useState('')
  const [createOk, setCreateOk]     = useState('')
  const BLANK = { key: '', label: '', max_score: '10', order: '0', admin_scored: false, is_uploadable: true, is_active: true, default_target: '0' }
  const [form, setForm] = useState(BLANK)
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = useCallback(() => {
    setLoading(true)
    api.saGetDirections().then(setDirs).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    setCreating(true); setCreateErr(''); setCreateOk('')
    try {
      await api.saCreateDirection({
        ...form,
        max_score:      parseInt(form.max_score),
        order:          parseInt(form.order),
        default_target: parseInt(form.default_target) || 0,
      })
      setCreateOk(`"${form.key}" yo'nalish qo'shildi!`)
      setForm(BLANK)
      setShowCreate(false)
      load()
    } catch (e) {
      setCreateErr(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Yo'nalishlar
          <span className="ml-2 text-sm font-normal text-slate-500">({dirs.length} ta)</span>
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowCreate(s => !s); setCreateErr(''); setCreateOk('') }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Yangi yo'nalish
          </button>
          <button onClick={load}
            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormField label="Key * (masalan: 11_yangi)" value={form.key} onChange={v => setF('key', v)} placeholder="11_yangi" />
          <FormField label="Nomi *" value={form.label} onChange={v => setF('label', v)} placeholder="Yo'nalish nomi" />
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max ball *</label>
            <input type="number" min="1" value={form.max_score} onChange={e => setF('max_score', e.target.value)} className="w-full input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tartib raqami</label>
            <input type="number" min="0" value={form.order} onChange={e => setF('order', e.target.value)} className="w-full input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Default reja soni (0 = yo'q)</label>
            <input type="number" min="0" value={form.default_target} onChange={e => setF('default_target', e.target.value)} className="w-full input-field" />
          </div>
          <div className="flex flex-col gap-2 justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={form.admin_scored} onChange={e => setF('admin_scored', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Admin baholaydi
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={form.is_uploadable} onChange={e => setF('is_uploadable', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Fayl yuklash mumkin
            </label>
          </div>
          <div className="sm:col-span-3 flex items-center justify-end gap-3 flex-wrap pt-1 border-t border-slate-200 dark:border-slate-700">
            {createErr && <span className="text-xs text-red-500 mr-auto">{createErr}</span>}
            {createOk  && <span className="text-xs text-emerald-600 dark:text-emerald-400 mr-auto">{createOk}</span>}
            <button onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white">
              Bekor
            </button>
            <button onClick={create} disabled={creating || !form.key || !form.label || !form.max_score}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
              {creating ? <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
              Qo'shish
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-left">
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-500 w-8">Tartib</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 w-24">Key</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-48">Nomi</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 w-20 text-center">Max ball</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 w-16 text-center">Order</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 w-16 text-center">Reja def.</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 w-10 text-center" title="Admin baholaydi">Admin</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 w-10 text-center" title="Fayl yuklash mumkin">Fayl</th>
                <th className="px-2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 w-10 text-center">Faol</th>
                <th className="sticky right-0 bg-slate-100 dark:bg-slate-800 px-2 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 w-24 border-l border-slate-200 dark:border-slate-700"></th>
              </tr>
            </thead>
            <tbody>
              {dirs.map((d, i) => (
                <DirRow key={d.id} dir={d} idx={i} onSaved={load} />
              ))}
            </tbody>
          </table>
        </div>
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

// ─── Media Manager ────────────────────────────────────────────────────────────
export function SAMediaManager() {
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [confirm, setConfirm]         = useState(false)
  const [result, setResult]           = useState(null)
  const [error, setError]             = useState(null)

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const res = await fetch('/api/superadmin/media-export/', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      const today = new Date().toISOString().slice(0, 10)
      a.download = `media-export-${today}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message)
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      const data = await api.saDeleteMedia()
      setResult(data)
      setConfirm(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Media fayllar boshqaruvi</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Barcha yuklangan fayllarni ZIP + Excel metadata bilan yuklab oling yoki o'chiring.
        </p>
      </div>

      {/* Download */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Yuklab olish (ZIP)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Barcha media fayllar + <strong>metadata.xlsx</strong> (MFY nomi, ism, yo'nalish, ball, holat, sana)
            </p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {downloading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Yuklanmoqda...</>
            : <><Download className="w-4 h-4" /> ZIP yuklab olish</>}
        </button>
      </div>

      {/* Delete */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/40 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-red-700 dark:text-red-400">Hammasini o'chirish</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Barcha yuklangan fayllar diskdan va bazadan o'chiriladi. <strong className="text-red-600">Bu amal qaytarib bo'lmaydi!</strong>
            </p>
          </div>
        </div>
        {result && (
          <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ {result.deleted_records} ta yozuv, {result.deleted_files} ta fayl o'chirildi
          </div>
        )}
        <button
          onClick={() => { setConfirm(true); setResult(null) }}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Barcha fayllarni o'chirish
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Ishonchingiz komilmi?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Barcha media fayllar butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {deleting
                  ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />O'chirilmoqda...</span>
                  : "Ha, o'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
