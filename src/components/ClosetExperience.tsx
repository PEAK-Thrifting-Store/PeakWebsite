import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ChevronLeft, ChevronRight, RefreshCw, Shirt } from 'lucide-react'
import { publicApi } from '@/lib/api'
import HangerCard from './HangerCard'
import PostModal from './PostModal'
import type { Rail, Post, ClosetState } from '@/types'

interface Props {
  state: ClosetState
  onClose: () => void
}

type LoadState = 'loading' | 'success' | 'error' | 'empty'

export default function ClosetExperience({ state, onClose }: Props) {
  const [rails, setRails] = useState<Rail[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoadState('loading')
    try {
      const data = await publicApi.getCloset()
      const withPosts = data.filter((r) => r.posts && r.posts.length > 0)
      setRails(withPosts)
      setLoadState(withPosts.length === 0 ? 'empty' : 'success')
    } catch {
      setLoadState('error')
    }
  }, [])

  useEffect(() => {
    if (state === 'open') load()
  }, [state, load])

  // Lock body scroll
  useEffect(() => {
    if (state === 'open' || state === 'opening') {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [state])

  // Escape key
  useEffect(() => {
    if (state !== 'open') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !selectedPost) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [state, onClose, selectedPost])

  const isVisible = state === 'opening' || state === 'open' || state === 'closing'

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed inset-0 z-[100] closet-interior overflow-hidden"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={
              state === 'opening'
                ? { opacity: 1, scale: 1 }
                : state === 'closing'
                ? { opacity: 0, scale: 0.3 }
                : { opacity: 1, scale: 1 }
            }
            transition={{
              duration: state === 'opening' ? 0.7 : 0.6,
              delay: state === 'opening' ? 0.85 : 0,
              ease: [0.4, 0, 0.2, 1],
            }}
            role="dialog"
            aria-modal="true"
            aria-label="PEAK Closet"
          >
            {/* Warm ambient light from top */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '200px',
                background: 'radial-gradient(ellipse at top, rgba(200,168,98,0.12) 0%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="fixed top-4 right-4 z-[150] w-11 h-11 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F5EFE1',
              }}
              aria-label="Close closet"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="relative z-10 pt-8 pb-4 text-center">
              <motion.h2
                className="font-display text-5xl md:text-7xl"
                style={{ color: '#c8a862', textShadow: '0 0 40px rgba(200,168,98,0.3)' }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                The Closet
              </motion.h2>
            </div>

            {/* Scrollable rail area */}
            <div
              ref={scrollRef}
              className="relative z-10 overflow-y-auto"
              style={{ height: 'calc(100vh - 120px)', paddingBottom: '4rem' }}
            >
              {loadState === 'loading' && <SkeletonRails />}
              {loadState === 'error' && (
                <div className="flex flex-col items-center gap-4 mt-24 text-cream/60">
                  <p className="text-lg">Failed to load the closet.</p>
                  <button
                    onClick={load}
                    className="btn-ghost flex items-center gap-2"
                    style={{ color: '#c8a862', borderColor: '#c8a862' }}
                  >
                    <RefreshCw size={16} />
                    Retry
                  </button>
                </div>
              )}
              {loadState === 'empty' && (
                <div className="flex flex-col items-center gap-4 mt-24 text-cream/60">
                  <Shirt size={48} style={{ color: '#c8a862' }} />
                  <p className="font-display text-3xl" style={{ color: '#c8a862' }}>
                    The closet is being restocked.
                  </p>
                  <p className="text-sm">Check back soon or follow us on Instagram.</p>
                </div>
              )}
              {loadState === 'success' && rails.map((rail, ri) => (
                <RailSection
                  key={rail.id}
                  rail={rail}
                  railIndex={ri}
                  onPostClick={setSelectedPost}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </>
  )
}

// ── Rail section ─────────────────────────────────────────────────────────────

function RailSection({
  rail,
  railIndex,
  onPostClick,
}: {
  rail: Rail
  railIndex: number
  onPostClick: (p: Post) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    const c = scrollContainerRef.current
    if (!c) return
    c.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  const posts = rail.posts || []

  return (
    <div ref={ref} className="mb-16 px-4 md:px-10">
      {/* Rail tag + name */}
      <motion.div
        className="flex items-center gap-4 mb-3"
        initial={{ opacity: 0, x: -20 }}
        animate={visible ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: railIndex * 0.1 }}
      >
        {/* Hanging tag */}
        <div
          className="relative flex items-center justify-center px-3 py-1 rounded-sm text-xs font-semibold tracking-widest uppercase"
          style={{
            background: '#790d16',
            color: '#F5EFE1',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            minWidth: 80,
          }}
        >
          {/* String */}
          <span
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '1px',
              height: '12px',
              background: 'rgba(200,168,98,0.6)',
            }}
          />
          {rail.name}
        </div>
      </motion.div>

      {/* Metal rail bar */}
      <motion.div
        className="rail-bar mb-0"
        initial={{ scaleX: 0 }}
        animate={visible ? { scaleX: 1 } : {}}
        transition={{ delay: railIndex * 0.1 + 0.1, duration: 0.5 }}
        style={{ transformOrigin: 'left' }}
      />

      {/* Scroll container with arrows */}
      <div className="relative group">
        {/* Left arrow */}
        {posts.length > 4 && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5EFE1', marginLeft: '-1rem' }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Hangers */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-6 pt-2 pl-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {posts.map((post, i) => (
            <div key={post.id} className="shrink-0">
              <HangerCard
                post={post}
                onClick={onPostClick}
                delay={visible ? railIndex * 0.08 + i * 0.06 : 0}
              />
            </div>
          ))}
        </div>

        {/* Edge fades */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 60,
            background: 'linear-gradient(to right, transparent, rgba(10,5,3,0.9))',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 20,
            background: 'linear-gradient(to left, transparent, rgba(10,5,3,0.5))',
            pointerEvents: 'none',
          }}
        />

        {/* Right arrow */}
        {posts.length > 4 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5EFE1', marginRight: '-1rem' }}
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRails() {
  return (
    <div className="space-y-16 px-4 md:px-10 mt-4">
      {[0, 1].map((ri) => (
        <div key={ri}>
          <div className="w-24 h-6 rounded mb-3 animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="rail-bar mb-2" />
          <div className="flex gap-6 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center shrink-0" style={{ width: 140 }}>
                <div className="w-20 h-12 animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="w-28 h-40 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.08)', animationDelay: `${i * 0.1}s` }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
