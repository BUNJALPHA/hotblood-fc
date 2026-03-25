import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Video, Mic, MicOff, VideoOff, MonitorUp, 
  PhoneOff, Users, Settings, AlertCircle, CheckCircle,
  Radio, Wifi, WifiOff, Smartphone, Link, Copy, ExternalLink,
  Camera, RefreshCw, Maximize2
} from 'lucide-react'
import { supabase } from '../../src/helpers/supabase'

export default function Broadcaster() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamMode, setStreamMode] = useState<'droidcam' | 'webrtc' | 'screen'>('droidcam')
  const [droidCamIp, setDroidCamIp] = useState('')
  const [streamKey, setStreamKey] = useState('')
  const [matchId, setMatchId] = useState('')
  const [matches, setMatches] = useState<any[]>([])
  const [viewerCount, setViewerCount] = useState(0)
  const [error, setError] = useState('')
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting')
  const [droidCamConnected, setDroidCamConnected] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const droidCamImgRef = useRef<HTMLImageElement>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const droidCamInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchUpcomingMatches()
    return () => {
      stopStream()
    }
  }, [])

  const fetchUpcomingMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'upcoming')
      .order('match_date', { ascending: true })
    setMatches(data || [])
  }

  // DroidCam Connection Test
  const testDroidCamConnection = async () => {
    if (!droidCamIp) {
      setError('Please enter DroidCam IP address')
      return false
    }

    setError('')
    setConnectionStatus('connecting')

    try {
      // Try to fetch a frame from DroidCam
      const testUrl = `http://${droidCamIp}/video`
      const response = await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' })
      
      setDroidCamConnected(true)
      setConnectionStatus('connected')
      return true
    } catch (err) {
      setError('Cannot connect to DroidCam. Check IP and ensure phone is on same WiFi')
      setConnectionStatus('failed')
      return false
    }
  }

  // Start DroidCam Stream
  const startDroidCamStream = async () => {
    if (!matchId) {
      setError('Please select a match')
      return
    }

    if (!droidCamIp) {
      setError('Please enter DroidCam IP address from your phone')
      return
    }

    setError('')
    const key = `droidcam_${matchId}_${Date.now()}`
    setStreamKey(key)

    // Save stream to database
    const { error: dbError } = await supabase.from('live_streams').insert({
      match_id: matchId,
      stream_key: key,
      stream_type: 'droidcam',
      stream_url: `http://${droidCamIp}/video`,
      is_active: true,
      started_at: new Date().toISOString(),
      viewer_count: 0
    })

    if (dbError) {
      setError('Failed to create stream: ' + dbError.message)
      return
    }

    // Update match status
    await supabase.from('matches').update({ 
      status: 'live',
      stream_key: key 
    }).eq('id', matchId)

    setIsStreaming(true)
    setDroidCamConnected(true)
    startViewerCountPolling(key)
    
    // Auto-refresh DroidCam feed to prevent freezing
    droidCamInterval.current = setInterval(() => {
      if (droidCamImgRef.current) {
        droidCamImgRef.current.src = `http://${droidCamIp}/video?${Date.now()}`
      }
    }, 100)
  }

  // WebRTC Stream (Backup method)
  const startWebRTCStream = async () => {
    if (!matchId) {
      setError('Please select a match')
      return
    }

    setError('')
    const key = `webrtc_${matchId}_${Date.now()}`
    setStreamKey(key)

    try {
      setConnectionStatus('connecting')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      localStream.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      })

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      pc.onicecandidate = async (event) => {
        if (event.candidate && streamKey) {
          await supabase.from('stream_signals').insert({
            stream_id: streamKey,
            signal_type: 'ice-candidate',
            signal_data: event.candidate.toJSON()
          })
        }
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setConnectionStatus('connected')
        } else if (pc.connectionState === 'failed') {
          setConnectionStatus('failed')
        }
      }

      peerConnection.current = pc

      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      })
      await pc.setLocalDescription(offer)

      await supabase.from('stream_signals').insert({
        stream_id: streamKey,
        signal_type: 'offer',
        signal_data: offer
      })

      // Save to database
      await supabase.from('live_streams').insert({
        match_id: matchId,
        stream_key: key,
        stream_type: 'webrtc',
        is_active: true,
        started_at: new Date().toISOString(),
        viewer_count: 0
      })

      await supabase.from('matches').update({ 
        status: 'live',
        stream_key: key 
      }).eq('id', matchId)

      setIsStreaming(true)
      startViewerCountPolling(key)
      pollForAnswers(pc)

    } catch (err) {
      setError('Failed to access camera: ' + (err as Error).message)
      setConnectionStatus('failed')
    }
  }

  const pollForAnswers = (pc: RTCPeerConnection) => {
    pollingInterval.current = setInterval(async () => {
      if (!isStreaming) return

      const { data: signals } = await supabase
        .from('stream_signals')
        .select('*')
        .eq('stream_id', streamKey)
        .eq('signal_type', 'answer')
        .order('created_at', { ascending: false })
        .limit(1)

      if (signals && signals.length > 0 && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(signals[0].signal_data))
      }
    }, 2000)
  }

  const startStream = async () => {
    if (streamMode === 'droidcam') {
      await startDroidCamStream()
    } else {
      await startWebRTCStream()
    }
  }

  const stopStream = async () => {
    // Stop DroidCam interval
    if (droidCamInterval.current) {
      clearInterval(droidCamInterval.current)
    }

    // Stop WebRTC
    localStream.current?.getTracks().forEach(track => track.stop())
    peerConnection.current?.close()
    
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
    }

    if (streamKey) {
      await supabase.from('live_streams').update({
        is_active: false,
        ended_at: new Date().toISOString()
      }).eq('stream_key', streamKey)

      await supabase.from('matches').update({ 
        status: 'completed' 
      }).eq('stream_key', streamKey)
    }

    setIsStreaming(false)
    setStreamKey('')
    setViewerCount(0)
    setConnectionStatus('connecting')
    setDroidCamConnected(false)
  }

  const startViewerCountPolling = (key: string) => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('live_streams')
        .select('viewer_count')
        .eq('stream_key', key)
        .single()

      if (data) {
        setViewerCount(data.viewer_count)
      }
    }, 5000)
    
    pollingInterval.current = interval
  }

  const copyStreamUrl = () => {
    const url = `${window.location.origin}/live/${streamKey}`
    navigator.clipboard.writeText(url)
    alert('Stream URL copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black">
              Live <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Broadcaster</span>
            </h1>
            <p className="text-slate-400">Stream matches live to fans using DroidCam or WebRTC</p>
          </div>
          
          {isStreaming && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="text-red-400 font-bold">ON AIR</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="font-bold">{viewerCount} viewers</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        {/* Stream Mode Selection */}
        {!isStreaming && (
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setStreamMode('droidcam')}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                streamMode === 'droidcam' 
                  ? 'border-orange-500 bg-orange-500/10' 
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
              }`}
            >
              <Smartphone className={`w-10 h-10 ${streamMode === 'droidcam' ? 'text-orange-400' : 'text-slate-400'}`} />
              <div className="text-center">
                <p className={`font-bold ${streamMode === 'droidcam' ? 'text-white' : 'text-slate-300'}`}>DroidCam</p>
                <p className="text-xs text-slate-500">Use phone as wireless camera</p>
              </div>
            </button>

            <button
              onClick={() => setStreamMode('webrtc')}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                streamMode === 'webrtc' 
                  ? 'border-orange-500 bg-orange-500/10' 
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
              }`}
            >
              <Camera className={`w-10 h-10 ${streamMode === 'webrtc' ? 'text-orange-400' : 'text-slate-400'}`} />
              <div className="text-center">
                <p className={`font-bold ${streamMode === 'webrtc' ? 'text-white' : 'text-slate-300'}`}>WebRTC</p>
                <p className="text-xs text-slate-500">Use laptop webcam</p>
              </div>
            </button>

            <button
              onClick={() => setStreamMode('screen')}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 opacity-50 cursor-not-allowed`}
            >
              <MonitorUp className="w-10 h-10 text-slate-400" />
              <div className="text-center">
                <p className="font-bold text-slate-300">Screen Share</p>
                <p className="text-xs text-slate-500">Coming soon</p>
              </div>
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Video Preview */}
            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
              {!isStreaming ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Camera preview will appear here</p>
                    {streamMode === 'droidcam' && (
                      <p className="text-sm text-slate-500 mt-2">Enter DroidCam IP and click Start Streaming</p>
                    )}
                  </div>
                </div>
              ) : streamMode === 'droidcam' ? (
                <>
                  <img
                    ref={droidCamImgRef}
                    src={`http://${droidCamIp}/video`}
                    alt="DroidCam Feed"
                    className="w-full h-full object-cover"
                    onError={() => setError('DroidCam connection lost. Check your phone.')}
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    LIVE - DroidCam
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
              
              {isStreaming && streamMode === 'webrtc' && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                  LIVE
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {streamMode === 'webrtc' && (
                <>
                  <motion.button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    disabled={!isStreaming}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-4 rounded-full transition-all ${audioEnabled ? 'bg-slate-700 text-white' : 'bg-red-500/20 text-red-400'}`}
                  >
                    {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    disabled={!isStreaming}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-4 rounded-full transition-all ${videoEnabled ? 'bg-slate-700 text-white' : 'bg-red-500/20 text-red-400'}`}
                  >
                    {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </motion.button>
                </>
              )}

              {!isStreaming ? (
                <motion.button
                  onClick={startStream}
                  disabled={!matchId || (streamMode === 'droidcam' && !droidCamIp)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full text-white font-bold shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Radio className="w-5 h-5" /> Start Streaming
                </motion.button>
              ) : (
                <motion.button
                  onClick={stopStream}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-red-600 rounded-full text-white font-bold shadow-lg hover:bg-red-700 transition-all flex items-center gap-2"
                >
                  <PhoneOff className="w-5 h-5" /> End Stream
                </motion.button>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          <div className="space-y-4">
            <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" /> Stream Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Select Match *</label>
                  <select
                    value={matchId}
                    onChange={(e) => setMatchId(e.target.value)}
                    disabled={isStreaming}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Choose a match...</option>
                    {matches.map(match => (
                      <option key={match.id} value={match.id}>
                        vs {match.opponent} - {new Date(match.match_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {streamMode === 'droidcam' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">DroidCam IP Address *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={droidCamIp}
                        onChange={(e) => setDroidCamIp(e.target.value)}
                        placeholder="192.168.1.5:4747"
                        disabled={isStreaming}
                        className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none disabled:opacity-50"
                      />
                      {!isStreaming && (
                        <button
                          onClick={testDroidCamConnection}
                          className="px-4 py-2 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"
                          title="Test Connection"
                        >
                          <Link className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Enter IP shown in DroidCam app</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Stream Quality</label>
                  <select
                    disabled={isStreaming}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none disabled:opacity-50"
                  >
                    <option>720p @ 30fps</option>
                    <option>1080p @ 30fps</option>
                    <option>720p @ 60fps</option>
                  </select>
                </div>

                {isStreaming && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"
                  >
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-bold">Stream Active</span>
                    </div>
                    <p className="text-xs text-slate-400 break-all mb-3">Key: {streamKey}</p>
                    <button
                      onClick={copyStreamUrl}
                      className="w-full py-2 bg-slate-800/50 rounded-lg text-sm text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" /> Copy Stream Link
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* DroidCam Instructions */}
            {streamMode === 'droidcam' && !isStreaming && (
              <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-orange-500" /> Setup Guide
                </h3>
                <ol className="space-y-3 text-sm text-slate-400 list-decimal list-inside">
                  <li>Install DroidCam app on your phone</li>
                  <li>Connect phone & laptop to same WiFi</li>
                  <li>Open DroidCam app, note the IP address</li>
                  <li>Enter IP above and click Start Streaming</li>
                </ol>
                <a 
                  href="https://www.dev47apps.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm"
                >
                  <ExternalLink className="w-4 h-4" /> Download DroidCam
                </a>
              </div>
            )}

            <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Tips</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  Use stable internet (min 5Mbps upload)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  Keep phone on charger during stream
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  Use phone tripod for stable footage
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  Test connection before going live
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}