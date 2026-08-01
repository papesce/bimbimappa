import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, LogIn, Loader } from 'lucide-react'

export interface AccessDeniedProps {
  onLogin: (token: string) => boolean
}

export default function AccessDenied({ onLogin }: AccessDeniedProps) {
  const [token, setToken] = useState('')
  const [error, setError] = useState(false)
  const [trying, setTrying] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = token.trim()
    if (!trimmed) return

    setTrying(true)
    // Small delay so the spinner renders before the synchronous validation
    setTimeout(() => {
      const ok = onLogin(trimmed)
      if (!ok) {
        setError(true)
        setTrying(false)
      }
    }, 120)
  }

  return (
    <div className="access-denied">
      <div className="access-denied-box">
        <h1>Family Fun Map</h1>
        <p>Paste your access token below to unlock the map.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <KeyRound
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888899', pointerEvents: 'none' }}
            />
            <input
              className="input"
              type="text"
              placeholder="Paste token here…"
              value={token}
              onChange={e => { setToken(e.target.value); setError(false) }}
              autoComplete="off"
              spellCheck={false}
              style={{ paddingLeft: '34px', borderColor: error ? '#e05555' : undefined }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: '#e05555', margin: 0 }}>
              Invalid token. Ask whoever set up the map to share the access link.
            </p>
          )}

          <button className="btn-primary" type="submit" disabled={!token.trim() || trying}>
            {trying
              ? <><Loader size={14} className="spin" /> Checking…</>
              : <><LogIn size={14} /> Access map</>}
          </button>
        </form>
      </div>
    </div>
  )
}
