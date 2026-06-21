import { useState, useEffect } from 'react'

const HOUSEHOLD_TOKEN = import.meta.env.VITE_HOUSEHOLD_TOKEN
const STORAGE_KEY = 'ffm_auth'

/**
 * Dead-simple shared-secret auth.
 * The token lives in the URL on first visit (?token=UUID),
 * then gets saved to localStorage so they don't need it again.
 *
 * Share link format: https://your-app.vercel.app/?token=YOUR-UUID
 */
export function useAuth() {
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    // Check URL param first (shareable link)
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')

    if (urlToken && urlToken === HOUSEHOLD_TOKEN) {
      localStorage.setItem(STORAGE_KEY, urlToken)
      // Clean the token from the URL bar (cosmetic)
      window.history.replaceState({}, '', window.location.pathname)
      setAuthed(true)
      return
    }

    // Fall back to localStorage (returning user on same device)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === HOUSEHOLD_TOKEN) {
      setAuthed(true)
    }
  }, [])

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setAuthed(false)
  }

  return { authed, logout }
}
