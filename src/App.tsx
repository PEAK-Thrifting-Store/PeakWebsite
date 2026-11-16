import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { useCloset } from '@/hooks/useCloset'
import Navbar from '@/components/Navbar'
import Background from '@/components/Background'
import FilmGrain from '@/components/FilmGrain'
import ClosetExperience from '@/components/ClosetExperience'
import Home from '@/pages/Home'

const AdminApp = lazy(() => import('@/pages/admin/AdminApp'))

function PublicLayout() {
  const { theme, toggleTheme } = useTheme()
  const { state, open, close } = useCloset()

  return (
    <>
      <Background theme={theme} />
      <FilmGrain />
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <ClosetExperience state={state} onClose={close} />
      <Home closetState={state} onExplore={open} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLayout />} />
        <Route
          path="/admin/*"
          element={
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
                  <span className="font-display text-3xl text-[var(--accent)] animate-pulse">
                    PEAK
                  </span>
                </div>
              }
            >
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
