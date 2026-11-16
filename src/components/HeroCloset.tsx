import { motion } from 'motion/react'

interface Props {
  onExplore: () => void
  isOpening: boolean
}

export default function HeroCloset({ onExplore, isOpening }: Props) {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ minHeight: '460px' }}
    >
      <motion.div
        className="wardrobe-perspective relative"
        animate={isOpening ? { scale: 2.8, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: isOpening ? 0.85 : 0, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: 280, height: 380 }}
      >
        {/* Idle float */}
        <motion.div
          animate={!isOpening ? { y: [0, -8, 0] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '100%', height: '100%' }}
        >
          <WardrobeSVG isOpening={isOpening} />
        </motion.div>
      </motion.div>

      {/* Explore button */}
      {!isOpening && (
        <motion.button
          className="btn-primary absolute bottom-0 left-1/2 -translate-x-1/2"
          onClick={onExplore}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          aria-label="Open the closet"
        >
          Explore
        </motion.button>
      )}
    </div>
  )
}

function WardrobeSVG({ isOpening }: { isOpening: boolean }) {
  // Door open angles
  const leftAngle = isOpening ? -105 : 0
  const rightAngle = isOpening ? 105 : 0
  const transition = { duration: 0.85, ease: [0.6, 0.05, 0.1, 0.9] as [number, number, number, number] }

  return (
    <svg
      viewBox="0 0 280 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))' }}
      role="img"
      aria-label="PEAK wardrobe"
    >
      <defs>
        {/* Wood grain gradient — frame */}
        <linearGradient id="wood-frame" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2d1f10" />
          <stop offset="30%" stopColor="#4a3020" />
          <stop offset="60%" stopColor="#3a2515" />
          <stop offset="100%" stopColor="#251808" />
        </linearGradient>
        {/* Door wood */}
        <linearGradient id="wood-door-l" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3d2a16" />
          <stop offset="50%" stopColor="#5c3f22" />
          <stop offset="100%" stopColor="#4a3018" />
        </linearGradient>
        <linearGradient id="wood-door-r" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#3d2a16" />
          <stop offset="50%" stopColor="#5c3f22" />
          <stop offset="100%" stopColor="#4a3018" />
        </linearGradient>
        {/* Interior dark */}
        <linearGradient id="interior" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c0f06" />
          <stop offset="100%" stopColor="#0a0503" />
        </linearGradient>
        {/* Top panel */}
        <linearGradient id="wood-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5c3f22" />
          <stop offset="100%" stopColor="#3a2515" />
        </linearGradient>
        {/* Handle gradient */}
        <linearGradient id="handle-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8a862" />
          <stop offset="50%" stopColor="#8a6830" />
          <stop offset="100%" stopColor="#c8a862" />
        </linearGradient>
        {/* Crimson trim */}
        <linearGradient id="crimson-trim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#790d16" />
          <stop offset="100%" stopColor="#9b1c2a" />
        </linearGradient>
        {/* Glow */}
        <radialGradient id="door-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c8a862" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#c8a862" stopOpacity="0" />
        </radialGradient>
        {/* Wood panel detail */}
        <pattern id="wood-grain" x="0" y="0" width="8" height="80" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="80" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* ── Outer frame ── */}
      {/* Back/shadow layer */}
      <rect x="10" y="8" width="260" height="362" rx="4" fill="rgba(0,0,0,0.5)" />
      {/* Frame body */}
      <rect x="6" y="4" width="268" height="368" rx="4" fill="url(#wood-frame)" />
      <rect x="6" y="4" width="268" height="368" rx="4" fill="url(#wood-grain)" opacity="0.4" />
      {/* Crimson bead at frame edge */}
      <rect x="6" y="4" width="268" height="6" rx="2" fill="url(#crimson-trim)" opacity="0.7" />
      <rect x="6" y="366" width="268" height="6" rx="2" fill="url(#crimson-trim)" opacity="0.7" />

      {/* ── Top panel ── */}
      <rect x="14" y="12" width="252" height="40" rx="3" fill="url(#wood-top)" />
      <rect x="14" y="12" width="252" height="40" rx="3" fill="url(#wood-grain)" opacity="0.3" />
      {/* PEAK wordmark on top panel */}
      <text
        x="140" y="37"
        textAnchor="middle"
        fontFamily="'Pirata One', serif"
        fontSize="20"
        fill="#c8a862"
        opacity="0.9"
        letterSpacing="4"
      >
        PEAK
      </text>

      {/* ── Interior (visible behind doors) ── */}
      <rect x="14" y="52" width="252" height="310" fill="url(#interior)" />
      {/* Warm glow from inside */}
      {isOpening && (
        <ellipse cx="140" cy="207" rx="100" ry="140" fill="#c8a862" opacity="0.08" />
      )}
      {/* Floor line */}
      <line x1="14" y1="362" x2="266" y2="362" stroke="#2d1f10" strokeWidth="3" />

      {/* ── Door group with 3D perspective ── */}
      {/* Left door */}
      <motion.g
        style={{ transformOrigin: '14px 207px' }}
        animate={{ rotateY: leftAngle }}
        transition={transition}
      >
        <rect x="14" y="52" width="124" height="310" fill="url(#wood-door-l)" />
        <rect x="14" y="52" width="124" height="310" fill="url(#wood-grain)" opacity="0.4" />
        {/* Door panel inset */}
        <rect x="22" y="62" width="108" height="130" rx="2" fill="rgba(0,0,0,0.15)" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
        <rect x="22" y="202" width="108" height="150" rx="2" fill="rgba(0,0,0,0.15)" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
        {/* Panel inset highlight */}
        <rect x="23" y="63" width="107" height="1" fill="rgba(255,255,255,0.08)" />
        <rect x="23" y="203" width="107" height="1" fill="rgba(255,255,255,0.08)" />
        {/* Handle */}
        <ellipse cx="130" cy="207" rx="6" ry="10" fill="url(#handle-grad)" />
        <ellipse cx="130" cy="207" rx="3" ry="6" fill="rgba(0,0,0,0.3)" />
        <ellipse cx="128" cy="203" rx="2" ry="3" fill="rgba(255,255,255,0.3)" />
        {/* Hinge marks */}
        <circle cx="18" cy="80" r="4" fill="#8a7050" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
        <circle cx="18" cy="207" r="4" fill="#8a7050" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
        <circle cx="18" cy="334" r="4" fill="#8a7050" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
        {/* Crimson accent strip */}
        <rect x="134" y="52" width="2" height="310" fill="url(#crimson-trim)" opacity="0.5" />
      </motion.g>

      {/* Right door */}
      <motion.g
        style={{ transformOrigin: '266px 207px' }}
        animate={{ rotateY: rightAngle }}
        transition={transition}
      >
        <rect x="142" y="52" width="124" height="310" fill="url(#wood-door-r)" />
        <rect x="142" y="52" width="124" height="310" fill="url(#wood-grain)" opacity="0.4" />
        {/* Door panel inset */}
        <rect x="150" y="62" width="108" height="130" rx="2" fill="rgba(0,0,0,0.15)" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
        <rect x="150" y="202" width="108" height="150" rx="2" fill="rgba(0,0,0,0.15)" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
        <rect x="150" y="63" width="107" height="1" fill="rgba(255,255,255,0.08)" />
        <rect x="150" y="203" width="107" height="1" fill="rgba(255,255,255,0.08)" />
        {/* Handle */}
        <ellipse cx="150" cy="207" rx="6" ry="10" fill="url(#handle-grad)" />
        <ellipse cx="150" cy="207" rx="3" ry="6" fill="rgba(0,0,0,0.3)" />
        <ellipse cx="148" cy="203" rx="2" ry="3" fill="rgba(255,255,255,0.3)" />
        {/* Hinge marks */}
        <circle cx="262" cy="80" r="4" fill="#8a7050" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
        <circle cx="262" cy="207" r="4" fill="#8a7050" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
        <circle cx="262" cy="334" r="4" fill="#8a7050" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
        {/* Crimson accent strip */}
        <rect x="144" y="52" width="2" height="310" fill="url(#crimson-trim)" opacity="0.5" />
      </motion.g>

      {/* Door gap shadow line (center) */}
      <line x1="140" y1="52" x2="140" y2="362" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />

      {/* Bottom panel */}
      <rect x="14" y="354" width="252" height="14" rx="2" fill="url(#wood-top)" />
    </svg>
  )
}
