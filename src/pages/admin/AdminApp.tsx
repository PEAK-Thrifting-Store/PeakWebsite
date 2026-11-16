import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom'
import { LogOut, Layers, Image, MessageSquare, Menu, X } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { useTheme } from '@/hooks/useTheme'
import ThemeToggle from '@/components/ThemeToggle'
import AdminLogin from './AdminLogin'
import AdminRails from './AdminRails'
import AdminPosts from './AdminPosts'
import AdminMessages from './AdminMessages'
import Background from '@/components/Background'
import FilmGrain from '@/components/FilmGrain'

// ── Auth context ──────────────────────────────────────────────────────────────

interface AuthCtx {
  authenticated: boolean
  loading: boolean
  refresh: () => void
}
const AuthContext = createContext<AuthCtx>({ authenticated: false, loading: true, refresh: () => {} })
export const useAuth = () => useContext(AuthContext)

// ── Toast context ─────────────────────────────────────────────────────────────

interface ToastCtx {
  toast: (msg: string, type?: 'success' | 'error') => void
}
const ToastContext = createContext<ToastCtx>({ toast: () => {} })
export const useToast = () => useContext(ToastContext)

interface ToastItem { id: number; msg: string; type: 'success' | 'error' }

// ── Admin app ─────────────────────────────────────────────────────────────────

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [toastId, setToastId] = useState(0)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await adminApi.me()
      setAuthenticated(res.authenticated)
    } catch {
      setAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const toast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = toastId + 1
    setToastId(id)
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [toastId])

  const logout = async () => {
    await adminApi.logout()
    setAuthenticated(false)
    navigate('/admin')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <span className="font-display text-4xl text-[var(--accent)] animate-pulse">PEAK</span>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ authenticated, loading, refresh }}>
      <ToastContext.Provider value={{ toast }}>
        <Background theme={theme} />
        <FilmGrain />

        {!authenticated ? (
          <AdminLogin onSuccess={() => { setAuthenticated(true) }} />
        ) : (
          <div className="min-h-screen flex" style={{ color: 'var(--text)' }}>
            {/* Sidebar */}
            <>
              {/* Mobile overlay */}
              {sidebarOpen && (
                <div
                  className="fixed inset-0 z-20 bg-black/60 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              <aside
                className={`fixed inset-y-0 left-0 z-30 w-56 flex flex-col transition-transform duration-300 md:translate-x-0 md:static md:flex ${
                  sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                style={{
                  background: 'var(--surface)',
                  borderRight: '1px solid var(--border)',
                }}
              >
                <div className="p-5 flex items-center justify-between">
                  <span className="font-display text-2xl text-[var(--accent)]">PEAK</span>
                  <button className="md:hidden text-[var(--text)]" onClick={() => setSidebarOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
                <nav className="flex-1 px-3 space-y-1" aria-label="Admin navigation">
                  {NAV.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `admin-sidebar-link ${isActive ? 'active' : ''}`
                      }
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.Icon size={16} />
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
                <div className="p-4 border-t border-[var(--border)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-50">Theme</span>
                    <ThemeToggle theme={theme} onToggle={toggleTheme} />
                  </div>
                  <button
                    onClick={logout}
                    className="admin-sidebar-link w-full text-sm"
                    style={{ color: 'var(--accent)' }}
                  >
                    <LogOut size={15} />
                    Log out
                  </button>
                </div>
              </aside>
            </>

            {/* Main */}
            <div className="flex-1 min-w-0 overflow-auto">
              {/* Top bar (mobile) */}
              <div
                className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 md:hidden"
                style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                  className="text-[var(--text)]"
                >
                  <Menu size={22} />
                </button>
                <span className="font-display text-xl text-[var(--accent)]">PEAK Admin</span>
              </div>

              <div className="p-6 max-w-5xl mx-auto">
                <Routes>
                  <Route index element={<Navigate to="rails" replace />} />
                  <Route path="rails" element={<AdminRails />} />
                  <Route path="posts" element={<AdminPosts />} />
                  <Route path="messages" element={<AdminMessages />} />
                </Routes>
              </div>
            </div>
          </div>
        )}

        {/* Toasts */}
        <div className="fixed bottom-5 right-5 z-[9999] space-y-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast pointer-events-auto ${t.type === 'error' ? 'toast-error' : 'toast-success'}`}
            >
              {t.msg}
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </AuthContext.Provider>
  )
}

const NAV = [
  { to: '/admin/rails', label: 'Rails', Icon: Layers },
  { to: '/admin/posts', label: 'Posts', Icon: Image },
  { to: '/admin/messages', label: 'Messages', Icon: MessageSquare },
]
