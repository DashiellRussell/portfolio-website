"use client"

import { useEffect, useRef, useState } from "react"
import { observeVisibility } from "@/lib/canvas"

/**
 * Mounts its children only while this box is on (or near) the screen, and
 * unmounts them when it scrolls away.
 *
 * Pausing a canvas still holds its WebGL context, buffers and textures; the
 * page has several heavy ones (the spacecraft, the robotics bench, the nozzle
 * solver), so off-screen panels drop theirs entirely. Browsers also cap live
 * WebGL contexts at roughly 16, so this keeps the page well under that.
 *
 * Cards are a full screen tall, so with no margin only the card being read
 * (and, mid-scroll, the one arriving) holds a canvas.
 */
export function OnScreen({
  children,
  margin = "0px",
  className,
}: {
  children: React.ReactNode
  margin?: string
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    return observeVisibility(el, setOn, margin)
  }, [margin])

  return (
    <div ref={box} className={className} style={{ position: "absolute", inset: 0 }}>
      {on ? children : null}
    </div>
  )
}
