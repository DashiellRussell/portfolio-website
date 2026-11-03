"use client"

import { useEffect, useState } from "react"

/**
 * Types one word, holds it, deletes it, types the next. Respects reduced
 * motion by showing the first word only. The slot keeps the widest word's
 * width so the line never reflows.
 */
export function RotatingWord({ words, className = "" }: { words: string[]; className?: string }) {
  const [i, setI] = useState(0)
  const [n, setN] = useState(words[0].length)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const word = words[i]
    const delay = deleting ? 45 : n === word.length ? 1800 : 85
    const t = setTimeout(() => {
      if (!deleting && n === word.length) setDeleting(true)
      else if (deleting && n === 0) {
        setDeleting(false)
        setI((i + 1) % words.length)
      } else setN(n + (deleting ? -1 : 1))
    }, delay)
    return () => clearTimeout(t)
  }, [i, n, deleting, words])

  const widest = words.reduce((a, b) => (b.length > a.length ? b : a))
  return (
    <span className={`relative inline-block whitespace-nowrap align-baseline ${className}`}>
      <span className="invisible">{widest}</span>
      <span className="absolute inset-y-0 left-0" aria-live="polite">
        {words[i].slice(0, n)}
        <span className="ml-0.5 inline-block w-[0.5ch] animate-pulse">_</span>
      </span>
    </span>
  )
}
