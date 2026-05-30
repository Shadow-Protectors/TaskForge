import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface OnlineUser {
  userId: string
  name: string
  email: string
  avatarColor: string
  onlineAt: string
}

export function usePresence(currentUserProfile: { id: string; name: string; email: string; avatar_color: string } | null) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!currentUserProfile) return

    const channel = supabase.channel('online_presence', {
      config: {
        presence: {
          key: currentUserProfile.id,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const formattedUsers: OnlineUser[] = []

        Object.keys(state).forEach((key) => {
          const presenceList = state[key] as any
          if (presenceList && presenceList.length > 0) {
            const data = presenceList[0]
            formattedUsers.push({
              userId: key,
              name: data.name || 'Anonymous',
              email: data.email || '',
              avatarColor: data.avatarColor || 'indigo',
              onlineAt: data.onlineAt || new Date().toISOString(),
            })
          }
        })

        setOnlineUsers(formattedUsers)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: currentUserProfile.name,
            email: currentUserProfile.email,
            avatarColor: currentUserProfile.avatar_color,
            onlineAt: new Date().toISOString(),
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [currentUserProfile, supabase])

  return onlineUsers
}
