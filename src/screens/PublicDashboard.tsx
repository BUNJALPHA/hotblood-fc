// PublicDashboard.tsx - CONNECTED VERSION
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Calendar, Trophy, ShoppingCart, LogOut, TrendingUp, Users, 
  Ticket, Bell, Search, Home, Newspaper, Heart, Share2, ChevronRight,
  MapPin, Clock, Star, Filter, Download, X, Plus, Minus, Trash2,
  CreditCard, Phone, Building2
} from 'lucide-react'
import { supabase } from '../helpers/supabase'
import { format, isPast, isFuture, isToday } from 'date-fns'

// --- Types ---
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
}

interface NewsItem {
  id: string
  title: string
  content: string
  image_url: string | null
  is_pinned: boolean
  created_at: string
}

interface CartItem {
  product: Product
  quantity: number
}

interface LeagueStanding {
  id: string
  team_name: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  points: number
}

// Shop Card Component
function ShopCard({ item, idx, theme, isDarkMode, onAddToCart }: any) {
  const [currentImage, setCurrentImage] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (item.images?.length > 1) {
      const interval = setInterval(() => {
        if (!isHovered) {
          setCurrentImage((prev: number) => (prev + 1) % item.images.length)
        }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [item.images?.length, isHovered])

  const discountedPrice = item.offer_percentage > 0 
    ? item.price * (1 - item.offer_percentage / 100) 
    : item.price

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className={`${theme.card} rounded-2xl overflow-hidden border ${theme.border} group hover:border-red-500/50 transition-all`}
      whileHover={{ y: -8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
        {item.images && item.images.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage}
              src={item.images[currentImage]}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-contain p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
        ) : (
          <div className="flex items-center justify-center text-gray-400">
            <ShoppingCart size={48} />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          {item.images?.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.images.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentImage ? 'bg-red-600 w-4' : 'bg-gray-400'}`}
                />
              ))}
            </div>
          )}
        </div>

        {item.offer_percentage > 0 && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg">
            -{item.offer_percentage}%
          </span>
        )}
        
        {item.stock_quantity < 5 && item.stock_quantity > 0 && (
          <span className="absolute top-3 right-3 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
            Low Stock
          </span>
        )}
        
        {item.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="px-4 py-2 bg-gray-800 text-white font-bold rounded-lg">SOLD OUT</span>
          </div>
        )}
      </div>
      
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-bold ${theme.text}`}>{item.name}</h3>
          {item.images?.length > 1 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {item.images.length} colors
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description || 'No description'}</p>
        <div className="flex items-center justify-between">
          <div>
            {item.offer_percentage > 0 ? (
              <div className="flex items-center gap-2">
                <p className="text-red-600 font-black text-xl">KES {discountedPrice.toLocaleString()}</p>
                <p className="text-gray-400 line-through text-sm">KES {item.price.toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-red-600 font-black text-xl">KES {item.price.toLocaleString()}</p>
            )}
          </div>
          <button 
            onClick={() => onAddToCart(item)}
            disabled={item.stock_quantity === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} /> Add
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">{item.stock_quantity} in stock</p>
      </div>
    </motion.div>
  )
}

// Cart Sidebar Component
function CartSidebar({ isOpen, onClose, cartItems, onUpdateQuantity, onRemove, theme, onCheckout }: any) {
  const total = cartItems.reduce((sum: number, item: CartItem) => sum + (item.product.price * (1 - item.product.offer_percentage / 100) * item.quantity), 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 bottom-0 w-full max-w-md ${theme.card} border-l ${theme.border} z-50 shadow-2xl flex flex-col`}
          >
            <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}>
              <h2 className={`text-xl font-bold ${theme.text} flex items-center gap-2`}>
                <ShoppingCart className="text-red-600" /> Your Cart
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={24} className={theme.text} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
                  <p className={`text-lg font-medium ${theme.text}`}>Your cart is empty</p>
                  <p className="text-gray-500">Add some items to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item: CartItem, idx: number) => (
                    <div key={idx} className={`flex gap-4 p-4 rounded-xl ${isOpen ? 'bg-gray-50' : ''} border ${theme.border}`}>
                      <img 
                        src={item.product.images?.[0] || '/images/logo.png'} 
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className={`font-bold ${theme.text}`}>{item.product.name}</h4>
                        <p className="text-red-600 font-bold">KES {(item.product.price * (1 - item.product.offer_percentage / 100)).toLocaleString()}</p>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <button 
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-bold w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                            disabled={item.quantity >= item.product.stock_quantity}
                          >
                            <Plus size={16} />
                          </button>
                          <button 
                            onClick={() => onRemove(item.product.id)}
                            className="ml-auto p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className={`p-6 border-t ${theme.border} space-y-4`}>
                <div className="flex justify-between items-center">
                  <span className={`text-lg font-bold ${theme.text}`}>Total</span>
                  <span className="text-2xl font-black text-red-600">KES {total.toLocaleString()}</span>
                </div>
                <button 
                  onClick={onCheckout}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-red-600/30 transition-all flex items-center justify-center gap-2"
                >
                  Checkout <ChevronRight size={20} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Checkout Modal
function CheckoutModal({ isOpen, onClose, cartItems, total, theme, onSuccess }: any) {
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank' | 'airtel'>('mpesa')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Create transaction record
    const { error } = await supabase.from('transactions').insert({
      type: 'merchandise',
      amount: total,
      description: `Purchase of ${cartItems.length} items`,
      payment_method: paymentMethod
    })
    
    setLoading(false)
    if (!error) {
      onSuccess()
      onClose()
      setStep(1)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${theme.card} rounded-3xl p-8 w-full max-w-lg border ${theme.border} shadow-2xl`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${theme.text}`}>Checkout</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} className={theme.text} />
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl ${isOpen ? 'bg-gray-50' : ''} border ${theme.border}`}>
              <h3 className={`font-bold ${theme.text} mb-3`}>Order Summary</h3>
              {cartItems.map((item: CartItem, idx: number) => (
                <div key={idx} className="flex justify-between py-2">
                  <span className="text-gray-600">{item.product.name} x{item.quantity}</span>
                  <span className="font-bold">KES {(item.product.price * (1 - item.product.offer_percentage / 100) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between">
                <span className={`font-bold ${theme.text}`}>Total</span>
                <span className="text-2xl font-black text-red-600">KES {total.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h3 className={`font-bold ${theme.text} mb-3`}>Select Payment Method</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'mpesa' ? 'border-green-500 bg-green-50' : theme.border}`}
                >
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white">
                    <Phone size={24} />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${theme.text}`}>M-Pesa</p>
                    <p className="text-sm text-gray-500">Pay via M-Pesa mobile money</p>
                  </div>
                </button>

                <button 
                  onClick={() => setPaymentMethod('bank')}
                  className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'bank' ? 'border-blue-500 bg-blue-50' : theme.border}`}
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                    <Building2 size={24} />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${theme.text}`}>Bank Transfer</p>
                    <p className="text-sm text-gray-500">Direct bank transfer</p>
                  </div>
                </button>

                <button 
                  onClick={() => setPaymentMethod('airtel')}
                  className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'airtel' ? 'border-red-500 bg-red-50' : theme.border}`}
                >
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-white">
                    <CreditCard size={24} />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${theme.text}`}>Airtel Money</p>
                    <p className="text-sm text-gray-500">Pay via Airtel Money</p>
                  </div>
                </button>
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
            >
              Continue to Payment
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone size={40} className="text-green-600" />
              </div>
              <h3 className={`text-xl font-bold ${theme.text} mb-2`}>M-Pesa Payment</h3>
              <p className="text-gray-500">Enter your M-Pesa number to receive STK push</p>
            </div>

            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>Phone Number</label>
              <input 
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="254712345678"
                className={`w-full p-4 rounded-xl border ${theme.border} bg-transparent ${theme.text} focus:border-red-500 focus:outline-none`}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)}
                className={`flex-1 py-4 border ${theme.border} rounded-xl font-bold ${theme.text} hover:bg-gray-50 transition-all`}
              >
                Back
              </button>
              <button 
                onClick={handlePayment}
                disabled={loading || phoneNumber.length < 10}
                className="flex-1 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : <>Pay KES {total.toLocaleString()}</>}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// MAIN COMPONENT
export default function PublicDashboard() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  
  // Data states
  const [products, setProducts] = useState<Product[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [standings, setStandings] = useState<LeagueStanding[]>([])
  const [liveMatch, setLiveMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUser()
    fetchAllData()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('public_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, fetchNews)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUser(data)
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchProducts(),
      fetchMatches(),
      fetchNews(),
      fetchStandings()
    ])
    setLoading(false)
  }

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setProducts(data || [])
  }

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true })
    
    const matches = data || []
    setMatches(matches)
    
    // Find live match
    const live = matches.find(m => m.status === 'live')
    setLiveMatch(live || null)
  }

  const fetchNews = async () => {
    const { data } = await supabase
      .from('news')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setNews(data || [])
  }

  const fetchStandings = async () => {
    const { data } = await supabase
      .from('league_standings')
      .select('*, leagues(name)')
      .order('points', { ascending: false })
    setStandings(data || [])
  }

  // Cart functions
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock_quantity) }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    setShowCart(true)
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCartItems(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ))
  }

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId))
  }

  const cartTotal = cartItems.reduce((sum, item) => 
    sum + (item.product.price * (1 - item.product.offer_percentage / 100) * item.quantity), 0
  )

  const handleCheckoutSuccess = () => {
    setCartItems([])
    setShowCheckout(false)
    alert('Payment successful! Thank you for your purchase.')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'fixtures', label: 'Fixtures', icon: Calendar },
    { id: 'table', label: 'League Table', icon: Trophy },
    { id: 'shop', label: 'Shop', icon: ShoppingCart },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'news', label: 'News', icon: Newspaper },
  ]

  const notifications = [
    { id: 1, title: 'New Product Added', msg: 'Check out the new 2025 jerseys', time: '30m ago', unread: true },
    { id: 2, title: 'Match Starting Soon', msg: liveMatch ? `vs ${liveMatch.opponent} is live!` : 'Next match in 2 days', time: '1h ago', unread: true },
    { id: 3, title: 'Training Update', msg: 'Captain returns to squad', time: '5h ago', unread: false },
  ]

  const theme = isDarkMode ? {
    bg: 'bg-[#0a0a0a]',
    card: 'bg-[#161616]',
    border: 'border-red-900/30',
    text: 'text-white',
    textMuted: 'text-gray-400',
    sidebar: 'bg-[#161616]',
    hover: 'hover:bg-red-500/10',
    active: 'bg-gradient-to-r from-red-600 to-orange-600',
    gradient: 'from-red-600 via-orange-600 to-yellow-500'
  } : {
    bg: 'bg-gray-50',
    card: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    sidebar: 'bg-white',
    hover: 'hover:bg-red-50',
    active: 'bg-gradient-to-r from-red-600 to-orange-600',
    gradient: 'from-red-600 via-orange-600 to-yellow-500'
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="flex items-center gap-3 text-red-600">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xl font-bold">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      {/* Top Navigation */}
      <nav className={`${theme.card} border-b ${theme.border} px-6 py-4 sticky top-0 z-40 backdrop-blur-xl bg-opacity-90`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.div 
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <img src="/images/logo.png" alt="Logo" className="w-12 h-12 rounded-full border-2 border-red-600 shadow-lg" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:block">
                <span className={`text-xl font-black ${theme.text}`}>Hot Blood FC</span>
                <p className="text-xs text-red-500 font-medium">Kagumo • Kenya</p>
              </div>
            </motion.div>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className={`relative w-full ${theme.card} rounded-full border ${theme.border} px-4 py-2 flex items-center gap-2`}>
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search matches, players, news..." 
                className={`w-full bg-transparent outline-none text-sm ${theme.text}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full ${theme.hover} transition-colors`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full ${theme.hover} transition-colors relative`}
              >
                <Bell size={20} className={theme.text} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 mt-2 w-80 ${theme.card} border ${theme.border} rounded-2xl shadow-2xl p-4 z-50`}
                  >
                    <h3 className={`font-bold ${theme.text} mb-3`}>Notifications</h3>
                    <div className="space-y-3">
                      {notifications.map(n => (
                        <div key={n.id} className={`flex gap-3 p-2 rounded-lg ${n.unread ? 'bg-red-50' : ''} cursor-pointer hover:bg-red-50/50 transition-colors`}>
                          <div className={`w-2 h-2 rounded-full mt-2 ${n.unread ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <p className={`text-sm font-semibold ${theme.text}`}>{n.title}</p>
                            <p className="text-xs text-gray-500">{n.msg}</p>
                            <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowCart(true)}
              className={`p-2 rounded-full ${theme.hover} transition-colors relative`}
            >
              <ShoppingCart size={20} className={theme.text} />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className={`text-sm font-semibold ${theme.text}`}>{user?.full_name || 'Fan'}</p>
                <p className="text-xs text-red-500">Premium Member</p>
              </div>
              <img 
                src={user?.avatar_url || '/images/logo.png'} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-red-500 cursor-pointer"
              />
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Cart Sidebar */}
      <CartSidebar 
        isOpen={showCart} 
        onClose={() => setShowCart(false)} 
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        theme={theme}
        onCheckout={() => setShowCheckout(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cartItems={cartItems}
        total={cartTotal}
        theme={theme}
        onSuccess={handleCheckoutSuccess}
      />

      <div className="max-w-7xl mx-auto flex gap-6 p-6">
        {/* Sidebar */}
        <aside className={`w-64 ${theme.sidebar} rounded-3xl border ${theme.border} p-4 h-fit sticky top-24 hidden lg:block`}>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ x: 4 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  activeTab === tab.id 
                    ? `${theme.active} text-white shadow-lg shadow-red-500/30` 
                    : `${theme.textMuted} ${theme.hover} hover:text-red-500`
                }`}
              >
                <tab.icon size={20} />
                <span className="font-medium">{tab.label}</span>
                {tab.id === 'shop' && cartItems.length > 0 && (
                  <span className="ml-auto bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </motion.button>
            ))}
          </nav>

          <div className="mt-8 p-4 bg-gradient-to-br from-red-600 via-orange-600 to-yellow-500 rounded-2xl text-white">
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-yellow-300" />
              <span className="text-xs font-bold uppercase tracking-wider">Premium Fan</span>
            </div>
            <p className="text-sm font-bold mb-1">{user?.full_name || 'Hot Blood Fan'}</p>
            <p className="text-xs opacity-80 mb-3"> <img src="/images/logo.png" />ID: HB{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
            <button className="w-full py-2 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-bold hover:bg-white/30 transition-colors flex items-center justify-center gap-1">
              <Download size={14} /> Download Card
            </button>
          </div>
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
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className={`text-4xl font-black ${theme.text} mb-2`}>
                      Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">{user?.full_name?.split(' ')[0] || 'Fan'}</span>! 🔥
                    </h1>
                    <p className={theme.textMuted}>Here's what's happening with your club today</p>
                  </div>
                  <span className="text-sm text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>

                {/* Live Match or Next Match */}
                {liveMatch ? (
                  <motion.div 
                    className={`${theme.card} rounded-3xl p-8 border ${theme.border} relative overflow-hidden`}
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-600/20 to-orange-600/20 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">LIVE</span>
                        <span className={`text-sm ${theme.textMuted}`}>{liveMatch.competition}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-center">
                          <img src="/images/logo.png" alt="Hot Blood" className="w-20 h-20 rounded-full border-4 border-red-600 mb-2 mx-auto" />
                          <p className={`font-bold ${theme.text}`}>Hot Blood FC</p>
                          <p className="text-xs text-red-500">Home</p>
                        </div>
                        
                        <div className="text-center px-8">
                          <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                            {liveMatch.our_score} - {liveMatch.opponent_score}
                          </p>
                          <p className="text-sm text-red-500 font-bold mt-1">
                            {format(new Date(), 'HH:mm')}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-gray-200 mb-2 mx-auto flex items-center justify-center text-3xl">⚽</div>
                          <p className={`font-bold ${theme.text}`}>{liveMatch.opponent}</p>
                          <p className="text-xs text-gray-500">Away</p>
                        </div>
                      </div>
<div className="flex gap-3">
<button 
  onClick={() => {
    supabase.from('live_streams')
      .select('stream_key')
      .eq('match_id', liveMatch.id)
      .eq('is_active', true)
      .single()
      .then(({ data }) => {
        if (data) {
        window.open(`/live/${data.stream_key}`, '_blank')
        } else {
          alert('Stream not available yet')
        }
      })
  }}
  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
>
  Watch Live
</button>
                        <button className="px-4 py-3 border-2 border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors">
                          <Share2 size={20} />
                        </button>
                      </div>
                      </div>
                  </motion.div>
                ) : matches.filter(m => m.status === 'upcoming')[0] ? (
                  <motion.div 
                    className={`${theme.card} rounded-3xl p-8 border ${theme.border} relative overflow-hidden`}
                    whileHover={{ y: -4 }}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">UPCOMING</span>
                        <span className={`text-sm ${theme.textMuted}`}>{matches.filter(m => m.status === 'upcoming')[0]?.competition}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-center">
                          <img src="/images/logo.png" alt="Hot Blood" className="w-20 h-20 rounded-full border-4 border-blue-600 mb-2 mx-auto" />
                          <p className={`font-bold ${theme.text}`}>Hot Blood FC</p>
                          <p className="text-xs text-blue-500">
                            {matches.filter(m => m.status === 'upcoming')[0]?.is_home ? 'Home' : 'Away'}
                          </p>
                        </div>
                        
                        <div className="text-center px-8">
                          <p className="text-3xl font-bold text-blue-600">VS</p>
                          <p className="text-sm text-gray-500 mt-2">
                            {format(new Date(matches.filter(m => m.status === 'upcoming')[0]?.match_date), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-gray-200 mb-2 mx-auto flex items-center justify-center text-3xl">⚽</div>
                          <p className={`font-bold ${theme.text}`}>{matches.filter(m => m.status === 'upcoming')[0]?.opponent}</p>
                          <p className="text-xs text-gray-500">
                            {matches.filter(m => m.status === 'upcoming')[0]?.venue}
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={() => setActiveTab('tickets')}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                      >
                        Get Tickets
                      </button>
                    </div>
                  </motion.div>
                ) : null}

                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { icon: Trophy, label: 'Position', value: standings.find(s => s.team_name === 'Hot Blood FC') ? `#${standings.findIndex(s => s.team_name === 'Hot Blood FC') + 1}` : '-', subtext: 'in league', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                    { icon: TrendingUp, label: 'Points', value: standings.find(s => s.team_name === 'Hot Blood FC')?.points || '-', subtext: 'Championship race', color: 'text-red-500', bg: 'bg-red-500/10' },
                    { icon: Calendar, label: 'Next Match', value: matches.filter(m => m.status === 'upcoming')[0] ? format(new Date(matches.filter(m => m.status === 'upcoming')[0].match_date), 'MMM dd') : 'TBD', subtext: 'Mark your calendar', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { icon: Users, label: 'Products', value: products.length.toString(), subtext: 'in shop', color: 'text-purple-500', bg: 'bg-purple-500/10' }
                  ].map((stat, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`${theme.card} rounded-2xl p-6 border ${theme.border} hover:border-red-500/50 transition-all cursor-pointer group`}
                      whileHover={{ y: -4 }}
                    >
                      <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <stat.icon className={stat.color} size={24} />
                      </div>
                      <p className={`text-3xl font-black ${theme.text} mb-1`}>{stat.value}</p>
                      <p className={`text-sm font-medium ${theme.textMuted}`}>{stat.label}</p>
                      <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Recent News Preview */}
                {news.length > 0 && (
                  <div className={`${theme.card} rounded-2xl p-6 border ${theme.border}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`font-bold ${theme.text} flex items-center gap-2`}>
                        <Newspaper className="text-red-500" size={20} /> Latest News
                      </h3>
                      <button 
                        onClick={() => setActiveTab('news')}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        View All
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {news.slice(0, 2).map((item, idx) => (
                        <div 
                          key={item.id}
                          className={`flex gap-4 p-4 rounded-xl ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gray-50'} hover:bg-red-50 transition-colors cursor-pointer`}
                          onClick={() => setActiveTab('news')}
                        >
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center text-2xl flex-shrink-0">
                            📰
                          </div>
                          <div className="min-w-0">
                            <h4 className={`font-bold ${theme.text} truncate`}>{item.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2">{item.content}</p>
                            <p className="text-xs text-gray-400 mt-1">{format(new Date(item.created_at), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* FIXTURES TAB */}
            {activeTab === 'fixtures' && (
              <motion.div 
                key="fixtures"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h1 className={`text-3xl font-black ${theme.text}`}>Upcoming Fixtures</h1>
                  <div className="flex gap-2">
                    <button className={`px-4 py-2 ${theme.card} border ${theme.border} rounded-lg text-sm font-medium ${theme.text} hover:border-red-500 transition-colors`}>
                      <Filter size={16} className="inline mr-2" /> Filter
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {matches.filter(m => m.status !== 'cancelled').length > 0 ? (
                    matches.filter(m => m.status !== 'cancelled').map((match, idx) => (
                      <motion.div 
                        key={match.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`${theme.card} rounded-2xl p-6 border ${theme.border} hover:border-red-500/50 transition-all group cursor-pointer`}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${match.is_home ? 'bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-lg shadow-red-600/30' : 'bg-gray-100'}`}>
                              {match.is_home ? '🏠' : '✈️'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`text-xl font-bold ${theme.text}`}>vs {match.opponent}</p>
                                {match.status === 'live' && (
                                  <span className="px-2 py-0.5 bg-red-500/10 text-red-600 text-xs font-bold rounded-full animate-pulse">
                                    LIVE
                                  </span>
                                )}
                                {isFuture(new Date(match.match_date)) && (
                                  <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-bold rounded-full">
                                    Tickets Available
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><MapPin size={14} /> {match.venue}</span>
                                <span className="flex items-center gap-1"><Clock size={14} /> {format(new Date(match.match_date), 'HH:mm')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-red-600 font-bold text-lg">{format(new Date(match.match_date), 'MMM dd, yyyy')}</p>
                            {match.status === 'completed' ? (
                              <p className="text-2xl font-bold text-gray-700 mt-1">{match.our_score} - {match.opponent_score}</p>
                            ) : isFuture(new Date(match.match_date)) && (
                              <button 
                                onClick={() => setActiveTab('tickets')}
                                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Get Ticket
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <EmptyState icon={Calendar} title="No fixtures scheduled" description="Check back later for upcoming matches." />
                  )}
                </div>
              </motion.div>
            )}

            {/* TABLE TAB */}
            {activeTab === 'table' && (
              <motion.div 
                key="table"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <h1 className={`text-3xl font-black ${theme.text}`}>League Standings</h1>
                
                {standings.length > 0 ? (
                  <div className={`${theme.card} rounded-3xl border ${theme.border} overflow-hidden`}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={`${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                          <tr>
                            <th className={`px-6 py-4 text-left text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>Pos</th>
                            <th className={`px-6 py-4 text-left text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>Team</th>
                            <th className={`px-6 py-4 text-center text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>P</th>
                            <th className={`px-6 py-4 text-center text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>W</th>
                            <th className={`px-6 py-4 text-center text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>D</th>
                            <th className={`px-6 py-4 text-center text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>L</th>
                            <th className={`px-6 py-4 text-center text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>GF</th>
                            <th className={`px-6 py-4 text-center text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>GA</th>
                            <th className={`px-6 py-4 text-center text-xs font-bold ${theme.textMuted} uppercase tracking-wider`}>GD</th>
                            <th className={`px-6 py-4 text-center text-xs font-bold text-red-600 uppercase tracking-wider`}>Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {standings.map((team, index) => (
                            <tr 
                              key={team.id} 
                              className={`${team.team_name === 'Hot Blood FC' ? (isDarkMode ? 'bg-red-900/30' : 'bg-red-50') : ''} hover:bg-red-50/50 transition-colors`}
                            >
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-500 text-white' : 
                                  index === 1 ? 'bg-gray-400 text-white' : 
                                  index === 2 ? 'bg-orange-400 text-white' : 'text-gray-500'
                                }`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">⚽</div>
                                  <span className={`font-bold ${theme.text} ${team.team_name === 'Hot Blood FC' ? 'text-red-600' : ''}`}>{team.team_name}</span>
                                  {team.team_name === 'Hot Blood FC' && <span className="text-xs text-red-500 font-bold">YOU</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center text-gray-600">{team.played}</td>
                              <td className="px-6 py-4 text-center text-green-600 font-semibold">{team.won}</td>
                              <td className="px-6 py-4 text-center text-yellow-600">{team.drawn}</td>
                              <td className="px-6 py-4 text-center text-red-600">{team.lost}</td>
                              <td className="px-6 py-4 text-center text-gray-600">{team.goals_for}</td>
                              <td className="px-6 py-4 text-center text-gray-600">{team.goals_against}</td>
                              <td className="px-6 py-4 text-center font-semibold text-blue-600">{team.goals_for - team.goals_against > 0 ? '+' : ''}{team.goals_for - team.goals_against}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-xl font-black text-red-600">{team.points}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={Trophy} title="No league data" description="League standings will appear here once the season starts." />
                )}
              </motion.div>
            )}

            {/* SHOP TAB */}
            {activeTab === 'shop' && (
              <motion.div 
                key="shop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h1 className={`text-3xl font-black ${theme.text}`}>Fan Shop</h1>
                  <div className="flex gap-2">
                    {['All', 'Jerseys', 'Accessories', 'Training'].map((cat) => (
                      <button 
                        key={cat} 
                        className={`px-4 py-2 rounded-full text-sm font-medium ${cat === 'All' ? 'bg-red-600 text-white' : `${theme.card} ${theme.text} border ${theme.border}`}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {products.length > 0 ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    {products.map((product, idx) => (
                      <ShopCard 
                        key={product.id} 
                        item={{
                          ...product,
                          badge: product.offer_percentage > 0 ? 'Sale' : product.stock_quantity < 5 ? 'Low Stock' : null,
                          desc: product.description,
                          price: `KES ${product.price.toLocaleString()}`
                        }} 
                        idx={idx} 
                        theme={theme} 
                        isDarkMode={isDarkMode} 
                        onAddToCart={addToCart}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    icon={ShoppingCart} 
                    title="Shop is empty" 
                    description="Check back soon for new merchandise!"
                  />
                )}
              </motion.div>
            )}

            {/* TICKETS TAB */}
            {activeTab === 'tickets' && (
              <motion.div 
                key="tickets"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <h1 className={`text-3xl font-black ${theme.text}`}>Match Tickets</h1>
                
                {matches.filter(m => m.status === 'upcoming' && isFuture(new Date(m.match_date))).length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {matches
                      .filter(m => m.status === 'upcoming' && isFuture(new Date(m.match_date)))
                      .map((match, idx) => (
                        <motion.div 
                          key={match.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`${theme.card} rounded-3xl p-6 border ${theme.border} relative overflow-hidden`}
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-600/10 to-orange-600/10 rounded-full blur-2xl"></div>
                          
                          <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white text-xl">
                                🎫
                              </div>
                              <div>
                                <h3 className={`font-bold ${theme.text} text-lg`}>vs {match.opponent}</h3>
                                <p className="text-sm text-gray-500">{match.venue}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                              <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(match.match_date), 'EEE, MMM dd')}</span>
                              <span className="flex items-center gap-1"><Clock size={14} /> {format(new Date(match.match_date), 'HH:mm')}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-3xl font-black text-red-600">KES 200</p>
                                <p className="text-xs text-gray-500">per person</p>
                              </div>
                              <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2">
                                Buy Now <ChevronRight size={18} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <EmptyState icon={Ticket} title="No tickets available" description="Check back soon for upcoming match tickets." />
                )}

                <div className={`${theme.card} rounded-2xl p-6 border ${theme.border}`}>
                  <h3 className={`font-bold ${theme.text} mb-4`}>My Tickets</h3>
                  <div className="text-center py-8 text-gray-500">
                    <Ticket size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No tickets purchased yet</p>
                    <p className="text-sm">Buy tickets to see them here</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* NEWS TAB */}
            {activeTab === 'news' && (
              <motion.div 
                key="news"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <h1 className={`text-3xl font-black ${theme.text}`}>Club News</h1>
                
                {news.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {news.filter(n => n.is_pinned).map((item) => (
                      <motion.div 
                        key={item.id}
                        className={`md:col-span-2 ${theme.card} rounded-3xl overflow-hidden border ${theme.border} group cursor-pointer`}
                        whileHover={{ y: -4 }}
                      >
                        <div className="h-64 bg-gradient-to-br from-red-600 to-orange-600 relative overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-80" />
                          ) : (
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800')] bg-cover bg-center opacity-50"></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 p-8">
                            <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full mb-3 inline-block">Pinned</span>
                            <h2 className="text-3xl font-black text-white mb-2">{item.title}</h2>
                            <p className="text-white/80 line-clamp-2">{item.content}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {news.filter(n => !n.is_pinned).map((item, idx) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`${theme.card} rounded-2xl p-6 border ${theme.border} hover:border-red-500/50 transition-all cursor-pointer group`}
                        whileHover={{ y: -4 }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              '📰'
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                              {format(new Date(item.created_at), 'MMM dd, yyyy')}
                            </span>
                            <h3 className={`font-bold ${theme.text} mt-1 mb-2 group-hover:text-red-600 transition-colors`}>{item.title}</h3>
                            <p className="text-slate-400 line-clamp-2">{item.content}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Newspaper} title="No news yet" description="Check back soon for club updates." />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 ${theme.card} border-t ${theme.border} px-4 py-2 flex justify-around z-40`}>
        {tabs.slice(0, 5).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-3 rounded-xl flex flex-col items-center gap-1 ${activeTab === tab.id ? 'text-red-600' : theme.textMuted}`}
          >
            <tab.icon size={20} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// Empty State Component
function EmptyState({ icon: Icon, title, description }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm">{description}</p>
    </div>
  )
}