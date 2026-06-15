'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserChannelMembers } from '@/services/channels.service'
import type { Channel } from '@/types'

export function useUnreadBadges(userId: string | undefined, channels: Channel[] = []) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [mutedChannels, setMutedChannels] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const mutedRef = useRef<Set<string>>(new Set())

  // Keep a ref of channels to access in real-time callbacks without causing re-renders
  const channelsRef = useRef(channels)
  useEffect(() => {
    channelsRef.current = channels
  }, [channels])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    let isMounted = true

    async function fetchInitial() {
      if (!userId) return
      const { data: members } = await getUserChannelMembers(userId)
      if (!members || !isMounted) return

      const muted = new Set<string>()
      const lastReadMap: Record<string, string> = {}
      
      members.forEach((m: any) => {
        if (m.muted) muted.add(m.channel_id)
        if (m.last_read_at) lastReadMap[m.channel_id] = m.last_read_at
      })

      setMutedChannels(muted)
      mutedRef.current = muted

      // Fetch recent messages across all channels to estimate unread counts
      const counts: Record<string, number> = {}
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7) // Only look back 7 days

      const { data: recentMessages } = await supabase
        .from('messages')
        .select('channel_id, created_at, sender_id')
        .gt('created_at', cutoff.toISOString())
        .neq('sender_id', userId)

      if (recentMessages) {
        recentMessages.forEach(msg => {
          const lastRead = lastReadMap[msg.channel_id] || '2000-01-01T00:00:00.000Z'
          if (new Date(msg.created_at) > new Date(lastRead)) {
            counts[msg.channel_id] = (counts[msg.channel_id] || 0) + 1
          }
        })
      }

      if (isMounted) {
        setUnreadCounts(counts)
      }
    }

    fetchInitial()

    const channelListener = supabase.channel(`messages-badges:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as any
          if (msg.sender_id === userId) return
          
          setUnreadCounts(prev => ({
            ...prev,
            [msg.channel_id]: (prev[msg.channel_id] || 0) + 1
          }))
          
          // Browser Notification
          if (!mutedRef.current.has(msg.channel_id)) {
            // Check if user is currently viewing this channel
            const isViewing = typeof window !== 'undefined' && window.location.pathname === `/channels/${msg.channel_id}`
            if (!isViewing && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              const channelData = channelsRef.current.find(c => c.id === msg.channel_id)
              const channelName = channelData ? `#${channelData.name}` : 'New message'
              let body = msg.content || 'Shared a file'
              if (body.length > 50) body = body.substring(0, 50) + '...'
              
              new Notification(channelName, {
                body: body,
                icon: '/icon.svg'
              })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'channel_members', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newMember = payload.new as any
          const oldMember = payload.old as any
          
          if (newMember.last_read_at !== oldMember.last_read_at) {
             setUnreadCounts(prev => ({ ...prev, [newMember.channel_id]: 0 }))
          }
          if (newMember.muted !== oldMember.muted) {
             setMutedChannels(prev => {
               const next = new Set(prev)
               if (newMember.muted) next.add(newMember.channel_id)
               else next.delete(newMember.channel_id)
               mutedRef.current = next
               return next
             })
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channelListener)
    }
  }, [userId])

  const markChannelRead = (channelId: string) => {
    setUnreadCounts(prev => ({ ...prev, [channelId]: 0 }))
  }

  const toggleMute = (channelId: string) => {
    setMutedChannels(prev => {
      const next = new Set(prev)
      if (next.has(channelId)) next.delete(channelId)
      else next.add(channelId)
      mutedRef.current = next
      return next
    })
  }

  return { unreadCounts, mutedChannels, markChannelRead, toggleMute }
}
