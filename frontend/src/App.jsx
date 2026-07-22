import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminPanel } from './components/AdminPanel'
import { UserDashboard } from './components/UserDashboard'
import { HokimDashboard } from './components/HokimDashboard'
import { LoginPage } from './components/LoginPage'
import { api } from './services/api'

export default function App() {
  const [user, setUser] = useState(null)
  const [directions, setDirections] = useState([])
  const [authLoading, setAuthLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark-page')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark-page')
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const toggleDark = () => setDarkMode(prev => !prev)

  useEffect(() => {
    api.me()
      .then(u => { setUser(u); return api.getDirections() })
      .then(setDirections)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    const handleExpired = () => setUser(null)
    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
  }, [])

  const handleLogout = async () => {
    try { await api.logout() } catch (_) {}
    setUser(null)
  }

  const handleLogin = (u) => {
    setUser(u)
    api.getDirections().then(setDirections).catch(() => {})
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const adminProps = { user, directions, onLogout: handleLogout, darkMode, toggleDark }
  const userProps  = { user, directions, onLogout: handleLogout, darkMode, toggleDark,
                       onUserUpdate: () => api.me().then(setUser).catch(() => {}) }

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} darkMode={darkMode} toggleDark={toggleDark} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (user.is_staff || user.is_superuser) ? (
          <>
            <Route path="/admin/*" element={<AdminPanel {...adminProps} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        ) : user.is_hokim ? (
          <>
            <Route path="/hokim" element={<HokimDashboard {...adminProps} />} />
            <Route path="*" element={<Navigate to="/hokim" replace />} />
          </>
        ) : (
          <>
            <Route path="/user" element={<UserDashboard {...userProps} />} />
            <Route path="*" element={<Navigate to="/user" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}
