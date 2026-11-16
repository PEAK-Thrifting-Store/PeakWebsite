import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Instagram, ArrowDown, Shirt, DollarSign, Leaf, Star } from 'lucide-react'
import HeroCloset from '@/components/HeroCloset'
import Marquee from '@/components/Marquee'
import FAQ from '@/components/FAQ'
import ContactForm from '@/components/ContactForm'
import type { ClosetState } from '@/types'

const INSTAGRAM_URL =
  'https://www.instagram.com/peak_joo?utm_source=ig_web_button_share_sheet&srtk=ZDNlZDc0MzIxNw=='

interface Props {
  closetState: ClosetState
  onExplore: () => void
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible') },
      { threshold: 0.12 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
      {children}
    </span>
  )
}

export default function Home({ closetState, onExplore }: Props) {
  const aboutRef = useReveal()
  const whyRef = useReveal()
  const howRef = useReveal()
  const closetCtaRef = useReveal()
  const faqRef = useReveal()
  const contactRef = useReveal()

  const isOpening = closetState === 'opening'

  return (
    <main>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        id="home"
        className="relative min-h-screen flex items-center"
        style={{ paddingTop: '5rem' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center py-16">
            {/* Left: text */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <SectionLabel>Est. Jordan</SectionLabel>
                <h1 className="font-display text-6xl sm:text-7xl xl:text-8xl leading-none tracking-wide text-[var(--text)]">
                  One of one.<br />
                  <span style={{ color: 'var(--accent)' }}>Yours.</span>
                </h1>
              </motion.div>

              <motion.p
                className="text-base sm:text-lg leading-relaxed max-w-md"
                style={{ color: 'var(--text)', opacity: 0.75 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
              >
                PEAK is a curated thrift store based in Jordan. Every piece is hand-picked — vintage
                finds, rare streetwear, and forgotten gems. Browse the closet, slide into our DMs,
                and make it yours.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <button className="btn-primary" onClick={onExplore}>
                  Explore the Closet
                </button>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost flex items-center gap-2"
                >
                  <Instagram size={16} />
                  Follow on Instagram
                </a>
              </motion.div>

              <motion.a
                href="#about"
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center gap-2 text-sm opacity-50 hover:opacity-80 transition-opacity mt-4"
                style={{ color: 'var(--text)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.8 }}
                aria-label="Scroll to About"
              >
                <ArrowDown size={16} className="animate-bounce" />
                Our story
              </motion.a>
            </div>

            {/* Right: Wardrobe */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <HeroCloset onExplore={onExplore} isOpening={isOpening} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── About ───────────────────────────────────────────────────────── */}
      <section id="about" className="section-pad">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div ref={aboutRef} className="reveal space-y-6 text-center">
            <SectionLabel>Our Story</SectionLabel>
            <h2 className="font-display text-5xl sm:text-6xl text-[var(--text)]">
              Born from the streets.
            </h2>
            <div className="space-y-4 max-w-2xl mx-auto text-[var(--text)] opacity-75 leading-relaxed">
              <p>
                PEAK started the way all good things do — out of obsession. We couldn't stop hunting
                for rare pieces at markets, in dusty closets, and from collectors across Jordan. What
                started as a personal wardrobe became a movement.
              </p>
              <p>
                Every item in our closet has been held, inspected, and chosen by hand. We don't list
                anything we wouldn't wear ourselves. The result: a rotating selection of genuine finds
                that you won't see on anyone else's back.
              </p>
              <p className="font-semibold" style={{ color: 'var(--text)', opacity: 1 }}>
                {/* TODO: Add your personal founding story / year / names if you want. */}
                <span className="text-[var(--accent)]">TODO:</span> Add your personal founding story here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Thrift ──────────────────────────────────────────────────── */}
      <section id="why-thrift" className="section-pad">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div ref={whyRef} className="reveal space-y-10">
            <div className="text-center space-y-2">
              <SectionLabel>Why Thrift</SectionLabel>
              <h2 className="font-display text-5xl sm:text-6xl text-[var(--text)]">
                Four reasons to shop PEAK.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {WHY_CARDS.map((card, i) => (
                <motion.div
                  key={card.title}
                  className="p-6 rounded-lg space-y-3"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center"
                    style={{ background: 'var(--accent)' }}
                  >
                    <card.Icon size={20} className="text-cream" />
                  </div>
                  <h3 className="font-display text-xl text-[var(--text)]">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--text)] opacity-70">{card.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="section-pad">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div ref={howRef} className="reveal space-y-12">
            <div className="text-center space-y-2">
              <SectionLabel>Process</SectionLabel>
              <h2 className="font-display text-5xl sm:text-6xl text-[var(--text)]">
                How it works.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {HOW_STEPS.map((step, i) => (
                <motion.div
                  key={step.title}
                  className="text-center space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto font-display text-2xl"
                    style={{ background: 'var(--accent)', color: 'var(--cream)' }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="font-display text-xl text-[var(--text)]">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--text)] opacity-70">{step.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Closet CTA ──────────────────────────────────────────────────── */}
      <section className="section-pad">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div ref={closetCtaRef} className="reveal space-y-6">
            <h2 className="font-display text-5xl sm:text-7xl text-[var(--text)]">
              The closet<br />
              <span style={{ color: 'var(--accent)' }}>is open.</span>
            </h2>
            <p className="text-[var(--text)] opacity-70 max-w-sm mx-auto">
              New pieces drop constantly. Jump in and see what's hanging.
            </p>
            <button className="btn-primary text-lg" onClick={onExplore}>
              Explore the Closet
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="section-pad">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div ref={faqRef} className="reveal space-y-10">
            <div className="text-center space-y-2">
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="font-display text-5xl sm:text-6xl text-[var(--text)]">
                Good questions.
              </h2>
            </div>
            <FAQ />
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <section id="contact" className="section-pad">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div ref={contactRef} className="reveal space-y-10">
            <div className="text-center space-y-2">
              <SectionLabel>Get in touch</SectionLabel>
              <h2 className="font-display text-5xl sm:text-6xl text-[var(--text)]">
                Say hello.
              </h2>
              <p className="text-[var(--text)] opacity-70 max-w-sm mx-auto text-sm">
                DM us on Instagram for the fastest response, or drop a message below.
              </p>
            </div>
            <div className="flex justify-center mb-6">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <Instagram size={18} />
                DM us on Instagram
              </a>
            </div>
            <div className="text-center text-xs opacity-30 uppercase tracking-widest mb-4">or</div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="border-t border-[var(--border)] py-10"
        style={{ background: 'var(--surface)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-3xl" style={{ color: 'var(--accent)' }}>
            PEAK
          </span>
          <nav className="flex flex-wrap gap-5 text-xs uppercase tracking-widest opacity-60" aria-label="Footer navigation">
            {['Home', 'About', 'How it works', 'FAQ', 'Contact'].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                className="hover:opacity-100 transition-opacity text-[var(--text)]"
              >
                {l}
              </a>
            ))}
          </nav>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="PEAK on Instagram"
            className="text-[var(--text)] hover:text-[var(--accent)] transition-colors"
          >
            <Instagram size={20} />
          </a>
        </div>
        <div className="text-center mt-6 text-xs opacity-30 text-[var(--text)]">
          © {new Date().getFullYear()} PEAK. All rights reserved.
        </div>
      </footer>
    </main>
  )
}

const WHY_CARDS = [
  {
    Icon: Star,
    title: 'Unique Pieces',
    body: 'Everything is one of one. Once it\'s gone, it\'s gone. That\'s the beauty of thrift.',
  },
  {
    Icon: DollarSign,
    title: 'Real Value',
    body: 'Premium looks without premium prices. Thrift is the original smart shopping.',
  },
  {
    Icon: Leaf,
    title: 'Sustainable',
    body: 'Every piece you buy from PEAK is a piece rescued from the bin. Fashion with a conscience.',
  },
  {
    Icon: Shirt,
    title: 'Curated Eye',
    body: 'We don\'t list everything — only what actually hits. Trust the curation.',
  },
]

const HOW_STEPS = [
  {
    title: 'Browse the Closet',
    body: 'Open the wardrobe and explore all the pieces hanging on the rails.',
  },
  {
    title: 'Find Your Piece',
    body: 'Tap any garment to see the full post and decide if it\'s yours.',
  },
  {
    title: 'DM Us',
    body: 'Slide into our Instagram DMs to claim it. First come, first served.',
  },
  {
    title: 'Get It',
    body: 'TODO: Add your delivery/pickup details here. We\'ll sort the rest.',
  },
]
