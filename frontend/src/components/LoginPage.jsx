import { useState } from 'react'
import { api } from '../services/api'

export function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.getCsrf()
      const user = await api.login(username, password)
      onLogin(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md">

        {/* Header */}
        <div className="px-10 pt-10 pb-8 text-center border-b border-slate-100">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white text-2xl font-black shadow-lg">
            Y
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Yoshlar KPI</h1>
          <p className="text-slate-500 text-sm mt-2">Asaka tumani — MFY yoshlar yetakchilari</p>
        </div>

        {/* Form */}
        <div className="px-10 py-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Foydalanuvchi nomi
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                placeholder="username"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Parol
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 placeholder-slate-400"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700 leading-relaxed">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? 'Kirilmoqda...' : 'Tizimga kirish'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-10 pb-8 text-center">
          <p className="text-xs text-slate-400">
            Muammo bo'lsa administratorga murojaat qiling
          </p>
        </div>

      </div>
    </div>
  )
}
