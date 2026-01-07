"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Prevent scrolling while loading
    document.body.style.overflow = "hidden"

    // Simulate loading time or wait for window.load
    const timer = setTimeout(() => {
      setIsLoading(false)
      document.body.style.overflow = "auto"
    }, 2000)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = "auto"
    }
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            y: "-100%",
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        >
          <div className="relative">
            {/* Main Logo Container */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-card border-[8px] border-border p-8 shadow-brutal-lg flex flex-col items-center gap-6"
            >
              <motion.div 
                className="text-8xl font-black tracking-tighter uppercase"
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                DR
              </motion.div>
              
              <div className="w-48 h-4 bg-muted border-4 border-border overflow-hidden">
                <motion.div
                  className="h-full bg-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                />
              </div>
              
              <motion.p 
                className="text-sm font-bold uppercase tracking-[0.2em]"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Initializing Systems...
              </motion.p>
            </motion.div>

            {/* Decorative Brutalist Elements */}
            <motion.div 
              className="absolute -top-4 -left-4 w-8 h-8 bg-amber border-4 border-border z-[-1]"
              animate={{ rotate: 90 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute -bottom-4 -right-4 w-12 h-12 bg-pink border-4 border-border z-[-1]"
              animate={{ rotate: -90 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
          
          {/* Background scanline effect */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
