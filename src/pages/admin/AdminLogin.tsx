import { useState } from 'react'
import { motion } from 'motion/react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { adminApi } from '@/lib/api'

interface Props {
  onSuccess: () => void
}

export default function AdminLogin({ onSuccess }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      await adminApi.login(username, password)
      onSuccess()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Login failed')
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors text-sm font-body'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-sm space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center space-y-1">
          <h1 className="font-display text-5xl text-[var(--accent)]">PEAK</h1>
          <p className="text-sm opacity-50 tracking-widest uppercase">Admin</p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 p-6 rounded-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase mb-2 opacity-60" htmlFor="admin-user">
              Username
            </label>
            <input
              id="admin-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className={inputClass}
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase mb-2 opacity-60" htmlFor="admin-pass">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-pass"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={`${inputClass} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80 transition-opacity text-[var(--text)]"
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn-primary w-full justify-center"
          >
            {status === 'loading' ? (
              <span className="animate-spin w-4 h-4 border-2 border-cream border-t-transparent rounded-full" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
