import { useRef } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'
import type { Post } from '@/types'

interface Props {
  post: Post
  onClick: (post: Post) => void
  delay?: number
}

function HangerSVG() {
  return (
    <svg
      viewBox="0 0 80 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '80px', height: '48px' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hanger-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8cfc4" />
          <stop offset="40%" stopColor="#9a8c7e" />
          <stop offset="100%" stopColor="#c0b09e" />
        </linearGradient>
      </defs>
      {/* Hook — a small circle on top */}
      <path
        d="M40 4 Q40 0 44 0 Q48 0 48 4 Q48 8 40 10"
        stroke="url(#hanger-metal)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Neck down */}
      <line x1="40" y1="10" x2="40" y2="22" stroke="url(#hanger-metal)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Left shoulder */}
      <line x1="40" y1="22" x2="4" y2="44" stroke="url(#hanger-metal)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Right shoulder */}
      <line x1="40" y1="22" x2="76" y2="44" stroke="url(#hanger-metal)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Bottom crossbar */}
      <line x1="4" y1="44" x2="76" y2="44" stroke="url(#hanger-metal)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function HangerCard({ post, onClick, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const rotation = useSpring(0, { stiffness: 120, damping: 14 })
  const scale = useSpring(1, { stiffness: 180, damping: 18 })
  const rotateDisplay = useTransform(rotation, (r) => `rotate(${r}deg)`)
  const scaleDisplay = useTransform(scale, (s) => `scale(${s})`)

  return (
    <motion.div
      ref={ref}
      className="hanger-card flex flex-col items-center"
      style={{ transformOrigin: 'top center', width: 140 }}
      initial={{ y: -60, opacity: 0, rotate: 15 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 180,
        damping: 18,
      }}
      onHoverStart={() => {
        rotation.set(6)
        scale.set(1.05)
      }}
      onHoverEnd={() => {
        rotation.set(0)
        scale.set(1)
      }}
      onClick={() => onClick(post)}
      role="button"
      tabIndex={0}
      aria-label={post.title || 'View this piece on Instagram'}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(post)
        }
      }}
    >
      {/* The hanger metal part */}
      <HangerSVG />

      {/* The garment card */}
      <motion.div
        className="relative overflow-hidden rounded-sm cursor-pointer"
        style={{
          width: 120,
          height: 160,
          marginTop: -4,
          transform: rotateDisplay,
          scale: scaleDisplay,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <img
          src={post.image_url}
          alt={post.title || 'Thrift piece'}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ display: 'block' }}
        />
        {/* Subtle vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)',
          }}
        />
        {post.title && (
          <div
            className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <p className="text-cream text-xs font-medium leading-tight truncate">{post.title}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
