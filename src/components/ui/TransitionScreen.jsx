import { useEffect } from 'react'

// Brief fade-through screen; calls onDone once. Timer is cleaned up on unmount.
export default function TransitionScreen({ onDone, duration = 600 }) {
  useEffect(() => {
    const id = setTimeout(onDone, duration)
    return () => clearTimeout(id)
  }, [onDone, duration])
  return <div className="absolute inset-0 z-20 bg-zinc-100" aria-hidden="true" />
}
