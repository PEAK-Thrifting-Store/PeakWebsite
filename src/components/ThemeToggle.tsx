import { motion } from 'motion/react'
import { Sun, Moon } from 'lucide-react'

interface Props {
  theme: 'light' | 'dark'
  onToggle: () => void
}

export default function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="relative w-12 h-6 rounded-full border border-[var(--border)] bg-[var(--surface)] flex items-center transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
    >
      <motion.div
        className="absolute w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center"
        animate={{ x: theme === 'dark' ? 2 : 22 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {theme === 'dark' ? (
          <Moon size={10} className="text-cream" />
        ) : (
          <Sun size={10} className="text-cream" />
        )}
      </motion.div>
    </button>
  )
}
