import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Shield, User, Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { supabase } from '../helpers/supabase'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [isManagement, setIsManagement] = useState(false)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    code: '',
  })

  // Auto-clear messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleCodeVerify = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('management_codes')
      .select('*')
      .eq('code', formData.code)
      .eq('used', false)
      .single()
    
    setLoading(false)
    if (data) {
      setCodeVerified(true)
      setMessageType('success')
      setMessage('Code verified! Proceed to register.')
    } else {
      setMessageType('error')
      setMessage('Invalid or already used code')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error
        
        setMessageType('success')
        setMessage('Login successful!')
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
        
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })
        if (authError) throw authError

        await supabase.from('users').insert({
          id: authData.user?.id,
          email: formData.email,
          full_name: formData.fullName,
          role: isManagement ? 'admin' : 'fan',
        })

        if (isManagement && codeVerified) {
          await supabase.from('management_codes').update({ used: true }).eq('code', formData.code)
        }

        setMessageType('success')
        setMessage('Account created! Check email to verify.')
        
        // Switch to login after 2 seconds
        setTimeout(() => {
          setIsLogin(true)
          setMessage('')
        }, 2000)
      }
    } catch (error: any) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,0.15),transparent_50%)] animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(234,88,12,0.1),transparent_50%)]"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      {/* Logo Watermark */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.03 }}
        transition={{ duration: 1.5 }}
      >
        <img src="/images/logo.png" alt="" className="w-[800px] h-[800px] object-contain" />
      </motion.div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-red-500/20 rounded-full"
            style={{ 
              left: `${20 + i * 15}%`, 
              top: `${30 + (i % 3) * 20}%` 
            }}
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-[#161616]/90 backdrop-blur-2xl border border-red-900/30 rounded-3xl p-8 relative z-10 shadow-[0_0_80px_rgba(220,38,38,0.15)]"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 via-orange-600/20 to-red-600/20 rounded-3xl blur-xl opacity-50"></div>
        
        <div className="relative">
          {/* Logo */}
          <motion.div 
            className="text-center mb-8"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative inline-block">
              <img src="/images/logo.png" alt="Hot Blood FC" className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.5)]" />
              <motion.div 
                className="absolute inset-0 rounded-full border-2 border-red-500"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Join The Pack'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isLogin ? 'Sign in to your Hot Blood FC account' : 'Become part of the family'}
            </p>
          </motion.div>

          {/* Message Toast */}
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100 }}
                className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${messageType === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}
              >
                {messageType === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                <span className="text-sm font-medium">{message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Role Selection */}
          {!isLogin && (
            <motion.div 
              className="flex gap-3 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {[
                { id: 'fan', icon: User, label: 'Fan' },
                { id: 'management', icon: Shield, label: 'Management' }
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => { 
                    setIsManagement(role.id === 'management'); 
                    setShowCodeInput(role.id === 'management'); 
                    setCodeVerified(false);
                    setFormData({...formData, code: ''});
                  }}
                  className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${!isManagement && role.id === 'fan' || isManagement && role.id === 'management' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-600/30' : 'bg-[#0a0a0a] text-gray-400 border border-red-900/30 hover:border-red-500/50'}`}
                >
                  <role.icon size={18} /> {role.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Code Verification */}
          <AnimatePresence>
            {showCodeInput && !codeVerified && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-5 bg-gradient-to-br from-red-600/10 to-orange-600/10 border border-red-500/30 rounded-2xl"
              >
                <label className="block text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                  <Shield size={16} /> Enter 6-Digit Management Code
                </label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    maxLength={6} 
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value})} 
                    className="flex-1 bg-[#0a0a0a] border border-red-700/50 rounded-xl px-4 py-3 text-white text-center tracking-[0.5em] text-xl font-bold focus:border-red-500 focus:outline-none transition-colors" 
                    placeholder="••••••" 
                  />
                  <motion.button 
                    type="button" 
                    onClick={handleCodeVerify} 
                    disabled={loading || formData.code.length !== 6}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-xl text-white font-bold transition-all flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Code Verified Success */}
          <AnimatePresence>
            {codeVerified && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-400"
              >
                <CheckCircle size={20} />
                <span className="font-medium">Code verified! Complete registration below.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                  className="w-full bg-[#0a0a0a] border border-red-900/30 rounded-xl px-4 py-3.5 text-white focus:border-red-500 focus:outline-none transition-all focus:shadow-[0_0_20px_rgba(220,38,38,0.2)]" 
                  placeholder="John Doe" 
                  required={!isLogin} 
                />
              </motion.div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="w-full bg-[#0a0a0a] border border-red-900/30 rounded-xl px-4 py-3.5 text-white focus:border-red-500 focus:outline-none transition-all focus:shadow-[0_0_20px_rgba(220,38,38,0.2)]" 
                placeholder="sirchersalpha@gmail.com" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  className="w-full bg-[#0a0a0a] border border-red-900/30 rounded-xl px-4 py-3.5 text-white pr-12 focus:border-red-500 focus:outline-none transition-all focus:shadow-[0_0_20px_rgba(220,38,38,0.2)]" 
                  placeholder="••••••••" 
                  required 
                  minLength={6} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <motion.button 
              type="submit" 
              disabled={loading || (isManagement && !codeVerified && !isLogin)} 
              className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-white font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all mt-6"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : null}
              {isLogin ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={20} />}
            </motion.button>
          </form>

          <p className="text-center mt-8 text-gray-400 text-sm">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button 
              onClick={() => { 
                setIsLogin(!isLogin); 
                setIsManagement(false); 
                setShowCodeInput(false); 
                setCodeVerified(false); 
                setMessage('');
                setFormData({ email: '', password: '', fullName: '', code: '' });
              }} 
              className="ml-2 text-red-500 hover:text-red-400 font-bold transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}