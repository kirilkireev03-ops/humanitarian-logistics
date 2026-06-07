import axios from 'axios'
import { clearAuth, getToken, setAuth } from './auth'

function detectApiBaseUrl() {
  const env = import.meta.env.VITE_API_URL
  if (env && String(env).trim()) return String(env).trim()

  // Vite dev: same-origin requests → /api proxied to Spring Boot (vite.config.js).
  if (import.meta.env.DEV) return ''

  // Production / preview on a non-backend port: talk to API on 8080 (Spring default).
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '127.0.0.1'
    const port = window.location.port
    if (port && port !== '8080') return `http://${host}:8080`
  }
  return ''
}

const api = axios.create({
  baseURL: detectApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status
    if (status === 401 || status === 403) {
      // Spring Security returns 403 for unauthenticated requests too (no anonymous access enabled).
      // Treat missing/invalid session as "need login" by clearing local auth state.
      clearAuth()
      window.dispatchEvent(new CustomEvent('hl:auth-error', { detail: { status } }))
    }
    return Promise.reject(error)
  }
)

export async function login(username, password) {
  const { data } = await api.post('/api/auth/login', { username, password })
  setAuth({ accessToken: data.accessToken, role: data.role })
  return data
}

export function logout() {
  clearAuth()
}

export async function getStats() {
  const { data } = await api.get('/api/dashboard/stats')
  return data
}

export async function getAudit() {
  const { data } = await api.get('/api/audit')
  return data
}

export async function listWarehouses() {
  const { data } = await api.get('/api/warehouses')
  return data
}

export async function getWarehouse(id) {
  const { data } = await api.get(`/api/warehouses/${id}`)
  return data
}

export async function createWarehouse(body) {
  const { data } = await api.post('/api/warehouses', body)
  return data
}

export async function updateWarehouse(id, body) {
  const { data } = await api.put(`/api/warehouses/${id}`, body)
  return data
}

export async function deleteWarehouse(id) {
  await api.delete(`/api/warehouses/${id}`)
}

export async function listCargo() {
  const { data } = await api.get('/api/cargo')
  return data
}

export async function getCargo(id) {
  const { data } = await api.get(`/api/cargo/${id}`)
  return data
}

export async function createCargo(body) {
  const { data } = await api.post('/api/cargo', body)
  return data
}

export async function updateCargo(id, body) {
  const { data } = await api.put(`/api/cargo/${id}`, body)
  return data
}

export async function deleteCargo(id) {
  await api.delete(`/api/cargo/${id}`)
}

export async function listAidRequests() {
  const { data } = await api.get('/api/aid-requests')
  return data
}

export async function createAidRequest(body) {
  const { data } = await api.post('/api/aid-requests', body)
  return data
}

export async function updateAidRequest(id, body) {
  const { data } = await api.put(`/api/aid-requests/${id}`, body)
  return data
}

export async function fulfillAidRequest(id) {
  const { data } = await api.post(`/api/aid-requests/${id}/fulfill`)
  return data
}

export async function approveAidRequest(id) {
  const { data } = await api.post(`/api/aid-requests/${id}/approve`)
  return data
}

export async function rejectAidRequest(id, reason) {
  const { data } = await api.post(`/api/aid-requests/${id}/reject`, { reason: reason || null })
  return data
}

export async function deleteAidRequest(id) {
  await api.delete(`/api/aid-requests/${id}`)
}

export async function listTransactions() {
  const { data } = await api.get('/api/transactions')
  return data
}

export async function createTransaction(body) {
  const { data } = await api.post('/api/transactions', {
    ...body,
    occurredAt: body.occurredAt ?? null,
    relatedRequestId: body.relatedRequestId ?? null
  })
  return data
}

export async function deleteTransaction(id) {
  await api.delete(`/api/transactions/${id}`)
}

export async function listStock() {
  const { data } = await api.get('/api/stock')
  return data
}

export async function getForecast({ cargoId, model, alpha, beta, horizon, historyMonths }) {
  const { data } = await api.get('/api/forecast', {
    params: {
      cargoId,
      model,
      alpha: alpha ?? undefined,
      beta: beta ?? undefined,
      horizon,
      historyMonths
    }
  })
  return data
}

export async function listUsers() {
  const { data } = await api.get('/api/users')
  return data
}

export async function createUser(body) {
  const { data } = await api.post('/api/users', body)
  return data
}

export async function updateUser(id, body) {
  const { data } = await api.put(`/api/users/${id}`, body)
  return data
}

export async function deleteUser(id) {
  await api.delete(`/api/users/${id}`)
}
