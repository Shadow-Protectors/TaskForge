// SERVER COMPONENT — no 'use client' directive
// All data is fetched here on the server in parallel, no double-fetching.
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayStr = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch habits, completions, activity log ALL IN PARALLEL
  const [
    { data: habits },
    { data: completions },
    { count: totalCompletions },
    { data: activities },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, emoji, color')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),

    supabase
      .from('completions')
      .select('id, habit_id, date')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]),

    supabase
      .from('completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),

    supabase
      .from('activity_log')
      .select('id, action, created_at, project_id, projects(name), profiles(name)')
      .order('created_at', { ascending: false })
      .limit(6),

    supabase
      .from('projects')
      .select('id, name, owner_id, created_at')
      .order('created_at', { ascending: false }),
  ])

  return (
    <DashboardClient
      userId={user.id}
      habits={habits || []}
      initialCompletions={completions || []}
      initialCompletionsCount={totalCompletions || 0}
      activities={(activities as any) || []}
      projects={projects || []}
      todayStr={todayStr}
    />
  )
}
