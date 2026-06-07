import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuth } from '../auth'

export default function AuthGate() {
  const nav = useNavigate()

  useEffect(() => {
    const onAuthError = (e) => {
      const status = e?.detail?.status
      if (status === 401 || status === 403) {
        clearAuth()
        nav('/login')
      }
    }
    window.addEventListener('hl:auth-error', onAuthError)
    return () => window.removeEventListener('hl:auth-error', onAuthError)
  }, [])

  return null
}

