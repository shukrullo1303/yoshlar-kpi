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
    // Session muddati o'tgan — App.jsx ni xabardor qil, login sahifasiga o'tsin
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Directions
  getDirections: () => request('/directions/'),

  // Auth
  getCsrf: () => request('/auth/csrf/'),
  login: (username, password) =>
    request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () =>
    request('/auth/logout/', { method: 'POST', body: JSON.stringify({}) }),
  me: () => request('/auth/me/'),

  // Dashboard
  getDashboardStats: (monthFrom, monthTo) => {
    const params = new URLSearchParams()
    if (monthFrom) params.set('month_from', monthFrom)
    if (monthTo) params.set('month_to', monthTo)
    const qs = params.toString()
    return request(`/admin/dashboard/${qs ? `?${qs}` : ''}`)
  },
  getSliderTasks: (direction, month, taskStatus = 'sariq') => {
    const params = new URLSearchParams()
    if (month) params.set('month', month)
    if (taskStatus) params.set('status', taskStatus)
    const qs = params.toString()
    return request(`/admin/slider/${direction}/${qs ? `?${qs}` : ''}`)
  },
  reviewTask: (taskId, action, score, adminComment) =>
    request(`/admin/review/${taskId}/`, {
      method: 'POST',
      body: JSON.stringify({ action, score, admin_comment: adminComment }),
    }),
  submitTask: (formData) =>
    fetch(`${API_BASE}/user/submit/`, {
      method: 'POST',
      headers: { 'X-CSRFToken': getCsrfToken() },
      credentials: 'include',
      body: formData,
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error || err.detail || `HTTP ${res.status}`)
      }
      return res.json()
    }),
  getUserDashboard: (month) => {
    const params = month ? `?month=${month}` : ''
    return request(`/user/dashboard/${params}`)
  },
  getDistrictsRanking: (monthFrom, monthTo) => {
    const params = new URLSearchParams()
    if (monthFrom) params.set('month_from', monthFrom)
    if (monthTo) params.set('month_to', monthTo)
    const qs = params.toString()
    return request(`/admin/districts/${qs ? `?${qs}` : ''}`)
  },
  getBulkScores: (direction, date) =>
    request(`/admin/bulk-score/?direction=${direction}&date=${date}`),
  saveBulkScores: (direction, date, scores) =>
    request('/admin/bulk-score/', {
      method: 'POST',
      body: JSON.stringify({ direction, date, scores }),
    }),
  getMonthPlan: (direction, month) =>
    request(`/admin/month-plan/?direction=${direction}&month=${month}`),
  saveMonthPlan: (direction, month, target_count, plan_dates) =>
    request('/admin/month-plan/', {
      method: 'POST',
      body: JSON.stringify({ direction, month, target_count, plan_dates }),
    }),
  bulkReviewTasks: (task_ids, action, score, adminComment) =>
    request('/admin/bulk-review/', {
      method: 'POST',
      body: JSON.stringify({ task_ids, action, score, admin_comment: adminComment }),
    }),
  getMFYStatus: (direction, monthFrom, monthTo) => {
    const params = new URLSearchParams({ direction })
    if (monthFrom) params.set('month_from', monthFrom)
    if (monthTo) params.set('month_to', monthTo)
    return request(`/admin/mfy-status/?${params.toString()}`)
  },
  updateProfile: (first_name, last_name, old_password, new_password) =>
    request('/user/profile/', {
      method: 'POST',
      body: JSON.stringify({ first_name, last_name, old_password, new_password }),
    }),
  getRejectedTasks: (direction, month) => {
    const params = new URLSearchParams()
    if (direction) params.set('direction', direction)
    if (month) params.set('month', month)
    const qs = params.toString()
    return request(`/user/rejected-tasks/${qs ? `?${qs}` : ''}`)
  },

  // Superadmin — users
  saGetUsers: () => request('/superadmin/users/'),
  saCreateUser: (data) => request('/superadmin/users/', { method: 'POST', body: JSON.stringify(data) }),
  saUpdateUser: (pk, data) => request(`/superadmin/users/${pk}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  // Superadmin — scores
  saGetScores: (month) => request(`/superadmin/scores/${month ? `?month=${month}` : ''}`),
  saSetScore: (data) => request('/superadmin/scores/', { method: 'POST', body: JSON.stringify(data) }),
  // Superadmin — directions
  saGetDirections: () => request('/superadmin/directions/'),
  saCreateDirection: (data) => request('/superadmin/directions/', { method: 'POST', body: JSON.stringify(data) }),
  saUpdateDirection: (pk, data) => request(`/superadmin/directions/${pk}/`, { method: 'PATCH', body: JSON.stringify(data) }),
}
