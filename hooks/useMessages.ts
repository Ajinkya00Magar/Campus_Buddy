'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMessages } from '@/services/channels.service'
import type { Message } from '@/types'

export function useMessages(channelId: string, currentUserId?: string) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  /** Returns true when the user is within 120px of the bottom */
  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: 'end' })
      setShowScrollBtn(false)
    }, 30)
  }, [])

  /** Track scroll position to show/hide the jump-to-bottom button */
  const handleScroll = useCallback(() => {
    setShowScrollBtn(!isNearBottom())
  }, [isNearBottom])

  useEffect(() => {
    if (!channelId) return
    setLoading(true)
    setMessages([])
    setShowScrollBtn(false)

    getMessages(channelId).then((msgs) => {
      setMessages(msgs)
      setLoading(false)
      // Always jump instantly on channel switch
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
            setMessages((prev) => [...prev, data as Message])
            // Auto-scroll only if: sent by self OR already near bottom
            const isMine = payload.new.sender_id === currentUserId
            if (isMine || isNearBottom()) {
              scrollToBottom('smooth')
            } else {
              setShowScrollBtn(true)
            }
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

    return () => { supabase.removeChannel(channel) }
  }, [channelId])

  return {
    messages, loading,
    bottomRef, scrollContainerRef,
    setMessages, scrollToBottom,
    showScrollBtn, handleScroll,
  }
}
