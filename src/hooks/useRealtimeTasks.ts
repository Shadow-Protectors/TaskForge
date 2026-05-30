import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Task {
  id: string
  project_id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'To Do' | 'In Progress' | 'Done'
  due_date: string | null
  created_by: string
  created_at: string
}

export interface TaskAssignment {
  task_id: string
  user_id: string
}

export interface ProjectMember {
  project_id: string
  user_id: string
  role: 'admin' | 'member'
  profiles: {
    name: string
    email: string
    avatar_color: string
  }
}

export interface Activity {
  id: string
  project_id: string
  user_id: string
  action: string
  task_id: string
  created_at: string
  profiles: {
    name: string
  }
}

export function useRealtimeTasks(projectId: string) {
  const supabase = createClient()
  
  const [project, setProject] = useState<any>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [assignments, setAssignments] = useState<TaskAssignment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    // 1. Fetch Project Info
    const { data: projectData } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
    setProject(projectData)

    // 2. Fetch Members
    const { data: membersData } = await supabase
      .from('project_members')
      .select('project_id, user_id, role, profiles(name, email, avatar_color)')
      .eq('project_id', projectId)
    setMembers((membersData as any) || [])

    // 3. Fetch Tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setTasks(tasksData || [])

    // 4. Fetch Assignments
    const { data: assignmentsData } = await supabase
      .from('task_assignments')
      .select('task_id, user_id')
      .in('task_id', (tasksData || []).map(t => t.id).concat([projectId])) // concat dummy just in case empty
    setAssignments(assignmentsData || [])

    // 5. Fetch Activity Logs
    const { data: activitiesData } = await supabase
      .from('activity_log')
      .select('id, project_id, user_id, action, task_id, created_at, profiles(name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20)
    setActivities((activitiesData as any) || [])

    setLoading(false)
  }, [projectId, supabase])

  useEffect(() => {
    fetchData()

    // Subscribe to Postgres Changes for tasks, assignments, and activity_log in this project
    const channel = supabase.channel(`project_realtime:${projectId}`)
      
      // Tasks table listener
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `project_id=eq.${projectId}` 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [payload.new as Task, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? (payload.new as Task) : t))
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id))
        }
      })

      // Task Assignments listener
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'task_assignments'
      }, async (payload) => {
        // Since we can't filter joint tables by project_id in realtime, we fetch them again or check if they belong to tasks we track
        if (payload.eventType === 'INSERT') {
          const newAssign = payload.new as TaskAssignment
          setAssignments(prev => [...prev, newAssign])
        } else if (payload.eventType === 'DELETE') {
          const oldAssign = payload.old as TaskAssignment
          setAssignments(prev => prev.filter(a => !(a.task_id === oldAssign.task_id && a.user_id === oldAssign.user_id)))
        }
      })

      // Activity logs listener
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activity_log',
        filter: `project_id=eq.${projectId}`
      }, async (payload) => {
        // Fetch new log with profile name relation
        const { data: logWithProfile } = await supabase
          .from('activity_log')
          .select('id, project_id, user_id, action, task_id, created_at, profiles(name)')
          .eq('id', payload.new.id)
          .single()
        
        if (logWithProfile) {
          setActivities(prev => [logWithProfile as any, ...prev.slice(0, 19)])
        }
      })

      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [projectId, supabase, fetchData])

  return { project, members, tasks, assignments, activities, loading, refresh: fetchData }
}
