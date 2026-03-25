import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, FileText, Trophy, Star, Save, 
  CheckCircle, AlertCircle
} from 'lucide-react';
import { supabase } from '../../helpers/supabase';
import type { Match, Player, MatchEvent } from '../../types/matches';

interface MatchSummaryProps {
  match: Match;
  onBack: () => void;
}

interface PlayerStats extends Player {
  goals: number;
  yellow_cards: number;
  red_cards: number;
}

interface MatchStats {
  possession: number;
  shots: number;
  shots_on_target: number;
  corners: number;
  fouls: number;
  passes: number;
  pass_accuracy: number;
}

export default function MatchSummary({ match, onBack }: MatchSummaryProps) {
  const [summary, setSummary] = useState(match.summary || '');
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [stats] = useState<MatchStats>({
    possession: 50,
    shots: 0,
    shots_on_target: 0,
    corners: 0,
    fouls: 0,
    passes: 0,
    pass_accuracy: 0
  });
  const [manOfTheMatch, setManOfTheMatch] = useState('');
  const [visibleFor24h, setVisibleFor24h] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchPlayers = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('players')
        .select('id, name, jersey_number, position')
        .eq('status', 'active');

      if (data) {
        setPlayers(data.map((p: Player) => ({ ...p, goals: 0, yellow_cards: 0, red_cards: 0 })));
      }
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', match.id);

      if (data) {
        const playerStats: Record<string, Partial<PlayerStats>> = {};

        (data as MatchEvent[]).forEach((event) => {
          if (!playerStats[event.player_id]) {
            playerStats[event.player_id] = { goals: 0, yellow_cards: 0, red_cards: 0 };
          }

          if (event.event_type === 'goal') playerStats[event.player_id].goals = (playerStats[event.player_id].goals || 0) + 1;
          if (event.event_type === 'yellow_card') playerStats[event.player_id].yellow_cards = (playerStats[event.player_id].yellow_cards || 0) + 1;
          if (event.event_type === 'red_card') playerStats[event.player_id].red_cards = (playerStats[event.player_id].red_cards || 0) + 1;
        });

        setPlayers(prev => prev.map(p => ({
          ...p,
          ...playerStats[p.id]
        })));
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  }, [match.id]);

  useEffect(() => {
    fetchPlayers();
    fetchEvents();
  }, [fetchPlayers, fetchEvents]);

  const generateAISummary = () => {
    const result = (match.our_score || 0) > (match.opponent_score || 0) ? 'victory' 
      : (match.our_score || 0) < (match.opponent_score || 0) ? 'defeat' : 'draw';

    const topScorer = players.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals)[0];

    const aiGenerated = `Hot Blood FC ${result === 'victory' ? 'secured a convincing' : result === 'defeat' ? 'suffered a' : 'played out a'} ${result} against ${match.opponent} in ${match.competition} action.

The match ended ${match.our_score}-${match.opponent_score} ${match.is_home ? 'at home' : 'away'}.

${topScorer ? `${topScorer.name} was the standout performer${topScorer.goals > 1 ? ` with ${topScorer.goals} goals` : ''}.` : 'The team put in a solid performance.'}

Key moments included disciplined defending and creative attacking play. The squad showed great determination throughout the 90 minutes.`;

    setSummary(aiGenerated);
  };

  const saveSummary = async () => {
    setSaving(true);

    const visibleUntil = visibleFor24h 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null;

    try {
      await supabase.from('matches').update({
        summary,
        summary_visible_until: visibleUntil
      }).eq('id', match.id);

      // Create notification for fans
      await supabase.from('notifications').insert({
        type: 'summary',
        title: `Match Summary: Hot Blood FC vs ${match.opponent}`,
        message: summary.substring(0, 100) + '...',
        recipient_type: 'fans',
        match_id: match.id
      });

      setSuccess('Summary saved and published!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving summary:', err);
    } finally {
      setSaving(false);
    }
  };

  const isWin = (match.our_score || 0) > (match.opponent_score || 0);
  const isDraw = (match.our_score || 0) === (match.opponent_score || 0);

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black">
              Match <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Summary</span>
            </h1>
            <p className="text-slate-400">vs {match.opponent} • {match.competition}</p>
          </div>
        </motion.div>

        {/* Score Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-slate-800/40 backdrop-blur-xl border rounded-2xl p-8 mb-6 text-center ${
            isWin ? 'border-emerald-500/30' : isDraw ? 'border-yellow-500/30' : 'border-red-500/30'
          }`}
        >
          <div className={`text-5xl md:text-6xl font-black mb-2 ${
            isWin ? 'text-emerald-400' : isDraw ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {match.our_score} - {match.opponent_score}
          </div>
          <p className={`text-xl font-bold ${
            isWin ? 'text-emerald-400' : isDraw ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {isWin ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
          </p>
        </motion.div>

        {/* Player Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            Player Performances
          </h3>

          <div className="grid gap-3">
            {players.filter(p => p.goals > 0 || p.yellow_cards > 0 || p.red_cards > 0).map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-bold">{player.name}</span>
                  <span className="text-slate-500">#{player.jersey_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  {player.goals > 0 && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">
                      ⚽ {player.goals}
                    </span>
                  )}
                  {player.yellow_cards > 0 && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                      🟨 {player.yellow_cards}
                    </span>
                  )}
                  {player.red_cards > 0 && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">
                      🟥 {player.red_cards}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {players.filter(p => p.goals > 0 || p.yellow_cards > 0 || p.red_cards > 0).length === 0 && (
              <p className="text-slate-500 text-center py-4">No notable player events recorded</p>
            )}
          </div>
        </motion.div>

        {/* Summary Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Match Report
            </h3>
            <button
              onClick={generateAISummary}
              className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl text-sm font-medium hover:bg-purple-500/30 transition-colors"
            >
              ✨ Generate with AI
            </button>
          </div>

          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={8}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 resize-none"
            placeholder="Write match summary..."
          />

          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleFor24h}
                onChange={(e) => setVisibleFor24h(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-slate-400">Show in Public Dashboard for 24 hours</span>
            </label>
          </div>
        </motion.div>

        {/* Man of the Match */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Man of the Match
          </h3>

          <select
            value={manOfTheMatch}
            onChange={(e) => setManOfTheMatch(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50"
          >
            <option value="">Select player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} (#{player.jersey_number})
              </option>
            ))}
          </select>
        </motion.div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400"
          >
            <CheckCircle className="w-5 h-5" />
            {success}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold border border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveSummary}
            disabled={saving || !summary.trim()}
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Publish Summary
          </button>
        </div>
      </div>
    </div>
  );
}