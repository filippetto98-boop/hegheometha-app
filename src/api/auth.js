import api from './client'

export async function login(username, password) {
  const res = await api.post('/api/token/', { username, password })
  localStorage.setItem('access_token', res.data.access)
  localStorage.setItem('refresh_token', res.data.refresh)
  const user = await getMe()
  return user
}

export function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export async function getMe() {
  const res = await api.get('/api/me/')
  localStorage.setItem('user', JSON.stringify(res.data))
  return res.data
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

export function isLoggedIn() {
  return !!localStorage.getItem('access_token')
}
