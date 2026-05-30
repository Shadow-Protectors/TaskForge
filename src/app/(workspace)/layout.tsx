import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WorkspaceShell from '@/components/layout/WorkspaceShell'

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // Get active session first (required for all other queries)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Run all remaining fetches in PARALLEL — eliminates waterfall latency
  const [
    { data: profile },
    { data: projects },
    { count: totalCompletions },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('projects')
      .select('id, name, owner_id, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  if (!profile) {
    redirect('/login')
  }

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
