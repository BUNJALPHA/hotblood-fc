// ManagementDashboard.tsx - 4K PREMIUM VERSION
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, DollarSign, Calendar, TrendingUp, Shield, LogOut, Plus, Trash2, 
  RefreshCw, Sparkles, Activity, PieChart, Download, Bell, Search,
  Filter, MoreHorizontal, ChevronRight, Trophy, ShoppingBag, 
  FileText, BarChart3, Settings, UserPlus, Ticket, Store,
  Upload, X, Check, AlertCircle, Camera, MapPin, Clock,
  Star, Edit3, Eye, EyeOff, ChevronDown, QrCode, Newspaper,
  Award, Target, Heart, Share2, Printer, Grid3X3, List,
  TrendingDown, Wallet, Receipt, Package, UserCircle, Radio, Film
} from 'lucide-react'
import { supabase } from '../helpers/supabase'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line,
  ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { format, addDays, isPast, isFuture, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import Broadcaster from '../../public/live/Broadcaster'
import VideoUploader from '../components/dashboard/VideoUploader'
import MatchesManager from '../components/dashboard/MatchesManager'

// --- Types ---
interface Player {
  id: string
  full_name: string
  photo_url: string | null
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  jersey_number: number
  category: 'senior' | 'junior'
  date_of_birth: string | null
  join_date: string
  strengths: string[]
  weaknesses: string[]
  fitness_status: 'fit' | 'injured' | 'suspended' | 'recovering'
  injury_notes: string | null
  is_active: boolean
  goals: number
  assists: number
  attendance_rate: number
  created_at: string
}

interface Match {
  id: string
  opponent: string
  match_date: string
  venue: string
  is_home: boolean
  competition: string
  status: 'upcoming' | 'live' | 'completed' | 'cancelled'
  our_score: number | null
  opponent_score: number | null
  summary: string | null
  summary_visible_until: string | null
  first_11: string[]
  substitutes: string[]
  created_at: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock_quantity: number
  category: string
  images: string[]
  is_active: boolean
  offer_percentage: number
  created_at: string
}

interface NewsItem {
  id: string
  title: string
  content: string
  image_url: string | null
  poster_url: string | null
  is_pinned: boolean
  published_by: string
  created_at: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  payment_method: string
  created_at: string
}

// --- Components ---

const GlassCard = ({ children, className = '', hover = true }: any) => (
  <motion.div 
    whileHover={hover ? { y: -4, boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.15)' } : {}}
    className={`bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
)

const GradientText = ({ children, className = '' }: any) => (
  <span className={`bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
)

const StatPill = ({ icon: Icon, label, value, trend, color = 'orange' }: any) => {
  const colors: any = {
    orange: 'from-orange-500 to-red-600',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-pink-500',
    yellow: 'from-yellow-500 to-orange-500'
  }
  
  return (
    <GlassCard className="p-6 relative group">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${colors[color]} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${trend >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 && 'rotate-180'}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl font-black text-white tracking-tight">{value}</p>
      </div>
    </GlassCard>
  )
}

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: any) => {
  if (!isOpen) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }
  
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl w-full ${sizes[size as keyof typeof sizes]} max-h-[90vh] overflow-auto`}
        >
          <div className="flex justify-between items-center p-6 border-b border-slate-800/50">
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// --- Main Dashboard ---

export default function ManagementDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<any[]>([])
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Modal states
  const [modals, setModals] = useState({
    player: false,
    match: false,
    product: false,
    news: false,
    playerDetails: null as Player | null
  })
  
  // Form states
  const [playerForm, setPlayerForm] = useState({
    full_name: '',
    position: 'FWD' as const,
    jersey_number: '',
    category: 'senior' as const,
    fitness_status: 'fit' as const,
    strengths: '',
    weaknesses: '',
    photo: null as File | null
  })
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category: 'jerseys',
    offer_percentage: '0',
    images: [] as File[]
  })
  
  const [matchForm, setMatchForm] = useState({
    opponent: '',
    match_date: '',
    venue: '',
    is_home: true,
    competition: 'League',
    status: 'upcoming' as const
  })
  
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    image: null as File | null,
    is_pinned: false
  })

  useEffect(() => {
    checkUser()
    fetchAllData()
    
    // Real-time subscriptions
    const channel = supabase
      .channel('db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchPlayers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, fetchNews)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchTransactions)
      .subscribe()
      
    return () => { channel.unsubscribe() }
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setUser(data)
    setLoading(false)
  }

  const fetchAllData = async () => {
    await Promise.all([
      fetchPlayers(),
      fetchMatches(),
      fetchProducts(),
      fetchNews(),
      fetchTransactions(),
      fetchUsers()
    ])
  }

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('*').order('created_at', { ascending: false })
    setPlayers(data || [])
  }

  const fetchMatches = async () => {
    const { data } = await supabase.from('matches').select('*').order('match_date', { ascending: false })
    setMatches(data || [])
  }

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
  }

  const fetchNews = async () => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false })
    setNews(data || [])
  }

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(50)
    setTransactions(data || [])
  }

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
  }

  // --- Actions ---

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    let photo_url = null
    if (playerForm.photo) {
      const fileExt = playerForm.photo.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage
        .from('player-photos')
        .upload(fileName, playerForm.photo)
      
      if (!uploadError && data) {
        const { data: { publicUrl } } = supabase.storage.from('player-photos').getPublicUrl(fileName)
        photo_url = publicUrl
      }
    }
    
    const { error } = await supabase.from('players').insert({
      full_name: playerForm.full_name,
      position: playerForm.position,
      jersey_number: parseInt(playerForm.jersey_number),
      category: playerForm.category,
      fitness_status: playerForm.fitness_status,
      strengths: playerForm.strengths.split(',').map(s => s.trim()).filter(Boolean),
      weaknesses: playerForm.weaknesses.split(',').map(s => s.trim()).filter(Boolean),
      photo_url,
      is_active: true,
      goals: 0,
      assists: 0,
      attendance_rate: 100
    })
    
    if (!error) {
      setModals({ ...modals, player: false })
      resetPlayerForm()
      fetchPlayers()
    }
    setLoading(false)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const imageUrls: string[] = []
    for (const image of productForm.images) {
      const fileExt = image.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(fileName, image)
      
      if (!uploadError && data) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
        imageUrls.push(publicUrl)
      }
    }
    
    const { error } = await supabase.from('products').insert({
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      stock_quantity: parseInt(productForm.stock_quantity),
      category: productForm.category,
      offer_percentage: parseInt(productForm.offer_percentage),
      images: imageUrls,
      is_active: true
    })
    
    if (!error) {
      setModals({ ...modals, product: false })
      resetProductForm()
      fetchProducts()
    }
    setLoading(false)
  }

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.from('matches').insert({
      opponent: matchForm.opponent,
      match_date: matchForm.match_date,
      venue: matchForm.venue,
      is_home: matchForm.is_home,
      competition: matchForm.competition,
      status: matchForm.status,
      first_11: [],
      substitutes: []
    })
    
    if (!error) {
      setModals({ ...modals, match: false })
      resetMatchForm()
      fetchMatches()
    }
    setLoading(false)
  }

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    let image_url = null
    if (newsForm.image) {
      const fileExt = newsForm.image.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage
        .from('news-images')
        .upload(fileName, newsForm.image)
      
      if (!uploadError && data) {
        const { data: { publicUrl } } = supabase.storage.from('news-images').getPublicUrl(fileName)
        image_url = publicUrl
      }
    }
    
    const { error } = await supabase.from('news').insert({
      title: newsForm.title,
      content: newsForm.content,
      image_url,
      is_pinned: newsForm.is_pinned,
      published_by: user?.id
    })
    
    if (!error) {
      setModals({ ...modals, news: false })
      resetNewsForm()
      fetchNews()
    }
    setLoading(false)
  }

  const togglePlayerStatus = async (id: string, current: boolean) => {
    await supabase.from('players').update({ is_active: !current }).eq('id', id)
    fetchPlayers()
  }

  const deletePlayer = async (id: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      await supabase.from('players').delete().eq('id', id)
      fetchPlayers()
    }
  }

  const resetPlayerForm = () => {
    setPlayerForm({
      full_name: '',
      position: 'FWD',
      jersey_number: '',
      category: 'senior',
      fitness_status: 'fit',
      strengths: '',
      weaknesses: '',
      photo: null
    })
  }

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      category: 'jerseys',
      offer_percentage: '0',
      images: []
    })
  }

  const resetMatchForm = () => {
    setMatchForm({
      opponent: '',
      match_date: '',
      venue: '',
      is_home: true,
      competition: 'League',
      status: 'upcoming'
    })
  }

  const resetNewsForm = () => {
    setNewsForm({ title: '', content: '', image: null, is_pinned: false })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // --- Stats & Charts ---

  const stats = {
    totalRevenue: transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    totalUsers: users.length,
    totalPlayers: players.length,
    activePlayers: players.filter(p => p.is_active && p.fitness_status === 'fit').length,
    injuredPlayers: players.filter(p => p.fitness_status === 'injured').length,
    totalProducts: products.length,
    lowStockProducts: products.filter(p => p.stock_quantity < 5 && p.stock_quantity > 0).length,
    outOfStock: products.filter(p => p.stock_quantity === 0).length,
    upcomingMatches: matches.filter(m => m.status === 'upcoming').length,
    liveMatches: matches.filter(m => m.status === 'live').length
  }

  // Generate daily revenue data for chart
  const last30Days = eachDayOfInterval({
    start: addDays(new Date(), -30),
    end: new Date()
  })

  const revenueChartData = last30Days.map(day => {
    const dayTransactions = transactions.filter(t => 
      format(new Date(t.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    )
    return {
      name: format(day, 'MMM dd'),
      value: dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    }
  })

  const categoryData = [
    { name: 'Tickets', value: transactions.filter(t => t.type === 'ticket_sale').reduce((sum, t) => sum + Number(t.amount), 0), color: '#f97316' },
    { name: 'Merchandise', value: transactions.filter(t => t.type === 'merchandise').reduce((sum, t) => sum + Number(t.amount), 0), color: '#3b82f6' },
    { name: 'Donations', value: transactions.filter(t => t.type === 'donation').reduce((sum, t) => sum + Number(t.amount), 0), color: '#10b981' },
  ].filter(d => d.value > 0)

  const playerStatsData = [
    { subject: 'Goals', A: players.reduce((sum, p) => sum + (p.goals || 0), 0), fullMark: 100 },
    { subject: 'Assists', A: players.reduce((sum, p) => sum + (p.assists || 0), 0), fullMark: 100 },
    { subject: 'Fitness', A: Math.round(players.reduce((sum, p) => sum + (p.attendance_rate || 0), 0) / (players.length || 1)), fullMark: 100 },
    { subject: 'Active', A: stats.activePlayers, fullMark: players.length || 1 },
    { subject: 'Injured', A: stats.injuredPlayers, fullMark: players.length || 1 },
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'players', label: 'Players', icon: UserPlus },
    { id: 'matches', label: 'Matches', icon: Trophy },
     { id: 'live', label: 'Live Stream', icon: Radio },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'videos', label: 'Videos', icon: Film },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'users', label: 'Users', icon: Users },
  ]

  const filteredPlayers = players.filter(p => 
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.position.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-orange-400 font-semibold animate-pulse">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white font-sans selection:bg-orange-500/30">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[200px]" />
      </div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-[#0a0f1c]/80 backdrop-blur-2xl border-b border-slate-800/50 px-6 py-4">
        <div className="max-w-[1920px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Hot Blood FC</h1>
              <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">Management Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-slate-300">System Online</span>
            </div>
            
            <button className="relative p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-orange-500/50 hover:bg-slate-800 transition-all group">
              <Bell className="w-5 h-5 text-slate-300 group-hover:text-white" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full" />
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white">{user?.full_name || user?.email}</p>
                <p className="text-xs text-orange-400">Administrator</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-red-500/50 hover:text-red-400 transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1920px] mx-auto flex gap-6 p-6 relative z-10">
        {/* Sidebar */}
        <aside className="w-72 hidden lg:block sticky top-24 h-fit space-y-4">
          <GlassCard className="p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="font-medium">{tab.label}</span>
                {tab.id === 'players' && (
                  <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">{players.length}</span>
                )}
                {tab.id === 'shop' && stats.lowStockProducts > 0 && (
                  <span className="ml-auto text-xs bg-red-500 px-2 py-0.5 rounded-full">{stats.lowStockProducts}</span>
                )}
              </button>
            ))}
          </GlassCard>

          <GlassCard className="p-6 bg-gradient-to-br from-orange-500/20 to-red-600/20 border-orange-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-bold text-orange-400 uppercase tracking-wider">Pro Tip</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Use the Overview tab to see real-time stats and financial performance at a glance.
            </p>
          </GlassCard>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-140px)]">
          <AnimatePresence mode="wait">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-4xl font-black text-white mb-2">
                      Dashboard <GradientText>Overview</GradientText>
                    </h2>
                    <p className="text-slate-400">Real-time insights and performance metrics</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-orange-500/50 transition-all text-sm font-medium">
                      <Download className="w-4 h-4" /> Export Report
                    </button>
                    <button 
                      onClick={() => setModals({ ...modals, player: true })}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Quick Add
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatPill icon={DollarSign} label="Total Revenue" value={`KES ${(stats.totalRevenue/1000).toFixed(1)}K`} trend={12.5} color="green" />
                  <StatPill icon={Users} label="Registered Fans" value={stats.totalUsers.toString()} trend={8.3} color="blue" />
                  <StatPill icon={UserPlus} label="Active Players" value={`${stats.activePlayers}/${stats.totalPlayers}`} color="orange" />
                  <StatPill icon={Package} label="Products" value={stats.totalProducts.toString()} alert={stats.lowStockProducts} color="purple" />
                </div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-3 gap-6">
                  <GlassCard className="lg:col-span-2 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-white">Revenue Trend (30 Days)</h3>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">+12.5%</span>
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueChartData}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} />
                          <YAxis stroke="#475569" fontSize={12} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Revenue Sources</h3>
                    <div className="h-64">
                      {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                            <Legend />
                          </RePieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                          <PieChart className="w-12 h-12 mb-2 opacity-50" />
                          <p>No data yet</p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </div>

                {/* Recent Activity & Quick Actions */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Recent Transactions</h3>
                    {transactions.length > 0 ? (
                      <div className="space-y-3">
                        {transactions.slice(0, 5).map((t, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:border-orange-500/30 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                t.type === 'ticket_sale' ? 'bg-orange-500/20 text-orange-400' :
                                t.type === 'merchandise' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {t.type === 'ticket_sale' ? <Ticket className="w-6 h-6" /> :
                                 t.type === 'merchandise' ? <ShoppingBag className="w-6 h-6" /> :
                                 <DollarSign className="w-6 h-6" />}
                              </div>
                              <div>
                                <p className="font-semibold text-white capitalize">{t.type.replace('_', ' ')}</p>
                                <p className="text-sm text-slate-400">{format(new Date(t.created_at), 'MMM dd, yyyy')}</p>
                              </div>
                            </div>
                            <span className="text-emerald-400 font-bold text-lg">+KES {Number(t.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No transactions yet</p>
                      </div>
                    )}
                  </GlassCard>

                  <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: UserPlus, label: 'Add Player', color: 'from-orange-500 to-red-600', action: () => setModals({ ...modals, player: true }) },
                        { icon: Trophy, label: 'Schedule Match', color: 'from-blue-500 to-cyan-500', action: () => setModals({ ...modals, match: true }) },
                        { icon: ShoppingBag, label: 'Add Product', color: 'from-purple-500 to-pink-500', action: () => setModals({ ...modals, product: true }) },
                        { icon: Newspaper, label: 'Post News', color: 'from-emerald-500 to-teal-500', action: () => setModals({ ...modals, news: true }) },
                      ].map((action, i) => (
                        <button
                          key={i}
                          onClick={action.action}
                          className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:border-orange-500/30 transition-all group text-left"
                        >
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                            <action.icon className="w-7 h-7 text-white" />
                          </div>
                          <p className="font-bold text-white text-lg">{action.label}</p>
                        </button>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            )}

            {/* PLAYERS TAB */}
            {activeTab === 'players' && (
              <motion.div key="players" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-4xl font-black text-white mb-2">
                      Player <GradientText>Squad</GradientText>
                    </h2>
                    <p className="text-slate-400">Manage team roster, fitness & performance</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 w-64"
                      />
                    </div>
                    <div className="flex bg-slate-800/50 rounded-xl p-1">
                      <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}>
                        <Grid3X3 className="w-5 h-5" />
                      </button>
                      <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}>
                        <List className="w-5 h-5" />
                      </button>
                    </div>
                    <button 
                      onClick={() => setModals({ ...modals, player: true })}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium shadow-lg shadow-orange-500/25"
                    >
                      <Plus className="w-5 h-5" /> Add Player
                    </button>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {['All', 'Senior', 'Junior', 'Fit', 'Injured'].map((filter) => (
                    <button key={filter} className="px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 hover:border-orange-500/50 hover:text-white transition-all whitespace-nowrap text-sm font-medium">
                      {filter}
                    </button>
                  ))}
                </div>

                {filteredPlayers.length > 0 ? (
                  viewMode === 'grid' ? (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredPlayers.map((player, idx) => (
                        <GlassCard key={player.id} className="p-5 group">
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              {player.photo_url ? (
                                <img src={player.photo_url} alt={player.full_name} className="w-20 h-20 rounded-2xl object-cover" />
                              ) : (
                                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl font-bold text-white`}>
                                  {player.jersey_number}
                                </div>
                              )}
                              <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-slate-800 ${
                                player.fitness_status === 'fit' ? 'bg-emerald-500' :
                                player.fitness_status === 'injured' ? 'bg-red-500' :
                                'bg-yellow-500'
                              }`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-white text-lg truncate">{player.full_name}</h3>
                                  <p className="text-sm text-slate-400">{player.position} • #{player.jersey_number}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  player.category === 'senior' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {player.category}
                                </span>
                              </div>
                              
                              <div className="mt-3 flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-slate-400">
                                  <Activity className="w-4 h-4" />
                                  <span className={player.fitness_status === 'fit' ? 'text-emerald-400' : 'text-red-400'}>
                                    {player.fitness_status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-400">
                                  <Target className="w-4 h-4" />
                                  <span className="text-white">{player.goals} goals</span>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => setModals({ ...modals, playerDetails: player })}
                                    className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => deletePlayer(player.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <button 
                                  onClick={() => togglePlayerStatus(player.id, player.is_active)}
                                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                                    player.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                                  }`}
                                >
                                  {player.is_active ? 'Active' : 'Inactive'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  ) : (
                    <GlassCard className="overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-800/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Player</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Position</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-400">Status</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-400">Goals</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredPlayers.map((player) => (
                            <tr key={player.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {player.photo_url ? (
                                    <img src={player.photo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                                      {player.jersey_number}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-white">{player.full_name}</p>
                                    <p className="text-xs text-slate-400">{player.category}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-300">{player.position}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  player.fitness_status === 'fit' ? 'bg-emerald-500/20 text-emerald-400' :
                                  player.fitness_status === 'injured' ? 'bg-red-500/20 text-red-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {player.fitness_status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center text-white font-bold">{player.goals}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => deletePlayer(player.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </GlassCard>
                  )
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-12 h-12 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No players found</h3>
                    <p className="text-slate-400 mb-6">Start building your squad by adding players</p>
                    <button 
                      onClick={() => setModals({ ...modals, player: true })}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold"
                    >
                      Add First Player
                    </button>
                  </div>
                )}
              </motion.div>
            )}
             {/* Live Stream tab */}
             {activeTab === 'live' && (
  <motion.div 
    key="live"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <Broadcaster />
  </motion.div>
)}
{/* VIDEOS TAB */}
{activeTab === 'videos' && (
  <motion.div 
    key="videos"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <VideoUploader />
  </motion.div>
)}

            {/* activeTab === 'matches' */}
            {activeTab === 'matches' && (
  <motion.div 
    key="matches"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="h-full"
  >
    <MatchesManager />
  </motion.div>
)}

            {/* SHOP TAB */}
            {activeTab === 'shop' && (
              <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-4xl font-black text-white mb-2">
                      Shop <GradientText>Management</GradientText>
                    </h2>
                    <p className="text-slate-400">Manage products, inventory & pricing</p>
                  </div>
                  <Button icon={Plus} onClick={() => setModals({ ...modals, product: true })}>Add Product</Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <GlassCard className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Package className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
                      <p className="text-sm text-slate-400">Total Products</p>
                    </div>
                  </GlassCard>
                  <GlassCard className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.lowStockProducts}</p>
                      <p className="text-sm text-slate-400">Low Stock</p>
                    </div>
                  </GlassCard>
                  <GlassCard className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <X className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.outOfStock}</p>
                      <p className="text-sm text-slate-400">Out of Stock</p>
                    </div>
                  </GlassCard>
                </div>

                {products.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map((product) => (
                      <GlassCard key={product.id} className="overflow-hidden group">
                        <div className="relative aspect-square bg-slate-800/50">
                          {product.images && product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <ShoppingBag size={48} />
                            </div>
                          )}
                          {product.offer_percentage > 0 && (
                            <div className="absolute top-3 left-3 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                              -{product.offer_percentage}%
                            </div>
                          )}
                          {product.stock_quantity < 5 && product.stock_quantity > 0 && (
                            <div className="absolute top-3 right-3 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                              Low Stock: {product.stock_quantity}
                            </div>
                          )}
                          {product.stock_quantity === 0 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg">OUT OF STOCK</span>
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-white">{product.name}</h3>
                            <span className="text-lg font-bold text-orange-400">KES {product.price.toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-slate-400 mb-4 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${product.stock_quantity < 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {product.stock_quantity} in stock
                            </span>
                            <div className="flex gap-2">
                              <button className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                    <h3 className="text-xl font-bold text-white mb-2">No products yet</h3>
                    <p className="text-slate-400 mb-6">Add merchandise to sell to your fans</p>
                    <button 
                      onClick={() => setModals({ ...modals, product: true })}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold"
                    >
                      Add First Product
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Other tabs placeholder */}
            {( activeTab === 'news' || activeTab === 'finance' || activeTab === 'users') && (
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32"
              >
                <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
            
                  {activeTab === 'news' && <Newspaper className="w-12 h-12 text-slate-500" />}
                  {activeTab === 'finance' && <DollarSign className="w-12 h-12 text-slate-500" />}
                  {activeTab === 'users' && <Users className="w-12 h-12 text-slate-500" />}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
                <p className="text-slate-400">This section is under development</p>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* MODALS */}

      {/* Add Player Modal */}
      <Modal isOpen={modals.player} onClose={() => setModals({ ...modals, player: false })} title="Add New Player" size="md">
        <form onSubmit={handleAddPlayer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
              <input
                type="text"
                value={playerForm.full_name}
                onChange={(e) => setPlayerForm({...playerForm, full_name: e.target.value})}
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Position</label>
              <select 
                value={playerForm.position} 
                onChange={(e) => setPlayerForm({...playerForm, position: e.target.value as any})}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              >
                <option value="GK">Goalkeeper</option>
                <option value="DEF">Defender</option>
                <option value="MID">Midfielder</option>
                <option value="FWD">Forward</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Jersey Number *</label>
              <input
                type="number"
                value={playerForm.jersey_number}
                onChange={(e) => setPlayerForm({...playerForm, jersey_number: e.target.value})}
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select 
                value={playerForm.category} 
                onChange={(e) => setPlayerForm({...playerForm, category: e.target.value as any})}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              >
                <option value="senior">Senior Team</option>
                <option value="junior">Junior Team</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Fitness Status</label>
              <select 
                value={playerForm.fitness_status} 
                onChange={(e) => setPlayerForm({...playerForm, fitness_status: e.target.value as any})}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              >
                <option value="fit">Fit</option>
                <option value="injured">Injured</option>
                <option value="recovering">Recovering</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Photo</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setPlayerForm({...playerForm, photo: e.target.files?.[0] || null})}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Strengths (comma separated)</label>
            <input
              type="text"
              value={playerForm.strengths}
              onChange={(e) => setPlayerForm({...playerForm, strengths: e.target.value})}
              placeholder="Speed, Dribbling, Passing"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Weaknesses (comma separated)</label>
            <input
              type="text"
              value={playerForm.weaknesses}
              onChange={(e) => setPlayerForm({...playerForm, weaknesses: e.target.value})}
              placeholder="Heading, Stamina"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModals({ ...modals, player: false })}
              className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Player'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Product Modal */}
      <Modal isOpen={modals.product} onClose={() => setModals({ ...modals, product: false })} title="Add New Product" size="md">
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Product Name *</label>
            <input
              type="text"
              value={productForm.name}
              onChange={(e) => setProductForm({...productForm, name: e.target.value})}
              required
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={productForm.description}
              onChange={(e) => setProductForm({...productForm, description: e.target.value})}
              rows={3}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Price (KES) *</label>
              <input
                type="number"
                value={productForm.price}
                onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Stock Quantity *</label>
              <input
                type="number"
                value={productForm.stock_quantity}
                onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select 
                value={productForm.category} 
                onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              >
                <option value="jerseys">Jerseys</option>
                <option value="accessories">Accessories</option>
                <option value="training">Training</option>
                <option value="tickets">Tickets</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Discount %</label>
              <input
                type="number"
                value={productForm.offer_percentage}
                onChange={(e) => setProductForm({...productForm, offer_percentage: e.target.value})}
                min="0"
                max="100"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Product Images</label>
            <input 
              type="file" 
              accept="image/*"
              multiple
              onChange={(e) => setProductForm({...productForm, images: Array.from(e.target.files || [])})}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white"
            />
            <p className="text-xs text-slate-500 mt-1">You can select multiple images</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModals({ ...modals, product: false })}
              className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Match Modal */}
      <Modal isOpen={modals.match} onClose={() => setModals({ ...modals, match: false })} title="Schedule New Match" size="md">
        <form onSubmit={handleAddMatch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Opponent Team *</label>
            <input
              type="text"
              value={matchForm.opponent}
              onChange={(e) => setMatchForm({...matchForm, opponent: e.target.value})}
              required
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Date & Time *</label>
              <input 
                type="datetime-local" 
                value={matchForm.match_date} 
                onChange={(e) => setMatchForm({...matchForm, match_date: e.target.value})}
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Venue *</label>
              <input
                type="text"
                value={matchForm.venue}
                onChange={(e) => setMatchForm({...matchForm, venue: e.target.value})}
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Competition</label>
              <select 
                value={matchForm.competition} 
                onChange={(e) => setMatchForm({...matchForm, competition: e.target.value})}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              >
                <option>League</option>
                <option>Cup</option>
                <option>Friendly</option>
                <option>Tournament</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Home/Away</label>
              <select 
                value={matchForm.is_home ? 'true' : 'false'} 
                onChange={(e) => setMatchForm({...matchForm, is_home: e.target.value === 'true'})}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              >
                <option value="true">Home</option>
                <option value="false">Away</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModals({ ...modals, match: false })}
              className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule Match'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add News Modal */}
      <Modal isOpen={modals.news} onClose={() => setModals({ ...modals, news: false })} title="Create News Post" size="md">
        <form onSubmit={handleAddNews} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
            <input
              type="text"
              value={newsForm.title}
              onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
              required
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Content *</label>
            <textarea
              value={newsForm.content}
              onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
              required
              rows={5}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Featured Image</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setNewsForm({...newsForm, image: e.target.files?.[0] || null})}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white"
            />
          </div>
          <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={newsForm.is_pinned}
              onChange={(e) => setNewsForm({...newsForm, is_pinned: e.target.checked})}
              className="w-5 h-5 rounded border-slate-600 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-white">Pin this post to top</span>
          </label>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModals({ ...modals, news: false })}
              className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  )
}

// Button Component
function Button({ children, onClick, variant = 'primary', icon: Icon, loading = false, className = '' }: any) {
  const variants = {
    primary: 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/25',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
    success: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
  }
  
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}