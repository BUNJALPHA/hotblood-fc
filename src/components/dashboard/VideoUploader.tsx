import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Film, Trophy, Mic, Play, RefreshCw } from 'lucide-react'
import { supabase } from '../../helpers/supabase'

// Extract URL from supabase client or hardcode it
const SUPABASE_URL = 'https://dggncqnfdzohvqamelzs.supabase.co'

interface VideoUploaderProps {
  onUploadComplete?: () => void
}

export default function VideoUploader({ onUploadComplete }: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'match_highlight' as const,
    match_id: ''
  })
  const [matches, setMatches] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('id, opponent, match_date')
      .order('match_date', { ascending: false })
      .limit(20)
    setMatches(data || [])
  }

   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleUpload = async () => {
  const file = fileInputRef.current?.files?.[0]
  if (!file || !formData.title) return

  setIsUploading(true)
  setUploadProgress(0)

  try {
    // Get Supabase session for auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    
    // Custom upload with progress using fetch + ReadableStream
    const uploadUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/videos/${fileName}`
    
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percent)
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error('Upload failed'))
        }
      })
      
      xhr.addEventListener('error', () => reject(new Error('Network error')))
      
      xhr.open('POST', uploadUrl, true)
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName)

    // Save to database
    const { error: dbError } = await supabase.from('videos').insert({
      title: formData.title,
      description: formData.description,
      video_url: publicUrl,
      category: formData.category,
      match_id: formData.match_id || null,
      created_by: session.user.id
    })

    if (dbError) throw dbError

    // Reset form
    setFormData({ title: '', description: '', category: 'match_highlight', match_id: '' })
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    
    onUploadComplete?.()
    alert('Video uploaded successfully!')

  } catch (err) {
    console.error('Upload failed:', err)
    alert('Upload failed: ' + (err as Error).message)
  } finally {
    setIsUploading(false)
    setUploadProgress(0)
  }
}

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-2">
          Upload <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Video</span>
        </h1>
        <p className="text-slate-400 mb-8">Upload match highlights, training videos, or interviews</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Area */}
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video bg-slate-800/40 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/50 transition-all group"
            >
              {previewUrl ? (
                <video src={previewUrl} className="w-full h-full rounded-2xl object-cover" controls />
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-400 font-medium">Click to select video</p>
                  <p className="text-slate-500 text-sm mt-1">MP4, MOV, WebM up to 500MB</p>
                </>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {isUploading && (
              <div className="bg-slate-800/40 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Uploading...</span>
                  <span className="text-orange-400 font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Match Highlights vs Test FC"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                placeholder="Brief description of the video..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'match_highlight', icon: Trophy, label: 'Match Highlight' },
                  { id: 'training', icon: Play, label: 'Training' },
                  { id: 'interview', icon: Mic, label: 'Interview' },
                  { id: 'other', icon: Film, label: 'Other' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFormData({...formData, category: cat.id as any})}
                    className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                      formData.category === cat.id 
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400' 
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <cat.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Related Match (Optional)</label>
              <select
                value={formData.match_id}
                onChange={(e) => setFormData({...formData, match_id: e.target.value})}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              >
                <option value="">Select a match...</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    vs {match.opponent} - {new Date(match.match_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <motion.button
              onClick={handleUpload}
              disabled={!previewUrl || !formData.title || isUploading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-bold text-white shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
