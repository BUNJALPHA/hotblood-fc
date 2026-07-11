import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './helpers/supabase'
import { ToastProvider } from './components/ui/Toast'
import Landing from './screens/Landing'
import Auth from './screens/Auth'

// Lazy load dashboards for faster initial page load
const PublicDashboard = lazy(() => import('./screens/PublicDashboard'))
const ManagementDashboard = lazy(() => import('./screens/ManagementDashboard'))
const LiveViewer = lazy(() => import('../public/live/LiveViewer'))

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-orange-400 font-semibold animate-pulse text-sm">Loading Hot Blood FC...</p>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>('fan')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) getUserRole(session.user.id)
    })
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) await getUserRole(user.id)
    setLoading(false)
  }

  const getUserRole = async (userId: string) => {
    // Try profiles first (correct table), fall back to users
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role) {
      setRole(profile.role)
    } else {
      const { data: legacy } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()
      if (legacy?.role) setRole(legacy.role)
    }
  }

  if (loading) return <PageLoader />

  const isAdmin = role === 'admin' || role === 'super_admin'

  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/live/:streamKey" element={<LiveViewer />} />
            <Route
              path="/dashboard"
              element={
                user ? (
                  isAdmin ? <ManagementDashboard /> : <PublicDashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
