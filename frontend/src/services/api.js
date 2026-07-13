const API_BASE = '/api'

const getCsrfToken = () => {
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match ? match[1] : ''
}

const request = async (url, options = {}) => {
  const isWrite = options.method && options.method !== 'GET'
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(isWrite ? { 'X-CSRFToken': getCsrfToken() } : {}),
    },
    credentials: 'include',
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Auth
  getCsrf: () => request('/auth/csrf/'),
  login: (username, password) =>
    request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () =>
    request('/auth/logout/', { method: 'POST', body: JSON.stringify({}) }),
  me: () => request('/auth/me/'),

  // Dashboard
  getDashboardStats: (month) => {
    const params = month ? `?month=${month}` : ''
    return request(`/admin/dashboard/${params}`)
  },
  getSliderTasks: (direction, month) => {
    const params = month ? `?month=${month}` : ''
    return request(`/admin/slider/${direction}/${params}`)
  },
  reviewTask: (taskId, action, score, adminComment) =>
    request(`/admin/review/${taskId}/`, {
      method: 'POST',
      body: JSON.stringify({ action, score, admin_comment: adminComment }),
    }),
}
