'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { usePresence } from '@/hooks/usePresence'
import { 
  Check,
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Folder,
  Plus,
  Sliders,
  Trash2
} from 'lucide-react'

interface Project {
  id: string
  name: string
  owner_id: string
  created_at: string
}

interface Profile {
  id: string
  name: string
  email: string
  avatar_color: string
}

interface WorkspaceShellProps {
  profile: Profile
  projects: Project[]
  initialCompletionsCount: number
  children: React.ReactNode
}

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-600/30 text-indigo-300 border-indigo-500/30',
  fuchsia: 'bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-500/30',
  emerald: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-600/30 text-amber-300 border-amber-500/30',
  sky: 'bg-sky-600/30 text-sky-300 border-sky-500/30',
}

const colors = ['indigo', 'fuchsia', 'emerald', 'amber', 'sky']

export default function WorkspaceShell({
  profile: initialProfile,
  projects: initialProjects,
  initialCompletionsCount,
  children,
}: WorkspaceShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Modals state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [displayName, setDisplayName] = useState(profile.name)
  const [avatarColor, setAvatarColor] = useState(profile.avatar_color)
  const [updatingSettings, setUpdatingSettings] = useState(false)

  // Presence
  const onlineUsers = usePresence(profile)

  // Active Project Context
  const activeProjectId = pathname.startsWith('/projects/') 
    ? pathname.split('/')[2] 
    : ''
  const activeProject = projects.find(p => p.id === activeProjectId)
  const isProjectOwner = activeProject?.owner_id === profile.id
  const [projectRename, setProjectRename] = useState(activeProject?.name || '')

  useEffect(() => {
    if (activeProject) {
      setProjectRename(activeProject.name)
    }
  }, [activeProjectId, activeProject])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return
    setCreatingProject(true)

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name: newProjectName, owner_id: profile.id }])
        .select()
        .single()

      if (error) throw error

      if (data) {
        setProjects([data, ...projects])
        setNewProjectName('')
        setIsNewProjectModalOpen(false)
        router.push(`/projects/${data.id}`)
        router.refresh()
      }
    } catch (err) {
      alert('Failed to create project')
      console.error(err)
    } finally {
      setCreatingProject(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingSettings(true)

    try {
      // 1. Update user profile details
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: displayName, avatar_color: avatarColor })
        .eq('id', profile.id)

      if (profileError) throw profileError

      setProfile(prev => ({ ...prev, name: displayName, avatar_color: avatarColor }))

      // 2. If workspace owner & renaming project
      if (activeProject && isProjectOwner && projectRename.trim() && projectRename !== activeProject.name) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ name: projectRename })
          .eq('id', activeProjectId)

        if (projectError) throw projectError

        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, name: projectRename } : p))
      }

      setIsSettingsModalOpen(false)
      router.refresh()
    } catch (err) {
      alert('Failed to update settings')
      console.error(err)
    } finally {
      setUpdatingSettings(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!activeProject || !isProjectOwner) return
    if (!confirm(`Are you sure you want to delete the workspace "${activeProject.name}"? This deletes all columns, tasks, and data permanently.`)) return
    setUpdatingSettings(true)

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', activeProjectId)

      if (error) throw error

      setProjects(prev => prev.filter(p => p.id !== activeProjectId))
      setIsSettingsModalOpen(false)
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      alert('Failed to delete workspace')
      console.error(err)
    } finally {
      setUpdatingSettings(false)
    }
  }

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  const isNavActive = (basePath: string) => {
    if (basePath === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(basePath)
  }

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-200 flex relative overflow-hidden font-sans">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden absolute top-4 left-4 z-40 p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-40"
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-64 bg-[#181818] border-r border-[#262626] p-6 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Brand Header: "Collabify" */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#2e2e2e] border border-[#3e3e3e] flex items-center justify-center">
              <Check className="w-4 h-4 text-white stroke-[3px]" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              TaskForge
            </span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Navigation Options */}
        <nav className="space-y-1 mb-6">
          <Link 
            href="/dashboard"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isNavActive('/dashboard') 
                ? 'bg-zinc-800/80 text-white' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" />
            <span>Dashboard</span>
          </Link>

          <Link 
            href={activeProjectId ? `/projects/${activeProjectId}` : (projects[0]?.id ? `/projects/${projects[0].id}` : '/dashboard')}
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              pathname.includes('/projects/') && !pathname.includes('/members')
                ? 'bg-zinc-800/80 text-white' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
            }`}
          >
            <CheckSquare className="w-4.5 h-4.5" />
            <span>Tasks</span>
          </Link>

          <Link 
            href="/habits"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isNavActive('/habits') 
                ? 'bg-zinc-800/80 text-white' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            <span>Progress</span>
          </Link>

          <Link 
            href={activeProjectId ? `/projects/${activeProjectId}/members` : (projects[0]?.id ? `/projects/${projects[0].id}/members` : '/dashboard')}
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              pathname.includes('/members')
                ? 'bg-zinc-800/80 text-white' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Members</span>
          </Link>

          <button 
            onClick={() => {
              setIsSidebarOpen(false)
              setIsSettingsModalOpen(true)
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 transition-all text-left"
          >
            <Settings className="w-4.5 h-4.5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Dynamic Project List */}
        <div className="mb-6 flex-1 overflow-y-auto min-h-0 border-t border-[#262626] pt-4">
          <div className="flex items-center justify-between px-3 mb-2 text-xxs font-bold text-zinc-500 uppercase tracking-widest">
            <span>Workspaces</span>
            <button 
              onClick={() => setIsNewProjectModalOpen(true)}
              className="text-zinc-400 hover:text-zinc-200 p-0.5 hover:bg-zinc-900 rounded transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {projects.length === 0 ? (
            <div className="text-xxs text-zinc-600 px-3 py-2 italic">
              No workspaces active.
            </div>
          ) : (
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {projects.map((proj) => (
                <Link 
                  key={proj.id}
                  href={`/projects/${proj.id}`}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all ${
                    activeProjectId === proj.id
                      ? 'bg-zinc-900 text-zinc-200 font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-900/30 hover:text-zinc-200'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                  <span className="truncate">{proj.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* TEAM ONLINE Section */}
        <div className="border-t border-[#262626] pt-4 mb-4">
          <div className="px-3 mb-3 text-xxs font-bold text-zinc-500 uppercase tracking-widest">
            <span>Team Online</span>
          </div>
          <div className="space-y-2.5 max-h-36 overflow-y-auto px-1">
            {onlineUsers.map((user) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded-full text-xxs font-bold flex items-center justify-center border shrink-0 ${
                    colorMap[user.avatarColor] || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}>
                    {getInitials(user.name)}
                  </div>
                  <span className="text-xs font-semibold text-zinc-300 truncate">{user.name}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* User Account / Signout */}
        <div className="border-t border-[#262626] pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full text-xxs font-bold flex items-center justify-center border shrink-0 ${
              colorMap[profile.avatar_color] || 'bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}>
              {getInitials(profile.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate leading-tight">{profile.name}</p>
              <p className="text-xxs text-zinc-500 truncate mt-0.5">{profile.email}</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Create Workspace Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Create Workspace</h3>
              <button 
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xxs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sprint Planning"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 transition-all text-xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 rounded-xl py-2.5 font-semibold text-xs transition-colors border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="flex-1 bg-white hover:bg-zinc-200 text-black rounded-xl py-2.5 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {creatingProject ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Configuration Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-400" />
                <span>Account & Workspace Settings</span>
              </h3>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSettings} className="space-y-5">
              
              {/* Profile Settings */}
              <div className="space-y-3.5 border-b border-zinc-800 pb-5">
                <p className="text-xxs font-bold text-zinc-500 uppercase tracking-wider">Profile Settings</p>
                
                <div>
                  <label className="text-xxs font-semibold text-zinc-400 block mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-200 focus:outline-none focus:border-zinc-700 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xxs font-semibold text-zinc-400 block mb-2">Avatar Theme</label>
                  <div className="flex items-center gap-2.5">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatarColor(c)}
                        className={`w-7 h-7 rounded-full border transition-transform ${
                          avatarColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{
                          backgroundColor: c === 'indigo' ? '#4f46e5' : c === 'fuchsia' ? '#d946ef' : c === 'emerald' ? '#10b981' : c === 'amber' ? '#f59e0b' : '#0ea5e9'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Workspace Settings (if inside active workspace) */}
              {activeProject && (
                <div className="space-y-3.5">
                  <p className="text-xxs font-bold text-zinc-500 uppercase tracking-wider">Active Workspace Settings</p>
                  
                  {isProjectOwner ? (
                    <>
                      <div>
                        <label className="text-xxs font-semibold text-zinc-400 block mb-1">Rename Workspace</label>
                        <input
                          type="text"
                          required
                          value={projectRename}
                          onChange={(e) => setProjectRename(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-200 focus:outline-none focus:border-zinc-700 text-xs"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleDeleteProject}
                          className="w-full bg-red-950/20 border border-red-900/30 hover:bg-red-900 hover:text-white text-red-400 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Workspace Permanently</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-xxs text-zinc-500 italic">
                      You are a member of this workspace. Only the workspace owner ({activeProject.owner_id === profile.id ? 'You' : 'another admin'}) can rename or delete this workspace.
                    </p>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 rounded-xl py-2.5 font-semibold text-xs transition-colors border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingSettings}
                  className="flex-1 bg-white hover:bg-zinc-200 text-black rounded-xl py-2.5 font-semibold text-xs transition-colors flex items-center justify-center"
                >
                  {updatingSettings ? 'Updating...' : 'Save Settings'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}
