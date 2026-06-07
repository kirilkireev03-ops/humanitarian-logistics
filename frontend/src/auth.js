const TOKEN_KEY = 'hl_access_token'
const ROLE_KEY = 'hl_role'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuth({ accessToken, role }) {
  localStorage.setItem(TOKEN_KEY, accessToken)
  if (role) localStorage.setItem(ROLE_KEY, role)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY)
}

export function isAuthed() {
  return Boolean(getToken())
}

