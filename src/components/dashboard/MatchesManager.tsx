import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Trophy, Plus, Clock, Activity, TrendingUp, Radio
} from 'lucide-react';
import { supabase } from '../../helpers/supabase';
import type { Match, League, ViewMode, MatchStatus } from '../../types/matches';
import MatchScheduler from './MatchScheduler';
import LiveMatchController from './LiveMatchController';
import MatchSummary from './MatchSummary';
import PlayerAttendance from './PlayerAttendance';
import LeagueManager from './LeagueManager';
import MatchCard from './MatchCard';

interface Stats {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  upcoming: number;
  live: number;
}

export default function MatchesManager() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalMatches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    upcoming: 0,
    live: 0
  });

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false });

      if (error) throw error;
      if (data) {
        setMatches(data as Match[]);
        updateLiveStatus(data as Match[]);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLeagues = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('leagues')
        .select('*')
        .eq('status', 'active');
      
      if (data) setLeagues(data as League[]);
    } catch (err) {
      console.error('Error fetching leagues:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data: allMatches, error } = await supabase
        .from('matches')
        .select('our_score, opponent_score, status');

      if (error) throw error;
      if (allMatches) {
        const matches = allMatches as Match[];
        const completed = matches.filter(m => m.status === 'completed');
        const wins = completed.filter(m => (m.our_score || 0) > (m.opponent_score || 0)).length;
        const draws = completed.filter(m => (m.our_score || 0) === (m.opponent_score || 0)).length;
        const losses = completed.filter(m => (m.our_score || 0) < (m.opponent_score || 0)).length;

        setStats({
          totalMatches: matches.length,
          wins,
          draws,
          losses,
          upcoming: matches.filter(m => m.status === 'upcoming').length,
          live: matches.filter(m => m.status === 'live').length
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const updateLiveStatus = (matchData: Match[]) => {
    const now = new Date();
    matchData.forEach((match: Match) => {
      if (match.status === 'live' && !match.is_live) {
        supabase.from('matches').update({ is_live: true }).eq('id', match.id);
      }
    });
  };

  useEffect(() => {
    fetchMatches();
    fetchLeagues();
    fetchStats();
  }, [fetchMatches, fetchLeagues, fetchStats]);

  const handleMatchSelect = (match: Match, mode: Exclude<ViewMode, 'list' | 'leagues'>) => {
    setSelectedMatch(match);
    setViewMode(mode);
  };

  const handleBack = () => {
    setSelectedMatch(null);
    setViewMode('list');
    fetchMatches();
    fetchStats();
  };

  const getStatusColor = (status: MatchStatus): string => {
    switch (status) {
      case 'live': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'completed': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'upcoming': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  if (viewMode === 'schedule') {
    return <MatchScheduler onBack={handleBack} editMatch={selectedMatch} />;
  }

  if (viewMode === 'live' && selectedMatch) {
    return <LiveMatchController match={selectedMatch} onBack={handleBack} />;
  }

  if (viewMode === 'summary' && selectedMatch) {
    return <MatchSummary match={selectedMatch} onBack={handleBack} />;
  }

  if (viewMode === 'attendance' && selectedMatch) {
    return <PlayerAttendance match={selectedMatch} onBack={handleBack} />;
  }

  if (viewMode === 'leagues') {
    return <LeagueManager onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 tracking-tight">
                Match <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Management</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base">
                Schedule, control live matches, and manage team performance
              </p>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode('leagues')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors text-sm md:text-base"
              >
                <Trophy className="w-5 h-5 text-orange-400" />
                <span className="hidden sm:inline">Leagues</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode('schedule')}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-semibold shadow-lg shadow-orange-500/25 text-sm md:text-base whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Schedule Match
              </motion.button>
            </div>
          </div>

          {/* Stats Grid - Optimized for 4K */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {[
              { label: 'Total Matches', value: stats.totalMatches, icon: Activity, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
              { label: 'Wins', value: stats.wins, icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
              { label: 'Draws', value: stats.draws, icon: Activity, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
              { label: 'Losses', value: stats.losses, icon: Activity, color: 'text-red-400', bgColor: 'bg-red-400/10' },
              { label: 'Upcoming', value: stats.upcoming, icon: Calendar, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
              { label: 'Live Now', value: stats.live, icon: Radio, color: 'text-red-500', bgColor: 'bg-red-500/10', animate: true },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${stat.bgColor} backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-all duration-300`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color} ${stat.animate ? 'animate-pulse' : ''}`} />
                  <span className="text-slate-400 text-xs md:text-sm font-medium">{stat.label}</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold tracking-tight">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Matches List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-orange-500" />
              Recent & Upcoming Matches
            </h2>
            <div className="flex gap-2 flex-wrap">
              {['all', 'upcoming', 'live', 'completed'].map((filter) => (
                <button
                  key={filter}
                  className="px-3 py-1.5 text-xs md:text-sm rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 capitalize transition-colors"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : matches.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-slate-800/20 rounded-2xl border border-slate-700/50"
            >
              <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Matches Scheduled</h3>
              <p className="text-slate-400 mb-4">Start by scheduling your first match</p>
              <button
                onClick={() => setViewMode('schedule')}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold transition-colors"
              >
                Schedule Match
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-3 md:gap-4">
              <AnimatePresence mode="popLayout">
                {matches.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    index={index}
                    onSelect={handleMatchSelect}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}