import { useEffect, useState } from 'react'

/**
 * Debounces a fast-changing value, so that it only updates after a certain delay without changes
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value - this will only update after `delay` ms without changes to the original value 
 */
export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}