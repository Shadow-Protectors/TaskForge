'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeTasks, Task, ProjectMember } from '@/hooks/useRealtimeTasks'
import { 
  Plus, 
  UserPlus, 
  Users, 
  Calendar, 
  AlertCircle, 
  Clock, 
  ArrowLeft,
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import confetti from 'canvas-confetti'

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-600/30 text-indigo-300 border-indigo-500/30',
  fuchsia: 'bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-500/30',
  emerald: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-600/30 text-amber-300 border-amber-500/30',
  sky: 'bg-sky-600/30 text-sky-300 border-sky-500/30',
}

const barColorMap: Record<string, string> = {
  indigo: '#4f46e5',
  fuchsia: '#d946ef',
  emerald: '#10b981',
  amber: '#f59e0b',
  sky: '#0ea5e9',
}

const priorityColors = {
  high: 'bg-red-950/40 text-red-400 border border-red-900/30',
  medium: 'bg-amber-950/40 text-amber-400 border border-amber-900/30',
  low: 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30',
}

type FilterType = 'All' | 'Mine' | 'In progress' | 'Done'

export default function ProjectWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const projectId = params.id as string

  const { project, members, tasks, assignments, activities, loading, refresh } = useRealtimeTasks(projectId)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Filter active state
  const [activeFilter, setActiveFilter] = useState<FilterType>('All')

  // Modals / forms
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [creatingTask, setCreatingTask] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
    })
  }, [supabase])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim() || !currentUser) return
    setCreatingTask(true)

    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert([{
          project_id: projectId,
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          due_date: taskDueDate || null,
          created_by: currentUser.id,
          status: 'To Do'
        }])
        .select()
        .single()

      if (taskError) throw taskError

      if (taskData) {
        if (selectedAssignees.length > 0) {
          const assignInserts = selectedAssignees.map(uid => ({
            task_id: taskData.id,
            user_id: uid
          }))
          const { error: assignError } = await supabase
            .from('task_assignments')
            .insert(assignInserts)
          if (assignError) throw assignError
        }

        await supabase
          .from('activity_log')
          .insert([{
            project_id: projectId,
            user_id: currentUser.id,
            action: `created task "${taskTitle}"`,
            task_id: taskData.id
          }])

        // Reset
        setTaskTitle('')
        setTaskDesc('')
        setTaskPriority('medium')
        setTaskDueDate('')
        setSelectedAssignees([])
        setIsTaskModalOpen(false)
      }
    } catch (err) {
      alert('Failed to create task')
      console.error(err)
    } finally {
      setCreatingTask(false)
    }
  }

  const handleUpdateStatus = async (taskId: string, currentStatus: string, newStatus: 'To Do' | 'In Progress' | 'Done', title: string) => {
    if (!currentUser) return

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)

      if (error) throw error

      let actionVerb = `moved task "${title}" to ${newStatus}`
      if (newStatus === 'Done') {
        actionVerb = `completed task "${title}"`
        confetti({
          particleCount: 50,
          spread: 30,
          origin: { y: 0.8 },
          colors: ['#a78bfa', '#10b981']
        })
      }

      await supabase
        .from('activity_log')
        .insert([{
          project_id: projectId,
          user_id: currentUser.id,
          action: actionVerb,
          task_id: taskId
        }])
    } catch (err) {
      alert('Failed to update task status')
      console.error(err)
    }
  }

  const getTaskAssignees = (taskId: string) => {
    const taskAssigns = assignments.filter(a => a.task_id === taskId)
    return members.filter(m => taskAssigns.some(ta => ta.user_id === m.user_id))
  }

  // Filtering Logic
  const getFilteredTasks = () => {
    let filtered = tasks

    if (activeFilter === 'Mine' && currentUser) {
      const myTaskIds = assignments.filter(a => a.user_id === currentUser.id).map(a => a.task_id)
      filtered = tasks.filter(t => myTaskIds.includes(t.id))
    } else if (activeFilter === 'In progress') {
      filtered = tasks.filter(t => t.status === 'In Progress')
    } else if (activeFilter === 'Done') {
      filtered = tasks.filter(t => t.status === 'Done')
    }

    return filtered
  }

  const filteredTasks = getFilteredTasks()

  // Calculate per-member progress bars
  const memberProgressData = members.map((member) => {
    const memberTaskIds = assignments.filter(a => a.user_id === member.user_id).map(a => a.task_id)
    const memberTasks = tasks.filter(t => memberTaskIds.includes(t.id))
    const total = memberTasks.length
    const done = memberTasks.filter(t => t.status === 'Done').length
    const rate = total > 0 ? Math.round((done / total) * 100) : 0
    return {
      member,
      total,
      done,
      rate
    }
  })

  // Stacked bar chart data for sprint overview (Done vs In Progress)
  const getLast7Days = () => {
    const dates = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split('T')[0])
    }
    return dates
  }

  const chartData = getLast7Days().map(date => {
    const logsOnDay = activities.filter(a => a.created_at.split('T')[0] === date)
    const completedCount = logsOnDay.filter(a => a.action.includes('completed') || a.action.includes('to Done')).length
    const inProgressCount = tasks.filter(t => t.status === 'In Progress' && t.created_at.split('T')[0] <= date).length
    
    return {
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      'In progress': inProgressCount,
      Done: completedCount
    }
  })

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
        <Users className="w-12 h-12 text-zinc-650 animate-pulse" />
        <p className="text-sm">Accessing sprint backlog...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl max-w-xl mx-auto">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-200">Workspace not found</h3>
        <p className="text-sm text-zinc-500 mt-1">You may not be a member of this workspace.</p>
        <Link href="/dashboard" className="text-violet-400 hover:underline mt-4 inline-block font-semibold">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  // Count columns
  const todoTasks = filteredTasks.filter(t => t.status === 'To Do')
  const inProgressTasks = filteredTasks.filter(t => t.status === 'In Progress')
  const doneTasks = filteredTasks.filter(t => t.status === 'Done')

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 max-w-[1300px] mx-auto relative items-start">
      
      {/* Left/Center Area (Columns & Header) - Spans 3 columns */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* Workspace Title & Controls Top Row */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">
            {project.name}
          </h1>
          
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${projectId}/members`}
              className="bg-[#1e1e1e] border border-[#2e2e2e] hover:bg-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <UserPlus className="w-4 h-4 text-zinc-400" />
              <span>Add member</span>
            </Link>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="bg-[#1e1e1e] border border-[#2e2e2e] hover:bg-zinc-800 text-zinc-300 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4 text-zinc-400" />
              <span>New task</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-[#222] pb-4">
          {(['All', 'Mine', 'In progress', 'Done'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                activeFilter === filter
                  ? 'bg-indigo-150 text-indigo-950 border-indigo-150 font-bold'
                  : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Kanban Task Columns (Stacked vertically to match image layout style) */}
        <div className="space-y-6">
          
          {/* Column 1: In Progress */}
          {activeFilter !== 'Done' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-xxs font-bold text-zinc-500 uppercase tracking-widest">
                <span>In Progress</span>
                <span className="bg-[#222] text-zinc-400 px-1.5 py-0.2 rounded-full border border-zinc-800/60 font-semibold">{inProgressTasks.length}</span>
              </div>
              
              <div className="space-y-2">
                {inProgressTasks.length === 0 ? (
                  <p className="text-xxs text-zinc-600 italic py-2 px-1">No tasks in progress.</p>
                ) : (
                  inProgressTasks.map((task) => {
                    const taskAssignees = getTaskAssignees(task.id)
                    const isCurrentUserAssigned = currentUser && taskAssignees.some(a => a.user_id === currentUser.id)

                    return (
                      <div 
                        key={task.id}
                        className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-4 flex items-start gap-4 transition-all"
                      >
                        {/* Checkbox triggers mark as complete */}
                        <button
                          onClick={() => handleUpdateStatus(task.id, task.status, 'Done', task.title)}
                          className="w-4.5 h-4.5 border border-zinc-700 rounded bg-transparent hover:border-zinc-500 cursor-pointer flex items-center justify-center shrink-0 mt-0.5"
                        >
                          <span className="text-xxs text-transparent">✓</span>
                        </button>
                        
                        {/* Task Card Details */}
                        <div className="flex-1 min-w-0 space-y-2.5">
                          <div>
                            <h4 className="font-semibold text-sm text-white leading-tight">{task.title}</h4>
                            {task.description && (
                              <p className="text-xxs text-zinc-500 mt-1 line-clamp-1 leading-relaxed">{task.description}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xxs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                priorityColors[task.priority]
                              }`}>
                                {task.priority}
                              </span>
                              {task.due_date && (
                                <span className="text-xxs text-zinc-500 font-semibold flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                </span>
                              )}
                            </div>

                            {/* Assignees initials circles */}
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {taskAssignees.map(a => (
                                <div 
                                  key={a.user_id}
                                  className={`w-6.5 h-6.5 rounded-full text-xxs font-black flex items-center justify-center border-2 border-[#1e1e1e] shrink-0 ${
                                    colorMap[a.profiles.avatar_color] || 'bg-zinc-800 text-zinc-300'
                                  }`}
                                  title={a.profiles.name}
                                >
                                  {getInitials(a.profiles.name)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Column 2: To Do */}
          {activeFilter !== 'Done' && activeFilter !== 'In progress' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-xxs font-bold text-zinc-500 uppercase tracking-widest">
                <span>To Do</span>
                <span className="bg-[#222] text-zinc-400 px-1.5 py-0.2 rounded-full border border-zinc-800/60 font-semibold">{todoTasks.length}</span>
              </div>
              
              <div className="space-y-2">
                {todoTasks.length === 0 ? (
                  <p className="text-xxs text-zinc-600 italic py-2 px-1">No tasks in Todo.</p>
                ) : (
                  todoTasks.map((task) => {
                    const taskAssignees = getTaskAssignees(task.id)

                    return (
                      <div 
                        key={task.id}
                        className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-4 flex items-start gap-4 transition-all"
                      >
                        {/* Selector/dropdown triggers move to In Progress */}
                        <button
                          onClick={() => handleUpdateStatus(task.id, task.status, 'In Progress', task.title)}
                          className="w-4.5 h-4.5 border border-zinc-700 rounded bg-transparent hover:border-zinc-500 cursor-pointer flex items-center justify-center shrink-0 mt-0.5"
                        >
                          <span className="text-xxs text-transparent">✓</span>
                        </button>
                        
                        <div className="flex-1 min-w-0 space-y-2.5">
                          <div>
                            <h4 className="font-semibold text-sm text-white leading-tight">{task.title}</h4>
                            {task.description && (
                              <p className="text-xxs text-zinc-500 mt-1 line-clamp-1 leading-relaxed">{task.description}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xxs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                priorityColors[task.priority]
                              }`}>
                                {task.priority}
                              </span>
                              {task.due_date && (
                                <span className="text-xxs text-zinc-500 font-semibold flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex -space-x-1.5 overflow-hidden">
                              {taskAssignees.map(a => (
                                <div 
                                  key={a.user_id}
                                  className={`w-6.5 h-6.5 rounded-full text-xxs font-black flex items-center justify-center border-2 border-[#1e1e1e] shrink-0 ${
                                    colorMap[a.profiles.avatar_color] || 'bg-zinc-800 text-zinc-300'
                                  }`}
                                  title={a.profiles.name}
                                >
                                  {getInitials(a.profiles.name)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Column 3: Done */}
          {(activeFilter === 'All' || activeFilter === 'Done') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-xxs font-bold text-zinc-500 uppercase tracking-widest">
                <span>Done</span>
                <span className="bg-[#222] text-zinc-400 px-1.5 py-0.2 rounded-full border border-zinc-800/60 font-semibold">{doneTasks.length}</span>
              </div>
              
              <div className="space-y-2">
                {doneTasks.length === 0 ? (
                  <p className="text-xxs text-zinc-600 italic py-2 px-1">No completed tasks.</p>
                ) : (
                  doneTasks.map((task) => {
                    const taskAssignees = getTaskAssignees(task.id)

                    return (
                      <div 
                        key={task.id}
                        className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-4 flex items-start gap-4 opacity-60 transition-all"
                      >
                        {/* Uncheck moves back to To Do */}
                        <button
                          onClick={() => handleUpdateStatus(task.id, task.status, 'To Do', task.title)}
                          className="w-4.5 h-4.5 bg-emerald-500 rounded text-black flex items-center justify-center shrink-0 mt-0.5 border-transparent"
                        >
                          <span className="text-xxs font-black">✓</span>
                        </button>
                        
                        <div className="flex-1 min-w-0 space-y-2.5">
                          <div>
                            <h4 className="font-semibold text-sm text-zinc-400 line-through leading-tight">{task.title}</h4>
                            {task.description && (
                              <p className="text-xxs text-zinc-650 mt-1 line-through line-clamp-1 leading-relaxed">{task.description}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xxs font-bold px-2 py-0.5 rounded-full bg-slate-800/40 text-slate-500 border border-slate-900/30 uppercase tracking-wide">
                                Done
                              </span>
                              {task.due_date && (
                                <span className="text-xxs text-zinc-600 font-semibold flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex -space-x-1.5 overflow-hidden">
                              {taskAssignees.map(a => (
                                <div 
                                  key={a.user_id}
                                  className={`w-6.5 h-6.5 rounded-full text-xxs font-black flex items-center justify-center border-2 border-[#1e1e1e] shrink-0 ${
                                    colorMap[a.profiles.avatar_color] || 'bg-zinc-800 text-zinc-300'
                                  }`}
                                  title={a.profiles.name}
                                >
                                  {getInitials(a.profiles.name)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Right analytics panel matching Collabify style */}
      <div className="space-y-6 h-fit">
        
        {/* Member Progress Card */}
        <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Member progress
          </h3>
          
          <div className="space-y-4">
            {memberProgressData.map(({ member, rate }) => (
              <div key={member.user_id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full text-xxxs font-black flex items-center justify-center border ${
                      colorMap[member.profiles.avatar_color] || 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {getInitials(member.profiles.name)}
                    </div>
                    <span className="truncate max-w-[100px]">{member.profiles.name}</span>
                  </div>
                  <span className="text-xxs font-bold text-zinc-300">{rate}%</span>
                </div>
                {/* Custom colored progress bar */}
                <div className="w-full bg-[#121212] h-1.5 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${rate}%`,
                      backgroundColor: barColorMap[member.profiles.avatar_color] || '#4f46e5'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sprint Overview Card (Bar Chart) */}
        <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Sprint overview
          </h3>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 0, left: -32, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" opacity={0.5} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={9} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '10px' }}
                  labelStyle={{ color: '#a1a1aa', fontSize: '9px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#f4f4f5', fontSize: '10px' }}
                />
                <Legend iconSize={6} fontSize={8} wrapperStyle={{ fontSize: '8px', paddingTop: '8px' }} />
                <Bar dataKey="In progress" stackId="a" fill="#6366f1" opacity={0.6} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Done" stackId="a" fill="#6366f1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Recent activity
          </h3>

          <div className="space-y-3.5 max-h-52 overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-xxs text-zinc-650 italic">No activity logs recorded.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xxs leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-zinc-400">
                      <span className="font-bold text-zinc-200">{act.profiles?.name || 'Someone'}</span>{' '}
                      {act.action}
                    </p>
                    <span className="text-zinc-600 font-semibold mt-0.5 block">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* New Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Create Task</h3>
              <button 
                onClick={() => setIsTaskModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xxs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Setup database migrations"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 transition-all text-xs"
                />
              </div>

              <div>
                <label className="text-xxs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  placeholder="Optional scope details..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 transition-all text-xs h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xxs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-250 focus:outline-none focus:border-zinc-700 transition-all text-xs"
                  >
                    <option value="low" className="bg-zinc-900">Low</option>
                    <option value="medium" className="bg-zinc-900">Medium</option>
                    <option value="high" className="bg-zinc-900">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xxs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-zinc-700 transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xxs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Assign Members</label>
                <div className="space-y-2 max-h-32 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                  {members.map((m) => {
                    const isChecked = selectedAssignees.includes(m.user_id)
                    return (
                      <label key={m.user_id} className="flex items-center gap-3.5 cursor-pointer select-none text-xxs font-bold text-zinc-400 hover:text-zinc-200">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssignees([...selectedAssignees, m.user_id])
                            } else {
                              setSelectedAssignees(selectedAssignees.filter(id => id !== m.user_id))
                            }
                          }}
                          className="w-3.5 h-3.5 bg-zinc-900 border-zinc-800 text-indigo-650 rounded focus:ring-0"
                        />
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-full text-xxxs font-black flex items-center justify-center border ${
                            colorMap[m.profiles.avatar_color] || 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {getInitials(m.profiles.name)}
                          </div>
                          <span>{m.profiles.name}</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 rounded-xl py-2.5 font-semibold text-xs transition-colors border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="flex-1 bg-white hover:bg-zinc-200 text-black rounded-xl py-2.5 font-semibold text-xs transition-colors flex items-center justify-center"
                >
                  {creatingTask ? 'Creating...' : 'Create'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}
