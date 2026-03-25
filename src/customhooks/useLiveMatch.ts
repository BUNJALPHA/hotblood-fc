import { useEffect, useState, useRef } from 'react'
import { supabase } from '../helpers/supabase'

interface LiveStream {
  id: string
  match_id: string
  stream_key: string
  is_active: boolean
  viewer_count: number
  quality: string
  started_at: string
}

export function useLiveMatch(matchId?: string) {
  const [stream, setStream] = useState<LiveStream | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)

  // Fetch stream data
  useEffect(() => {
    if (!matchId) return
    
    const fetchStream = async () => {
      const { data } = await supabase
        .from('live_streams')
        .select('*')
        .eq('match_id', matchId)
        .eq('is_active', true)
        .single()
      
      setStream(data)
      setIsLoading(false)
    }

    fetchStream()

    // Subscribe to changes
    const subscription = supabase
      .channel(`stream:${matchId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'live_streams', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setStream(payload.new as LiveStream)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [matchId])

  // Start broadcasting (Management)
  const startBroadcast = async (streamKey: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      })
      
      localStream.current = stream
      
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })
      
      peerConnection.current = pc
      
      // Add tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Create offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Save to database
      await supabase.from('stream_signals').insert({
        stream_id: streamKey,
        signal_type: 'offer',
        signal_data: offer
      })

      // Update stream status
      await supabase.from('live_streams').update({
        is_active: true,
        started_at: new Date().toISOString()
      }).eq('stream_key', streamKey)

      return stream
    } catch (err) {
      setError('Failed to start broadcast: ' + (err as Error).message)
      return null
    }
  }

  // Stop broadcasting
  const stopBroadcast = async (streamKey: string) => {
    localStream.current?.getTracks().forEach(track => track.stop())
    peerConnection.current?.close()
    
    await supabase.from('live_streams').update({
      is_active: false,
      ended_at: new Date().toISOString()
    }).eq('stream_key', streamKey)
  }

  // Join stream (Public viewer)
  const joinStream = async (streamKey: string, remoteVideo: HTMLVideoElement) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })
      
      peerConnection.current = pc
      
      // Handle remote stream
      pc.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0]
      }

      // Get offer from database
      const { data: signals } = await supabase
        .from('stream_signals')
        .select('*')
        .eq('stream_id', streamKey)
        .eq('signal_type', 'offer')
        .order('created_at', { ascending: false })
        .limit(1)

      if (signals && signals.length > 0) {
        await pc.setRemoteDescription(new RTCSessionDescription(signals[0].signal_data))
        
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        await supabase.from('stream_signals').insert({
          stream_id: streamKey,
          signal_type: 'answer',
          signal_data: answer
        })
      }

      // Increment viewer count
      await supabase.rpc('increment_viewer_count', { stream_key: streamKey })

    } catch (err) {
      setError('Failed to join stream: ' + (err as Error).message)
    }
  }

  return {
    stream,
    isLoading,
    error,
    startBroadcast,
    stopBroadcast,
    joinStream,
    localStream: localStream.current
  }
}