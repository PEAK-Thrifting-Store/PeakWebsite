import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Upload, Loader2 } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { resizeImageToWebP, formatDate } from '@/lib/utils'
import { useToast } from './AdminApp'
import type { Post, Rail } from '@/types'

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [rails, setRails] = useState<Rail[]>([])
  const [filterRail, setFilterRail] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPost, setEditPost] = useState<Post | null>(null)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const [p, r] = await Promise.all([adminApi.getPosts(), adminApi.getRails()])
      setPosts(p)
      setRails(r)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = filterRail === 'all'
    ? posts
    : filterRail === 'unassigned'
    ? posts.filter((p) => !p.rail_id)
    : posts.filter((p) => p.rail_id === parseInt(filterRail))

  const toggleVisibility = async (post: Post) => {
    try {
      const updated = await adminApi.toggleVisibility(post.id, !post.is_visible)
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...updated } : p)))
      toast(updated.is_visible ? 'Post visible' : 'Post hidden')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    }
  }

  const deletePost = async (id: number) => {
    if (!confirm('Delete this post?')) return
    try {
      await adminApi.deletePost(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      toast('Post deleted')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-[var(--text)]">Posts</h1>
        <button className="btn-primary py-2 px-4 text-sm" onClick={() => { setEditPost(null); setShowForm(true) }}>
          <Plus size={16} />
          Add Post
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'unassigned', label: 'Unassigned' },
          ...rails.map((r) => ({ value: String(r.id), label: r.name })),
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterRail(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border transition ${
              filterRail === opt.value
                ? 'bg-[var(--accent)] text-cream border-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text)] opacity-60 hover:opacity-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-lg animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm opacity-50 text-center py-12">No posts yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              rails={rails}
              onEdit={() => { setEditPost(post); setShowForm(true) }}
              onDelete={() => deletePost(post.id)}
              onToggleVisibility={() => toggleVisibility(post)}
              onMoved={(updated) => setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))}
              toast={toast}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <PostForm
          post={editPost}
          rails={rails}
          onClose={() => setShowForm(false)}
          onSaved={(p, isNew) => {
            if (isNew) setPosts((prev) => [p, ...prev])
            else setPosts((prev) => prev.map((x) => (x.id === p.id ? p : x)))
            setShowForm(false)
            toast(isNew ? 'Post created' : 'Post updated')
          }}
        />
      )}
    </div>
  )
}

// ── Post card ─────────────────────────────────────────────────────────────────

function PostCard({
  post, rails, onEdit, onDelete, onToggleVisibility, onMoved, toast,
}: {
  post: Post
  rails: Rail[]
  onEdit: () => void
  onDelete: () => void
  onToggleVisibility: () => void
  onMoved: (updated: { id: number; rail_id: number | null }) => void
  toast: (msg: string, type?: 'success' | 'error') => void
}) {
  const moveToRail = async (railId: string) => {
    try {
      const id = railId === 'null' ? null : parseInt(railId)
      const updated = await adminApi.movePost(post.id, id)
      onMoved(updated)
      toast('Post moved')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    }
  }

  return (
    <div className="admin-card p-0 overflow-hidden group relative">
      <div className="relative aspect-[3/4] bg-[var(--surface2)]">
        <img
          src={post.image_url}
          alt={post.title || 'Post'}
          className={`w-full h-full object-cover transition-opacity ${!post.is_visible ? 'opacity-40' : ''}`}
          loading="lazy"
        />
        {!post.is_visible && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs bg-black/70 text-cream px-2 py-1 rounded">Hidden</span>
          </div>
        )}
        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
          <button onClick={onEdit} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition" aria-label="Edit">
            <Pencil size={16} />
          </button>
          <button onClick={onToggleVisibility} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition" aria-label={post.is_visible ? 'Hide' : 'Show'}>
            {post.is_visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button onClick={onDelete} className="p-2 rounded-full bg-red-900/40 hover:bg-red-700/60 text-red-300 transition" aria-label="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-2 space-y-1">
        {post.title && <p className="text-xs font-medium truncate text-[var(--text)]">{post.title}</p>}
        <p className="text-[10px] opacity-40 text-[var(--text)]">{formatDate(post.created_at)}</p>
        <select
          value={post.rail_id ?? 'null'}
          onChange={(e) => moveToRail(e.target.value)}
          className="w-full text-[10px] px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] focus:outline-none"
          aria-label="Move to rail"
        >
          <option value="null">Unassigned</option>
          {rails.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ── Post form ─────────────────────────────────────────────────────────────────

function PostForm({
  post, rails, onClose, onSaved,
}: {
  post: Post | null
  rails: Rail[]
  onClose: () => void
  onSaved: (p: Post, isNew: boolean) => void
}) {
  const [title, setTitle] = useState(post?.title || '')
  const [instagramUrl, setInstagramUrl] = useState(post?.instagram_url || '')
  const [railId, setRailId] = useState<string>(post?.rail_id ? String(post.rail_id) : '')
  const [imageFile, setImageFile] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string>(post?.image_url || '')
  const [sizeKB, setSizeKB] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProcessing(true)
    setError('')
    try {
      const { blob, sizeKB: kb } = await resizeImageToWebP(file)
      if (kb > 400) {
        setError(`Image is ${kb} KB after resize. Try a smaller image.`)
        setProcessing(false)
        return
      }
      setImageFile(blob)
      setSizeKB(kb)
      setPreview(URL.createObjectURL(blob))
    } catch {
      setError('Failed to process image. Try another file.')
    } finally {
      setProcessing(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!post && !imageFile) { setError('Image is required'); return }
    setError('')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('instagram_url', instagramUrl)
      fd.append('rail_id', railId)
      if (imageFile) fd.append('image', new File([imageFile], 'image.webp', { type: 'image/webp' }))

      let saved: Post
      if (post) {
        saved = await adminApi.updatePost(post.id, fd)
        onSaved(saved, false)
      } else {
        saved = await adminApi.createPost(fd)
        onSaved(saved, true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors font-body'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="font-display text-xl text-[var(--text)]">{post ? 'Edit Post' : 'New Post'}</h2>
          <button onClick={onClose} className="text-[var(--text)] opacity-50 hover:opacity-80 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Image picker */}
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase mb-2 opacity-60">
              Image {!post && <span className="text-[var(--accent)]">*</span>}
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative cursor-pointer rounded-md border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] transition-colors overflow-hidden flex items-center justify-center"
              style={{ height: 180, background: 'var(--surface)' }}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--text)] opacity-40">
                  {processing ? <Loader2 size={28} className="animate-spin" /> : <Upload size={28} />}
                  <span className="text-xs">{processing ? 'Processing…' : 'Click to upload'}</span>
                </div>
              )}
              {processing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 size={28} className="animate-spin text-cream" />
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="hidden" />
            {sizeKB && (
              <p className="text-xs opacity-50 mt-1 text-[var(--text)]">
                {sizeKB} KB (WebP, resized to max 900px)
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase mb-2 opacity-60" htmlFor="post-title">
              Title (optional)
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vintage Levi's 501…"
              maxLength={200}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase mb-2 opacity-60" htmlFor="post-ig">
              Instagram Post URL <span className="text-[var(--accent)]">*</span>
            </label>
            <input
              id="post-ig"
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/…"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase mb-2 opacity-60" htmlFor="post-rail">
              Rail
            </label>
            <select
              id="post-rail"
              value={railId}
              onChange={(e) => setRailId(e.target.value)}
              className={inputClass}
            >
              <option value="">Unassigned</option>
              {rails.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={saving || processing} className="btn-primary flex-1 justify-center">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {post ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
