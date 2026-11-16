import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'How do I buy something?',
    a: 'Browse the closet, find a piece you love, then DM us on Instagram with the item and we\'ll sort out the rest. All sales are handled directly through Instagram to keep things personal.',
  },
  {
    q: 'Are the items authentic?',
    a: 'Every piece in the closet is personally curated and verified before listing. We only carry items we\'d wear ourselves — authenticity is non-negotiable.',
  },
  {
    q: 'Do you offer delivery?',
    a: 'TODO: Add your delivery/pickup details here. (e.g. delivery across Jordan, or pickup from a specific location.)',
  },
  {
    q: 'Can I return or exchange an item?',
    a: 'TODO: Add your return/exchange policy here.',
  },
  {
    q: 'How often do you restock?',
    a: 'New drops happen regularly — follow our Instagram to be the first to know when fresh pieces land in the closet.',
  },
  {
    q: 'What sizes do you carry?',
    a: 'TODO: Add your typical size range here. Each item listing includes sizing info, so check the post or DM us if you\'re unsure.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {FAQS.map((item, i) => (
        <div
          key={i}
          className="border border-[var(--border)] rounded-lg overflow-hidden"
          style={{ background: 'var(--surface)' }}
        >
          <button
            className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left font-semibold text-[var(--text)] hover:text-[var(--accent)] transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span>{item.q}</span>
            <motion.span
              animate={{ rotate: open === i ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="shrink-0 text-[var(--accent)]"
            >
              <ChevronDown size={18} />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <p className="px-6 pb-5 text-[var(--text)] opacity-80 leading-relaxed text-sm">
                  {item.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
