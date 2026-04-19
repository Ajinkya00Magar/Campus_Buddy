'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMessages } from '@/services/channels.service'
import type { Message } from '@/types'

export function useMessages(channelId: string) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior }), 50)
  }, [])

  useEffect(() => {
    if (!channelId) return
    setLoading(true)
    setMessages([])

    getMessages(channelId).then((msgs) => {
      setMessages(msgs)
      setLoading(false)
      scrollToBottom('instant')
    })

    const channel = supabase
      .channel(`messages:${channelId}`)
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
            .select('*, users(name, avatar_url, role)')
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId])

  return { messages, loading, bottomRef, setMessages, scrollToBottom }
}
