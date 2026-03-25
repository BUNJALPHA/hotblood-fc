import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './helpers/supabase'
import Landing from './screens/Landing'
import Auth from './screens/Auth'
import PublicDashboard from './screens/PublicDashboard'
import ManagementDashboard from './screens/ManagementDashboard'
// Add this import at the top of App.tsx
import LiveViewer from '../public/live/LiveViewer'

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
    const { data } = await supabase.from('users').select('role').eq('id', userId).single()
    if (data) setRole(data.role)
  }

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>

  return (
    <BrowserRouter>
      <Routes>
        {/* Default Landing Page - Always shows first */}
        <Route path="/" element={<Landing />} />
        
        {/* Auth Route */}
        <Route path="/login" element={<Auth />} />
        <Route path="/live/:streamKey" element={<LiveViewer />} />
        
        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={user ? (
            role === 'admin' ? <ManagementDashboard /> : <PublicDashboard />
          ) : (
            <Navigate to="/login" replace />
          )} 
        />
        
        {/* Redirect unknown routes to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App