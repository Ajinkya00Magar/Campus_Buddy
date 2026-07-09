'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMessages, MESSAGE_PAGE_SIZE } from '@/services/channels.service'
import type { Message } from '@/types'

export function useMessages(channelId: string) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  // Guards against overlapping loadOlder calls and stale channel loads.
  const loadingOlderRef = useRef(false)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior }), 50)
  }, [])

  // Load the page immediately older than the current oldest message.
  const loadOlder = useCallback(async () => {
    if (loadingOlderRef.current || !hasMore) return null
    const oldest = messages[0]
    if (!oldest) return null

    loadingOlderRef.current = true
    setLoadingOlder(true)
    const older = await getMessages(channelId, { before: oldest.created_at })
    setHasMore(older.length === MESSAGE_PAGE_SIZE)
    if (older.length > 0) {
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id))
        const merged = older.filter((m) => !seen.has(m.id))
        return [...merged, ...prev]
      })
    }
    setLoadingOlder(false)
    loadingOlderRef.current = false
    return older.length
  }, [channelId, hasMore, messages])

  useEffect(() => {
    if (!channelId) return
    let active = true
    setLoading(true)
    setMessages([])
    setHasMore(false)

    getMessages(channelId).then((msgs) => {
      if (!active) return
      setMessages(msgs)
      setHasMore(msgs.length === MESSAGE_PAGE_SIZE)
      setLoading(false)
      scrollToBottom('instant')
    })

    const channelIdSuffix = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`messages:${channelId}:${channelIdSuffix}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, users:users!messages_sender_id_fkey(name, avatar_url, role)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages((prev) =>
              prev.some((message) => message.id === data.id)
                ? prev
                : [...prev, data as Message]
            )
            scrollToBottom()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => m.id === payload.new.id ? { ...m, ...payload.new } : m)
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          // No channel_id filter: DELETE payloads only carry the old PK.
        },
        (payload) => {
          setMessages((prev) => prev.filter((message) => message.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId])

  return { messages, loading, loadingOlder, hasMore, loadOlder, bottomRef, setMessages, scrollToBottom }
}
