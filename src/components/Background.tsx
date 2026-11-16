import { useEffect, useRef } from 'react'

interface Props {
  theme: 'light' | 'dark'
}

export default function Background({ theme }: Props) {
  const lightRef = useRef<HTMLDivElement>(null)
  const darkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!lightRef.current || !darkRef.current) return
    if (theme === 'light') {
      lightRef.current.style.opacity = '1'
      darkRef.current.style.opacity = '0'
    } else {
      lightRef.current.style.opacity = '0'
      darkRef.current.style.opacity = '1'
    }
  }, [theme])

  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'opacity 0.8s ease',
    filter: 'blur(7px) brightness(0.55)',
    transform: 'scale(1.08)',
    animation: 'bg-drift 50s ease-in-out infinite alternate',
    willChange: 'transform',
  }

  return (
    <>
      <style>{`
        @keyframes bg-drift {
          0%   { transform: scale(1.08) translate(0, 0); }
          33%  { transform: scale(1.12) translate(1%, 0.5%); }
          66%  { transform: scale(1.1) translate(-0.5%, 1%); }
          100% { transform: scale(1.08) translate(0.5%, -0.5%); }
        }
      `}</style>
      <div
        ref={lightRef}
        style={{
          ...baseStyle,
          backgroundImage: 'url(/light.jpg)',
          opacity: theme === 'light' ? 1 : 0,
        }}
        aria-hidden="true"
      />
      <div
        ref={darkRef}
        style={{
          ...baseStyle,
          backgroundImage: 'url(/dark.jpg)',
          opacity: theme === 'dark' ? 1 : 0,
        }}
        aria-hidden="true"
      />
      {/* Theme-coloured tint on top of the image */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background:
            theme === 'dark'
              ? 'rgba(15,14,14,0.55)'
              : 'rgba(245,239,225,0.45)',
          transition: 'background 0.8s ease',
        }}
        aria-hidden="true"
      />
    </>
  )
}
