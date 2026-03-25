import { motion } from 'framer-motion';
import { 
  MapPin, Calendar, ChevronRight, 
  Radio, FileText, ClipboardCheck, MoreVertical 
} from 'lucide-react';
import type { Match, MatchStatus, ViewMode } from '../../types/matches';

interface MatchCardProps {
  match: Match;
  index: number;
  onSelect: (match: Match, mode: Exclude<ViewMode, 'list' | 'leagues'>) => void;
  getStatusColor: (status: MatchStatus) => string;
}

export default function MatchCard({ match, index, onSelect, getStatusColor }: MatchCardProps) {
  const isUpcoming = match.status === 'upcoming';
  const isLive = match.status === 'live' || match.is_live;
  const isCompleted = match.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 md:p-6 hover:border-orange-500/50 transition-all duration-300"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Match Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full">
          {/* Status Indicator */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap ${getStatusColor(match.status)}`}>
            {isLive ? '● Live' : match.status}
          </div>

          {/* Teams */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-bold text-lg md:text-xl mb-1 shadow-lg shadow-orange-500/20">
                <img src="/images/logo.png" />
              </div>
              <span className="text-xs text-slate-400 font-medium">Hot Blood</span>
            </div>

            <div className="text-center px-4">
              {isUpcoming ? (
                <span className="text-2xl md:text-3xl font-bold text-slate-500">VS</span>
              ) : (
                <span className="text-3xl md:text-4xl font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  {match.our_score ?? 0} - {match.opponent_score ?? 0}
                </span>
              )}
            </div>

            <div className="text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-700 flex items-center justify-center text-2xl mb-1">
                ⚽
              </div>
              <span className="text-xs text-slate-400 font-medium truncate max-w-[80px]">{match.opponent}</span>
            </div>
          </div>

          {/* Match Details */}
          <div className="hidden md:flex flex-col gap-1 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(match.match_date).toLocaleDateString()} at {match.match_time}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {match.venue || (match.is_home ? 'Home Ground' : 'Away')} • {match.competition}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          {isUpcoming && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(match, 'attendance')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl border border-blue-500/30 transition-colors text-sm font-medium"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span className="hidden lg:inline">Attendance</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(match, 'schedule')}
                className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-slate-400" />
              </motion.button>
            </>
          )}

          {isLive && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(match, 'live')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-500/30 transition-colors animate-pulse text-sm font-medium"
            >
              <Radio className="w-4 h-4" />
              <span className="hidden lg:inline">Control Live</span>
            </motion.button>
          )}

          {isCompleted && !match.summary && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(match, 'summary')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl border border-emerald-500/30 transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden lg:inline">Add Summary</span>
            </motion.button>
          )}

          {isCompleted && match.summary && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(match, 'summary')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden lg:inline">View Summary</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ x: 5 }}
            onClick={() => onSelect(match, isLive ? 'live' : isCompleted ? 'summary' : 'attendance')}
            className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}