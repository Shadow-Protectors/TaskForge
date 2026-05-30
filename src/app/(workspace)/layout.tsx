import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WorkspaceShell from '@/components/layout/WorkspaceShell'

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // Get active session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // If auth user exists but profile trigger hasn't finished, wait or re-fetch
    redirect('/login')
  }

  // Fetch projects user is member of (filtered automatically by RLS)
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch completions to calculate level/XP for user dashboard
  const { count: totalCompletions } = await supabase
    .from('completions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const completionsCount = totalCompletions || 0

  return (
    <WorkspaceShell
      profile={profile}
      projects={projects || []}
      initialCompletionsCount={completionsCount}
    >
      {children}
    </WorkspaceShell>
  )
}
