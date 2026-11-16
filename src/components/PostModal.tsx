import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ExternalLink } from 'lucide-react'
import type { Post } from '@/types'

interface Props {
  post: Post | null
  onClose: () => void
}

export default function PostModal({ post, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Escape key
  useEffect(() => {
    if (!post) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [post, onClose])

  // Focus trap
  useEffect(() => {
    if (post) closeRef.current?.focus()
  }, [post])

  return (
    <AnimatePresence>
      {post && (
        <motion.div
          ref={backdropRef}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
          role="dialog"
          aria-modal="true"
          aria-label={post.title || 'Post detail'}
        >
          <motion.div
            className="relative flex flex-col items-center gap-5 max-w-sm w-full"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              ref={closeRef}
              onClick={onClose}
              className="absolute -top-4 -right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-cream hover:text-[var(--accent)] transition-colors"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Image */}
            <div
              className="w-full overflow-hidden rounded-md"
              style={{
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                maxHeight: '65vh',
              }}
            >
              <img
                src={post.image_url}
                alt={post.title || 'Piece detail'}
                className="w-full h-full object-cover"
                style={{ maxHeight: '65vh' }}
              />
            </div>

            {post.title && (
              <h3 className="font-display text-2xl text-cream text-center px-2">{post.title}</h3>
            )}

            <a
              href={post.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <ExternalLink size={16} />
              View on Instagram
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
