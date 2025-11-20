"use client"

import { useEffect, useState } from "react"

export function BackgroundDots() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden">
            {/* Light Mode Pattern */}
            <div className="absolute inset-0 bg-background dark:hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(#000000 1.5px, transparent 1.5px)`,
                        backgroundSize: '48px 48px',
                        opacity: 0.15
                    }}
                />
            </div>

            {/* Dark Mode Pattern */}
            <div className="absolute inset-0 bg-background hidden dark:block">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(#ffffff 1.5px, transparent 1.5px)`,
                        backgroundSize: '48px 48px',
                        opacity: 0.2
                    }}
                />
            </div>

            {/* Optional: Subtle vignette to focus center */}
            <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-background/80" />
        </div>
    )
}
