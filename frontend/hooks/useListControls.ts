'use client'

import { useEffect, useMemo, useState } from 'react'

export interface SortOption<T> {
  key: string
  label: string
  compare: (a: T, b: T) => number
}

/**
 * Reusable search + sort for list pages, with the chosen sort persisted per list
 * (remembered across visits). Filtering is a case-insensitive substring match on
 * `searchText(item)`; sorting uses the selected SortOption's comparator.
 */
export function useListControls<T>({
  items,
  storageKey,
  searchText,
  sorts,
  defaultSort,
}: {
  items: T[]
  storageKey: string
  searchText: (item: T) => string
  sorts: SortOption<T>[]
  defaultSort?: string
}) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState(defaultSort ?? sorts[0]?.key ?? '')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`cb-sort:${storageKey}`)
      if (saved && sorts.some((s) => s.key === saved)) setSortKey(saved)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const changeSort = (key: string) => {
    setSortKey(key)
    try { localStorage.setItem(`cb-sort:${storageKey}`, key) } catch {}
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q ? items.filter((i) => searchText(i).toLowerCase().includes(q)) : items.slice()
    const sort = sorts.find((s) => s.key === sortKey)
    if (sort) base.sort(sort.compare)
    return base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, sortKey])

  return { query, setQuery, sortKey, changeSort, sorts, filtered }
}
