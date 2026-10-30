import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Loads data from the backend and tracks loading/error state.
 * Ignores stale responses and guards against unmounted state updates.
 * Returns { data, loading, error, refetch, setData }.
 */
export function useResource(loader, deps = [], initial = null) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const requestIdRef = useRef(0)
  const isMountedRef = useRef(true)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  const run = useCallback(async () => {
    const currentId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await loaderRef.current()
      if (isMountedRef.current && currentId === requestIdRef.current) {
        setData(result)
        setError(null)
      }
      return result
    } catch (caught) {
      if (isMountedRef.current && currentId === requestIdRef.current) {
        setError(caught?.message || 'Something went wrong while loading data.')
      }
      return null
    } finally {
      if (isMountedRef.current && currentId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const refetch = useCallback(() => {
    return run()
  }, [run])

  // Track dependency changes via ref updated inside effect
  const prevDepsRef = useRef(deps)
  const [depsKey, setDepsKey] = useState(0)

  useEffect(() => {
    const hasChanged =
      deps.length !== prevDepsRef.current.length ||
      deps.some((dep, index) => !Object.is(dep, prevDepsRef.current[index]))
    if (hasChanged) {
      prevDepsRef.current = deps
      setDepsKey((prev) => prev + 1)
    }
  }, [deps])

  useEffect(() => {
    isMountedRef.current = true
    const currentId = ++requestIdRef.current
    Promise.resolve().then(async () => {
      try {
        const result = await loaderRef.current()
        if (isMountedRef.current && currentId === requestIdRef.current) {
          setData(result)
          setError(null)
        }
      } catch (caught) {
        if (isMountedRef.current && currentId === requestIdRef.current) {
          setError(caught?.message || 'Something went wrong while loading data.')
        }
      } finally {
        if (isMountedRef.current && currentId === requestIdRef.current) {
          setLoading(false)
        }
      }
    })
    return () => {
      isMountedRef.current = false
    }
  }, [depsKey])

  return { data, loading, error, refetch, setData }
}
