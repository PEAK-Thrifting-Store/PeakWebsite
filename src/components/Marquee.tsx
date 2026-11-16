const WORDS = [
  'THRIFT',
  '✦',
  'VINTAGE',
  '✦',
  'ONE OF ONE',
  '✦',
  'PEAK',
  '✦',
  'CURATED',
  '✦',
  'STREETWEAR',
  '✦',
  'JORDAN',
  '✦',
  'RARE FINDS',
  '✦',
]

export default function Marquee() {
  const doubled = [...WORDS, ...WORDS]
  return (
    <div
      className="overflow-hidden py-4 border-y border-[var(--border)]"
      style={{ background: 'var(--accent)' }}
      aria-hidden="true"
    >
      <div className="marquee-track">
        {doubled.map((w, i) => (
          <span
            key={i}
            className="font-display text-cream text-xl mx-6 tracking-widest whitespace-nowrap select-none"
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  )
}
