import { useState, useEffect } from 'react'
import { AdminPanel } from './components/AdminPanel'
import { UserDashboard } from './components/UserDashboard'
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
      .then(u => {
        setUser(u)
        return api.getDirections()
      })
      .then(setDirections)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  const handleLogout = async () => {
    try { await api.logout() } catch (_) {}
    setUser(null)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={u => {
      setUser(u)
      api.getDirections().then(setDirections).catch(() => {})
    }} darkMode={darkMode} toggleDark={toggleDark} />
  }

  if (user.is_staff || user.is_superuser) {
    return <AdminPanel user={user} directions={directions} onLogout={handleLogout} darkMode={darkMode} toggleDark={toggleDark} />
  }

  return <UserDashboard user={user} directions={directions} onLogout={handleLogout} darkMode={darkMode} toggleDark={toggleDark}
    onUserUpdate={() => api.me().then(setUser).catch(() => {})} />
}
