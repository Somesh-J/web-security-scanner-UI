import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fromSearchParams, toSearchParams, type FindingsQuery } from './query'

/**
 * Reads the findings query from the URL and writes changes back to it.
 * Any change other than paging resets to page 1, so a new filter never lands on an empty page.
 */
export function useFindingsQuery() {
  const [params, setParams] = useSearchParams()
  const key = params.toString()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the serialised params on purpose
  const query = useMemo(() => fromSearchParams(params), [key])

  const update = useCallback(
    (patch: Partial<FindingsQuery>, options: { replace?: boolean } = {}) => {
      setParams(
        (prev) => {
          const current = fromSearchParams(prev)
          const resetsPage = !('page' in patch)
          return toSearchParams({ ...current, ...patch, ...(resetsPage ? { page: 1 } : {}) })
        },
        { replace: options.replace ?? false },
      )
    },
    [setParams],
  )

  return { query, update }
}

/** Adds the value if absent, removes it if present. Used by every multi-select chip. */
export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}
