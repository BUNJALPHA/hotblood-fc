import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Play, Square, Radio, Users, Activity,
  Trophy, Clock, MessageSquare, AlertCircle,
  Camera, Smartphone
} from 'lucide-react';
import { supabase } from '../../helpers/supabase';
import type { Match, Player, MatchEvent } from '../../types/matches';

interface LiveMatchControllerProps {
  match: Match;
  onBack: () => void;
}

export default function LiveMatchController({ match, onBack }: LiveMatchControllerProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamType, setStreamType] = useState<'webrtc' | 'droidcam'>('webrtc');
  const [ourScore, setOurScore] = useState(match.our_score || 0);
  const [opponentScore, setOpponentScore] = useState(match.opponent_score || 0);
  const [matchTime, setMatchTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [eventType, setEventType] = useState('goal');
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<Array<{ user_name: string; message: string }>>([]);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPlayers = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('players')
        .select('id, name, jersey_number, position')
        .eq('status', 'active');
      
      if (data) setPlayers(data as Player[]);
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', match.id)
        .order('minute', { ascending: false });
      
      if (data) setEvents(data as MatchEvent[]);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  }, [match.id]);

  useEffect(() => {
    fetchPlayers();
    fetchEvents();
    
    // Subscribe to viewer count
    const viewerChannel = supabase
      .channel(`viewers:${match.stream_key}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'live_streams' },
        (payload: any) => {
          if (payload.new?.stream_key === match.stream_key) {
            setViewerCount(payload.new.viewer_count || 0);
          }
        }
      )
      .subscribe();

    // Subscribe to chat
    const chatChannel = supabase
      .channel(`chat:${match.stream_key}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: any) => {
          setChatMessages(prev => [payload.new, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      viewerChannel.unsubscribe();
      chatChannel.unsubscribe();
    };
  }, [match.stream_key, match.id, fetchPlayers, fetchEvents]);

  const toggleTimer = () => {
    if (isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      timerRef.current = setInterval(() => {
        setMatchTime(prev => prev + 1);
      }, 1000);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addEvent = async () => {
    if (!selectedPlayer) return;

    const player = players.find(p => p.id === selectedPlayer);
    const minute = Math.floor(matchTime / 60);

    const eventData = {
      match_id: match.id,
      event_type: eventType,
      player_id: selectedPlayer,
      minute,
      description: `${player?.name} - ${eventType} (${minute}')`
    };

    try {
      const { data } = await supabase.from('match_events').insert(eventData).select();

      if (data) {
        setEvents([data[0] as MatchEvent, ...events]);

        if (eventType === 'goal') {
          const newScore = ourScore + 1;
          setOurScore(newScore);
          await supabase.from('matches').update({ our_score: newScore }).eq('id', match.id);
        }
      }
    } catch (err) {
      console.error('Error adding event:', err);
    }

    setSelectedPlayer('');
  };

  const updateOpponentScore = async (increment: number) => {
    const newScore = Math.max(0, opponentScore + increment);
    setOpponentScore(newScore);
    try {
      await supabase.from('matches').update({ opponent_score: newScore }).eq('id', match.id);
    } catch (err) {
      console.error('Error updating score:', err);
    }
  };

  const startStream = async () => {
    setIsStreaming(true);

    const streamKey = match.stream_key || `match_${match.id}_${Date.now()}`;

    try {
      await supabase.from('live_streams').upsert({
        match_id: match.id,
        stream_key: streamKey,
        stream_type: streamType,
        is_active: true,
        started_at: new Date().toISOString(),
        viewer_count: 0
      });

      await supabase.from('matches').update({ 
        is_live: true, 
        status: 'live',
        stream_key: streamKey
      }).eq('id', match.id);
    } catch (err) {
      console.error('Error starting stream:', err);
    }
  };

  const endStream = async () => {
    setIsStreaming(false);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      await supabase.from('live_streams')
        .update({ is_active: false })
        .eq('match_id', match.id);

      await supabase.from('matches').update({ 
        is_live: false, 
        status: 'completed',
        our_score: ourScore,
        opponent_score: opponentScore
      }).eq('id', match.id);

      onBack();
    } catch (err) {
      console.error('Error ending stream:', err);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal': return '⚽';
      case 'yellow_card': return '🟨';
      case 'red_card': return '🟥';
      case 'substitution': return '🔄';
      case 'injury': return '🚑';
      default: return '•';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 md:px-6 py-4">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Live Match Control</h1>
              <p className="text-slate-400 text-sm">{match.competition} • {match.is_home ? 'Home' : 'Away'} vs {match.opponent}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isStreaming && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full animate-pulse">
                <Radio className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-bold text-sm">LIVE</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-sm">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{viewerCount} watching</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto p-4 md:p-6 grid lg:grid-cols-3 gap-6">
        {/* Main Control Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scoreboard */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl md:text-3xl font-bold mb-2 shadow-lg shadow-orange-500/20">
                  
                </div>
                <p className="font-bold text-sm md:text-base">Hot Blood FC</p>
              </div>

              <div className="text-center">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  {ourScore} - {opponentScore}
                </div>
                <div className="mt-2 px-4 py-1 bg-slate-900 rounded-full text-xl font-mono">
                  {formatTime(matchTime)}
                </div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-700 flex items-center justify-center text-3xl md:text-4xl mb-2">
                  ⚽
                </div>
                <p className="font-bold text-sm md:text-base truncate max-w-[100px]">{match.opponent}</p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={toggleTimer}
                className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
                  isTimerRunning 
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isTimerRunning ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isTimerRunning ? 'Pause' : 'Start'} Match
              </button>

              <button
                onClick={() => setShowEndConfirm(true)}
                className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold flex items-center gap-2 hover:bg-red-500/30 transition-colors"
              >
                <Square className="w-5 h-5" />
                End Match
              </button>
            </div>
          </motion.div>

          {/* Event Logger */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Log Match Event
            </h3>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50"
              >
                <option value="goal">⚽ Goal</option>
                <option value="yellow_card">🟨 Yellow Card</option>
                <option value="red_card">🟥 Red Card</option>
                <option value="substitution">🔄 Substitution</option>
                <option value="injury">🚑 Injury</option>
              </select>

              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50"
              >
                <option value="">Select Player</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    #{player.jersey_number} {player.name}
                  </option>
                ))}
              </select>

              <button
                onClick={addEvent}
                disabled={!selectedPlayer}
                className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                Log Event
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-900/30 rounded-xl">
              <span className="text-slate-400">Opponent Score:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateOpponentScore(-1)}
                  className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold transition-colors"
                >
                  -
                </button>
                <span className="text-2xl font-bold w-8 text-center">{opponentScore}</span>
                <button
                  onClick={() => updateOpponentScore(1)}
                  className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stream Controls */}
          {!isStreaming ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-500" />
                Start Live Stream
              </h3>

              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setStreamType('webrtc')}
                  className={`flex-1 p-4 rounded-xl border transition-colors ${
                    streamType === 'webrtc'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Camera className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">WebRTC</p>
                  <p className="text-sm text-slate-400">Browser streaming</p>
                </button>

                <button
                  onClick={() => setStreamType('droidcam')}
                  className={`flex-1 p-4 rounded-xl border transition-colors ${
                    streamType === 'droidcam'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Smartphone className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">DroidCam</p>
                  <p className="text-sm text-slate-400">Mobile camera</p>
                </button>
              </div>

              <button
                onClick={startStream}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Radio className="w-5 h-5" />
                Go Live
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
            >
              <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Radio className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
                  <p className="text-xl font-bold">Streaming Live</p>
                  <p className="text-slate-400">Stream Key: {match.stream_key}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Match Events */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 h-[400px] overflow-y-auto"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              Match Events
            </h3>

            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No events yet</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl">
                    <span className="text-2xl">{getEventIcon(event.event_type)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.description}</p>
                      <p className="text-xs text-slate-400">{event.minute}'</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Live Chat */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 h-[300px]"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              Live Chat
            </h3>

            <div className="space-y-2 overflow-y-auto h-[200px]">
              {chatMessages.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No messages</p>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-bold text-orange-400">{msg.user_name}:</span>
                    <span className="text-slate-300 ml-2">{msg.message}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* End Match Confirmation */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4 text-red-400">
                <AlertCircle className="w-8 h-8" />
                <h3 className="text-xl font-bold">End Match?</h3>
              </div>
              <p className="text-slate-400 mb-6">
                This will end the live stream and mark the match as completed. Final score: {ourScore} - {opponentScore}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={endStream}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors"
                >
                  End Match
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}