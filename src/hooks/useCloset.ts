import { useState, useCallback } from 'react'
import type { ClosetState } from '@/types'

export function useCloset() {
  const [state, setState] = useState<ClosetState>('idle')

  const open = useCallback(() => {
    if (state !== 'idle') return
    setState('opening')
    setTimeout(() => setState('open'), 1600)
  }, [state])

  const close = useCallback(() => {
    if (state !== 'open') return
    setState('closing')
    setTimeout(() => setState('idle'), 1200)
  }, [state])

  return { state, open, close }
}
