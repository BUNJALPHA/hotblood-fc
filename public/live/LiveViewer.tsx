import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, Users, MessageSquare, Heart, Share2, Send,
  Radio, Wifi, WifiOff, AlertCircle, Sun, Moon
} from 'lucide-react'
import { supabase } from '../../src/helpers/supabase'

interface LiveMatch {
  id: string
  match_id: string
  stream_key: string
  stream_type: 'webrtc' | 'droidcam'
  stream_url: string | null
  is_active: boolean
  viewer_count: number
  started_at: string
}

interface Match {
  id: string
  opponent: string
  our_score: number | null
  opponent_score: number | null
  competition: string
  is_home: boolean
}

interface ChatMessage {
  id: string
  user_id: string
  user_name: string
  message: string
  created_at: string
}

export default function LiveViewer() {
  const [streams, setStreams] = useState<LiveMatch[]>([])
  const [selectedStream, setSelectedStream] = useState<LiveMatch | null>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [likes, setLikes] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting')
  const [error, setError] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Use ref for auto-select prevention - this ensures the polling function always sees the latest value
  const hasAutoSelected = useRef(false)
  const isOnListView = useRef(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const droidCamImgRef = useRef<HTMLImageElement>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const droidCamInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const toggleTheme = () => setIsDarkMode(!isDarkMode)

  // CRITICAL FIX: Define fetchActiveStreams inside useEffect or use refs to avoid stale closure
  useEffect(() => {
    const fetchActiveStreams = async () => {
      const { data } = await supabase
        .from('live_streams')
        .select('*')
        .eq('is_active', true)
        .order('started_at', { ascending: false })

      setStreams(data || [])

      // Only auto-select if:
      // 1. There are streams
      // 2. No stream currently selected (we're on list view)
      // 3. We haven't already auto-selected before (hasAutoSelected.current === false)
      // 4. We're still on initial load (isOnListView.current === true)
      if (data && data.length > 0 && !selectedStream && !hasAutoSelected.current && isOnListView.current) {
        setSelectedStream(data[0])
        hasAutoSelected.current = true
        isOnListView.current = false
      }
    }

    // Fetch immediately
    fetchActiveStreams()

    // Set up polling - recreate interval when selectedStream changes
    const interval = setInterval(fetchActiveStreams, 5000)
    pollingInterval.current = interval

    return () => clearInterval(interval)
  }, [selectedStream]) // Dependency on selectedStream ensures fresh closure

  // Join selected stream
  useEffect(() => {
    if (selectedStream) {
      fetchMatchDetails()
      joinStream()
      fetchChatMessages()
      startViewerHeartbeat()
      subscribeToChat()
      isOnListView.current = false
    } else {
      isOnListView.current = true
    }
    return () => {
      leaveStream()
    }
  }, [selectedStream])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSelectStream = (stream: LiveMatch) => {
    // User explicitly selected a stream
    hasAutoSelected.current = true // Prevent future auto-selects
    isOnListView.current = false
    setSelectedStream(stream)
  }

  const handleBackToStreams = () => {
    // Go back to list view
    setSelectedStream(null)
    isOnListView.current = true
    // CRITICAL: Keep hasAutoSelected.current = true so we don't auto-select again
    // Only reset the view state
    setMatch(null)
    setChatMessages([])
    setConnectionStatus('connecting')
    setError('')
  }

  const fetchMatchDetails = async () => {
    if (!selectedStream) return
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('id', selectedStream.match_id)
      .single()
    setMatch(data)
  }

  const joinStream = async () => {
    if (!selectedStream) return

    setConnectionStatus('connecting')
    setError('')

    try {
      if (selectedStream.stream_type === 'droidcam') {
        setConnectionStatus('connected')

        if (droidCamInterval.current) clearInterval(droidCamInterval.current)
        droidCamInterval.current = setInterval(() => {
          if (droidCamImgRef.current && selectedStream.stream_url) {
            droidCamImgRef.current.src = `${selectedStream.stream_url}?${Date.now()}`
          }
        }, 100)

      } else {
        await joinWebRTC()
      }

      await supabase.rpc('increment_viewer_count', { 
        stream_key: selectedStream.stream_key 
      })

    } catch (err) {
      setError('Failed to connect to stream')
      setConnectionStatus('failed')
    }
  }

  const joinWebRTC = async () => {
    if (!selectedStream || !videoRef.current) return

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    peerConnection.current = pc

    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0]
        setConnectionStatus('connected')
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        setConnectionStatus('failed')
        setError('Connection failed')
      }
    }

    const { data: signals } = await supabase
      .from('stream_signals')
      .select('*')
      .eq('stream_id', selectedStream.stream_key)
      .eq('signal_type', 'offer')
      .order('created_at', { ascending: false })
      .limit(1)

    if (signals && signals.length > 0) {
      await pc.setRemoteDescription(new RTCSessionDescription(signals[0].signal_data))

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      await supabase.from('stream_signals').insert({
        stream_id: selectedStream.stream_key,
        signal_type: 'answer',
        signal_data: answer
      })

      const { data: candidates } = await supabase
        .from('stream_signals')
        .select('*')
        .eq('stream_id', selectedStream.stream_key)
        .eq('signal_type', 'ice-candidate')

      candidates?.forEach(c => {
        pc.addIceCandidate(new RTCIceCandidate(c.signal_data))
      })
    }
  }

  const leaveStream = async () => {
    if (droidCamInterval.current) {
      clearInterval(droidCamInterval.current)
    }

    peerConnection.current?.close()

    if (selectedStream) {
      await supabase.rpc('decrement_viewer_count', { 
        stream_key: selectedStream.stream_key 
      })
    }
  }

  const startViewerHeartbeat = () => {
    const interval = setInterval(async () => {
      if (!selectedStream) {
        clearInterval(interval)
        return
      }
    }, 30000)
  }

  const fetchChatMessages = async () => {
    if (!selectedStream) return

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('stream_id', selectedStream.stream_key)
      .order('created_at', { ascending: true })
      .limit(50)

    setChatMessages(data || [])
  }

  const subscribeToChat = () => {
    if (!selectedStream) return

    const channel = supabase
      .channel(`chat:${selectedStream.stream_key}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `stream_id=eq.${selectedStream.stream_key}` },
        (payload) => {
          setChatMessages(prev => [...prev, payload.new as ChatMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedStream) return

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('chat_messages').insert({
      stream_id: selectedStream.stream_key,
      user_id: user?.id || 'anonymous',
      user_name: user?.email?.split('@')[0] || 'Fan',
      message: newMessage
    })

    setNewMessage('')
  }

  const handleLike = async () => {
    setLikes(prev => prev + 1)
  }

  // Theme-based class helpers
  const themeClasses = {
    bg: isDarkMode ? 'bg-[#0a0f1c]' : 'bg-gray-50',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    card: isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/80 border-gray-200/50',
    cardSolid: isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200',
    header: isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-gray-200',
    input: isDarkMode ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900',
    secondary: isDarkMode ? 'text-slate-400' : 'text-gray-500',
    accent: isDarkMode ? 'text-slate-300' : 'text-gray-600',
    hover: isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100',
    overlay: isDarkMode ? 'bg-slate-900/50' : 'bg-gray-100/50',
    gradientText: 'bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent'
  }

  // Show stream list if no stream selected
  if (!selectedStream) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} p-6 transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black">
              Live <span className={themeClasses.gradientText}>Matches</span>
            </h1>
            <button 
              onClick={toggleTheme}
              className={`p-3 rounded-full ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-gray-100'} border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} transition-all duration-300 shadow-lg`}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
          </div>

          {streams.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {streams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className={`${themeClasses.card} backdrop-blur-2xl border rounded-2xl p-6 cursor-pointer hover:border-red-500/50 transition-all duration-300 shadow-xl`}
                  onClick={() => handleSelectStream(stream)}
                >
                  <div className={`aspect-video ${isDarkMode ? 'bg-slate-900' : 'bg-gray-200'} rounded-xl mb-4 flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-orange-600/20" />
                    <Play className={`w-16 h-16 ${isDarkMode ? 'text-white/50' : 'text-gray-400'}`} />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                      ● LIVE
                    </div>
                    <div className={`absolute bottom-3 right-3 px-2 py-1 ${isDarkMode ? 'bg-slate-900/80' : 'bg-white/80'} rounded-lg text-xs ${themeClasses.text} flex items-center gap-1 backdrop-blur-sm`}>
                      {stream.stream_type === 'droidcam' ? '📱 DroidCam' : '🎥 WebRTC'}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Match in Progress</h3>
                  <div className={`flex items-center gap-4 text-sm ${themeClasses.secondary}`}>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {stream.viewer_count} watching
                    </span>
                    <span>Started {new Date(stream.started_at).toLocaleTimeString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className={`w-24 h-24 rounded-full ${themeClasses.overlay} flex items-center justify-center mx-auto mb-4`}>
                <Radio className={`w-12 h-12 ${themeClasses.secondary}`} />
              </div>
              <h3 className="text-xl font-bold mb-2">No Live Matches</h3>
              <p className={themeClasses.secondary}>Check back later for live streams</p>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300`}>
      {/* Header */}
      <div className={`${themeClasses.header} backdrop-blur-xl border-b px-6 py-4 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={handleBackToStreams}
            className={`${themeClasses.secondary} hover:text-current transition-colors flex items-center gap-2 font-medium`}
          >
            ← Back to streams
          </button>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} transition-colors`}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              connectionStatus === 'connected' 
                ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600')
                : (isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600')
            }`}>
              {connectionStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase">{connectionStatus}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 font-bold">LIVE</span>
            </div>
            <div className={`flex items-center gap-2 ${themeClasses.secondary}`}>
              <Users className="w-5 h-5" />
              <span>{selectedStream.viewer_count}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`relative aspect-video ${isDarkMode ? 'bg-slate-900' : 'bg-gray-900'} rounded-2xl overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-gray-300'} shadow-2xl`}>
            {selectedStream.stream_type === 'droidcam' ? (
              <>
                <img
                  ref={droidCamImgRef}
                  src={selectedStream.stream_url || ''}
                  alt="DroidCam Feed"
                  className="w-full h-full object-cover"
                  onError={() => setError('DroidCam connection lost')}
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                  DroidCam
                </div>
              </>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {selectedStream.stream_type === 'webrtc' && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                LIVE
              </div>
            )}
          </div>

          {/* Match Info */}
          {match && (
            <div className={`${themeClasses.card} backdrop-blur-2xl border rounded-2xl p-6 transition-colors duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <img src="/images/logo.png" alt="Hot Blood" className="w-16 h-16 rounded-full border-2 border-red-600 mb-2" />
                    <p className="font-bold">Hot Blood FC</p>
                  </div>
                  <div className="text-center px-8">
                    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                      {match.our_score ?? 0} - {match.opponent_score ?? 0}
                    </p>
                    <p className={`text-sm ${themeClasses.secondary} mt-1`}>{match.competition}</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} flex items-center justify-center text-2xl mb-2`}>
                      ⚽
                    </div>
                    <p className="font-bold">{match.opponent}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleLike}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full text-pink-400 hover:bg-pink-500/30 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${likes > 0 && 'fill-current'}`} /> {likes}
                </button>
                <button className={`flex items-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-full transition-colors`}>
                  <Share2 className="w-5 h-5" /> Share
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className={`${themeClasses.card} backdrop-blur-2xl border rounded-2xl flex flex-col h-[600px] transition-colors duration-300`}>
          <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200/50'}`}>
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" /> Live Chat
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <p className={`text-center ${themeClasses.secondary} py-8`}>No messages yet. Be the first!</p>
            ) : (
              chatMessages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xs font-bold text-white">
                    {msg.user_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{msg.user_name}</span>
                      <span className={`text-xs ${themeClasses.secondary}`}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={`text-sm ${themeClasses.accent}`}>{msg.message}</p>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} className={`p-4 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200/50'}`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className={`flex-1 ${themeClasses.input} border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-colors`}
              />
              <button 
                type="submit"
                className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl text-white hover:opacity-90 transition-opacity shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}