"use client"

import { motion, HTMLMotionProps, Variants } from "framer-motion"
import { ReactNode } from "react"

interface MotionProps extends HTMLMotionProps<"div"> {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom = {}) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: custom.duration || 0.6,
      delay: custom.delay || 0,
      ease: [0.22, 1, 0.36, 1], // Custom easing for "sleek" feel
    },
  }),
}

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: (custom = {}) => ({
    transition: {
      staggerChildren: 0.1,
      delayChildren: custom.delay || 0,
    },
  }),
}

export const slideInFromLeftVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: (custom = {}) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: custom.duration || 0.6,
      delay: custom.delay || 0,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

export const slideInFromRightVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: (custom = {}) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: custom.duration || 0.6,
      delay: custom.delay || 0,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

export function FadeIn({ children, delay = 0, duration = 0.6, className, ...props }: MotionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInVariants}
      custom={{ delay, duration }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function FadeInStagger({ children, delay = 0, className, ...props }: MotionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={staggerContainerVariants}
      custom={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function FadeInItem({ children, className, ...props }: MotionProps) {
  return (
    <motion.div variants={fadeInVariants} className={className} {...props}>
      {children}
    </motion.div>
  )
}

export function ScaleOnHover({ children, className, ...props }: MotionProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
