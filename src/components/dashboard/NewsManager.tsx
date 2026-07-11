// =============================================
// HOT BLOOD FC — News Manager
// Full CRUD: create, edit, delete, pin/unpin news posts
// =============================================

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Edit2, Trash2, Pin, Search, Newspaper, PinOff, ImageIcon, X,
} from 'lucide-react'
import { supabase } from '../../helpers/supabase'
import { fetchAll, insertRow, updateRow, deleteRow, uploadFile } from '../../helpers/api'
import { useToast, Modal, Button, SkeletonCard } from '../ui/Toast'
import type { NewsItem } from '../../types'

export default function NewsManager() {
  const { show } = useToast()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    content: '',
    is_pinned: false,
    image_url: '' as string | null,
  })

  const fetchNews = useCallback(async () => {
    setLoading(true)
    const data = await fetchAll<NewsItem>('news', {
      order: { column: 'is_pinned', ascending: false },
    })
    // secondary sort by created_at
    data.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    setNews(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', content: '', is_pinned: false, image_url: null })
    setImagePreview(null)
    setModalOpen(true)
  }

  const openEdit = (item: NewsItem) => {
    setEditing(item)
    setForm({
      title: item.title,
      content: item.content,
      is_pinned: item.is_pinned,
      image_url: item.image_url,
    })
    setImagePreview(item.image_url)
    setModalOpen(true)
  }

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    // upload immediately
    const publicUrl = await uploadFile('news-images', file)
    if (publicUrl) {
      setForm((f) => ({ ...f, image_url: publicUrl }))
      show('Image uploaded', 'success')
    } else {
      show('Image upload failed', 'error')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      show('Title and content are required', 'error')
      return
    }
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (editing) {
      const result = await updateRow<NewsItem>('news', editing.id, {
        title: form.title,
        content: form.content,
        is_pinned: form.is_pinned,
        image_url: form.image_url,
      })
      if (result) show('News updated successfully', 'success')
      else show('Failed to update news', 'error')
    } else {
      const result = await insertRow<NewsItem>('news', {
        title: form.title,
        content: form.content,
        is_pinned: form.is_pinned,
        image_url: form.image_url,
        published_by: user?.id || null,
      })
      if (result) show('News published successfully', 'success')
      else show('Failed to publish news', 'error')
    }
    setSaving(false)
    setModalOpen(false)
    fetchNews()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this news post permanently?')) return
    const ok = await deleteRow('news', id)
    if (ok) {
      show('News deleted', 'success')
      fetchNews()
    } else {
      show('Failed to delete', 'error')
    }
  }

  const togglePin = async (item: NewsItem) => {
    await updateRow('news', item.id, { is_pinned: !item.is_pinned })
    show(item.is_pinned ? 'Unpinned' : 'Pinned to top', 'success')
    fetchNews()
  }

  const filtered = news.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-1">
            News <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Management</span>
          </h2>
          <p className="text-slate-400 text-sm">Create and publish updates to fans in real-time</p>
        </div>
        <Button onClick={openCreate} icon={Plus} size="md">
          New Post
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search news posts..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white focus:border-orange-500/50 focus:outline-none"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No news posts yet</h3>
          <p className="text-slate-400 mb-6">Create your first update for the fans</p>
          <Button onClick={openCreate} icon={Plus}>
            Create First Post
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden group hover:border-orange-500/50 transition-all"
              >
                {/* Image */}
                <div className="relative h-40 bg-slate-700/50">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-600">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                  {item.is_pinned && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      <Pin className="w-3 h-3" /> PINNED
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-white text-lg mb-2 line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3 mb-4">{item.content}</p>
                  <p className="text-xs text-slate-500 mb-4">
                    {new Date(item.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-700/50">
                    <button
                      onClick={() => togglePin(item)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.is_pinned ? 'text-orange-400 hover:bg-orange-500/10' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                      }`}
                      title={item.is_pinned ? 'Unpin' : 'Pin to top'}
                    >
                      {item.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Post' : 'New News Post'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={200}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              placeholder="Breaking: New signing announcement..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Content *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              rows={6}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none resize-none"
              placeholder="Write your update here..."
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Featured Image</label>
            <div className="flex items-center gap-3">
              <label className="flex-shrink-0 cursor-pointer">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-600 hover:border-orange-500/50 flex items-center justify-center bg-slate-800/30 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null)
                    setForm({ ...form, image_url: null })
                  }}
                  className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Remove
                </button>
              )}
            </div>
          </div>

          {/* Pin toggle */}
          <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_pinned}
              onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
              className="w-5 h-5 rounded border-slate-600 text-orange-500 focus:ring-orange-500"
            />
            <div>
              <span className="text-white font-medium">Pin to top</span>
              <p className="text-xs text-slate-400">Pinned posts appear first in the fan portal</p>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {editing ? 'Update Post' : 'Publish Post'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
