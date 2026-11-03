"use client"

import { useEffect, useState } from "react"

/** True on phone-width screens (below Tailwind's `sm`), tracking resizes. */
export function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const q = window.matchMedia("(max-width: 639px)")
    const on = () => setMobile(q.matches)
    on()
    q.addEventListener("change", on)
    return () => q.removeEventListener("change", on)
  }, [])
  return mobile
}
