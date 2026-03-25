import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Trophy, Plus, Edit2, Trash2,
  Upload, AlertCircle, CheckCircle, X
} from 'lucide-react';
import { supabase } from '../../helpers/supabase';
import type { League } from '../../types/matches';

interface LeagueManagerProps {
  onBack: () => void;
}

export default function LeagueManager({ onBack }: LeagueManagerProps) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    season: '',
    description: '',
    status: 'active' as 'active' | 'completed' | 'upcoming'
  });
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchLeagues = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('leagues')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setLeagues(data as League[]);
    } catch (err) {
      console.error('Error fetching leagues:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingLeague) {
        await supabase.from('leagues').update(formData).eq('id', editingLeague.id);
      } else {
        await supabase.from('leagues').insert([formData]);
      }

      setSuccess(editingLeague ? 'League updated!' : 'League created!');
      setTimeout(() => setSuccess(''), 3000);
      setShowForm(false);
      setEditingLeague(null);
      setFormData({ name: '', season: '', description: '', status: 'active' });
      fetchLeagues();
    } catch (err) {
      console.error('Error saving league:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this league?')) return;
    try {
      await supabase.from('leagues').delete().eq('id', id);
      fetchLeagues();
    } catch (err) {
      console.error('Error deleting league:', err);
    }
  };

  const handleEdit = (league: League) => {
    setEditingLeague(league);
    setFormData({
      name: league.name,
      season: league.season,
      description: league.description || '',
      status: league.status as 'active' | 'completed' | 'upcoming'
    });
    setShowForm(true);
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>, leagueId: string) => {
    if (!e.target.files?.[0]) return;

    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${leagueId}.${fileExt}`;

    try {
      await supabase.storage.from('league-logos').upload(fileName, file, { upsert: true });

      const { data: { publicUrl } } = supabase.storage.from('league-logos').getPublicUrl(fileName);

      await supabase.from('leagues').update({ logo_url: publicUrl }).eq('id', leagueId);
      fetchLeagues();
    } catch (err) {
      console.error('Error uploading logo:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-black">
                League <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Manager</span>
              </h1>
              <p className="text-slate-400">Manage leagues and competitions</p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingLeague(null);
              setFormData({ name: '', season: '', description: '', status: 'active' });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-semibold shadow-lg shadow-orange-500/25"
          >
            <Plus className="w-5 h-5" />
            Add League
          </button>
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

        {/* League Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    {editingLeague ? 'Edit' : 'Add'} League
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">League Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50"
                      placeholder="e.g., Premier League"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Season</label>
                    <input
                      type="text"
                      required
                      value={formData.season}
                      onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50"
                      placeholder="e.g., 2025/2026"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'completed' | 'upcoming' })}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50"
                    >
                      <option value="active">Active</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 resize-none"
                      placeholder="Optional description..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-semibold"
                    >
                      {editingLeague ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leagues Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leagues.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/20 rounded-2xl border border-slate-700/50">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Leagues</h3>
            <p className="text-slate-400">Add your first league to get started</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {leagues.map((league, index) => (
              <motion.div
                key={league.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 group hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center overflow-hidden">
                    {league.logo_url ? (
                      <img src={league.logo_url} alt={league.name} className="w-full h-full object-cover" />
                    ) : (
                      <Trophy className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className={`p-2 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors ${uploading ? 'opacity-50' : ''}`}>
                      <Upload className="w-4 h-4 text-slate-400" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => uploadLogo(e, league.id)}
                        disabled={uploading}
                      />
                    </label>
                    <button
                      onClick={() => handleEdit(league)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(league.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-1">{league.name}</h3>
                <p className="text-slate-400 text-sm mb-3">{league.season}</p>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    league.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                    league.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {league.status}
                  </span>
                </div>

                {league.description && (
                  <p className="mt-3 text-sm text-slate-500 line-clamp-2">{league.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}