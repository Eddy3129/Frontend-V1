'use client'

import { useEffect, useRef, useState, RefObject } from 'react'

interface UseInViewOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): [RefObject<T | null>, boolean] {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options
  const ref = useRef<T>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (triggerOnce) {
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsInView(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce])

  return [ref, isInView]
}

// Hook for staggered animations
export function useStaggeredInView<T extends HTMLElement = HTMLDivElement>(
  itemCount: number,
  options: UseInViewOptions = {}
): [RefObject<T | null>, boolean[]] {
  const [ref, isInView] = useInView<T>(options)
  const [visibleItems, setVisibleItems] = useState<boolean[]>(Array(itemCount).fill(false))

  useEffect(() => {
    if (isInView) {
      // Stagger the visibility of each item
      const timers: NodeJS.Timeout[] = []
      for (let i = 0; i < itemCount; i++) {
        timers.push(
          setTimeout(() => {
            setVisibleItems((prev) => {
              const next = [...prev]
              next[i] = true
              return next
            })
          }, i * 450) // 450ms stagger delay (3x slower)
        )
      }
      return () => timers.forEach(clearTimeout)
    }
  }, [isInView, itemCount])

  return [ref, visibleItems]
}
