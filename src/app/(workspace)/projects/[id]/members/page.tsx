'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  Mail, 
  UserPlus, 
  Trash2, 
  Users, 
  Clock, 
  UserCheck, 
  ShieldAlert,
  Loader2
} from 'lucide-react'

interface Member {
  project_id: string
  user_id: string
  role: 'admin' | 'member'
  profiles: {
    name: string
    email: string
    avatar_color: string
  }
}

interface Invitation {
  id: string
  project_id: string
  email: string
  role: 'admin' | 'member'
  invited_by: string
  created_at: string
}

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-600 text-indigo-100 border-indigo-500',
  fuchsia: 'bg-fuchsia-600 text-fuchsia-100 border-fuchsia-500',
  emerald: 'bg-emerald-600 text-emerald-100 border-emerald-500',
  amber: 'bg-amber-600 text-amber-100 border-amber-500',
  sky: 'bg-sky-600 text-sky-100 border-sky-500',
}

export default function ProjectMembersPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Invite form state
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [inviting, setInviting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)

    // 1. Fetch project details
    const { data: projData } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
    setProject(projData)

    // 2. Fetch project members
    const { data: membersData } = await supabase
      .from('project_members')
      .select('project_id, user_id, role, profiles(name, email, avatar_color)')
      .eq('project_id', projectId)
    setMembers((membersData as any) || [])

    // 3. Fetch project invitations
    const { data: invitesData } = await supabase
      .from('project_invitations')
      .select('*')
      .eq('project_id', projectId)
    setInvitations(invitesData || [])

    setLoading(false)
  }, [projectId, supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
    })
    fetchData()
  }, [supabase, fetchData])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !currentUser || !project) return
    setInviting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const emailLower = email.trim().toLowerCase()

      // Check if already a member
      const isAlreadyMember = members.some(m => m.profiles.email.toLowerCase() === emailLower)
      if (isAlreadyMember) {
        throw new Error('User is already a member of this project.')
      }

      // Check if already invited
      const isAlreadyInvited = invitations.some(i => i.email.toLowerCase() === emailLower)
      if (isAlreadyInvited) {
        throw new Error('An invitation has already been sent to this email.')
      }

      // Check if user exists in public profiles (already registered in system)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', emailLower)
        .maybeSingle()

      if (existingProfile) {
        // User exists! Add directly to project_members
        const { error: insertError } = await supabase
          .from('project_members')
          .insert([{
            project_id: projectId,
            user_id: existingProfile.id,
            role: role
          }])

        if (insertError) throw insertError

        setSuccessMsg(`Successfully added ${existingProfile.name} to the project.`)
        
        // Log activity
        await supabase
          .from('activity_log')
          .insert([{
            project_id: projectId,
            user_id: currentUser.id,
            action: `added member ${existingProfile.name} as ${role}`
          }])
      } else {
        // User does not exist. Create an invitation
        const { error: inviteError } = await supabase
          .from('project_invitations')
          .insert([{
            project_id: projectId,
            email: emailLower,
            role: role,
            invited_by: currentUser.id
          }])

        if (inviteError) throw inviteError

        setSuccessMsg(`Invitation registered! Once ${emailLower} signs up, they will automatically join.`)
        
        // Log activity
        await supabase
          .from('activity_log')
          .insert([{
            project_id: projectId,
            user_id: currentUser.id,
            action: `invited ${emailLower} to the project`
          }])
      }

      setEmail('')
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process invitation.')
      console.error(err)
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (userId === project?.owner_id) {
      alert('The project owner cannot be removed.')
      return
    }
    if (!confirm(`Are you sure you want to remove ${memberName} from this project?`)) return

    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)

      if (error) throw error

      setSuccessMsg(`Successfully removed ${memberName}.`)
      
      if (currentUser) {
        await supabase
          .from('activity_log')
          .insert([{
            project_id: projectId,
            user_id: currentUser.id,
            action: `removed member ${memberName}`
          }])
      }
      fetchData()
    } catch (err) {
      alert('Failed to remove member.')
      console.error(err)
    }
  }

  const handleCancelInvitation = async (inviteId: string, inviteEmail: string) => {
    if (!confirm(`Cancel invitation for ${inviteEmail}?`)) return

    try {
      const { error } = await supabase
        .from('project_invitations')
        .delete()
        .eq('id', inviteId)

      if (error) throw error

      setSuccessMsg('Invitation cancelled.')
      fetchData()
    } catch (err) {
      alert('Failed to cancel invitation.')
      console.error(err)
    }
  }

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
        <Users className="w-12 h-12 text-indigo-500 animate-pulse" />
        <p className="text-sm">Loading member settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Back to Project Board Navigation */}
      <Link 
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group font-semibold"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Project Board</span>
      </Link>

      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">
          Manage Project Members
        </h1>
        <p className="text-slate-450 text-xs mt-1">
          Workspace administration panel for {project?.name}. Invite colleagues and adjust workspace roles.
        </p>
      </div>

      {/* Split Configuration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Invite Form */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md h-fit">
          <h2 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
            <UserPlus className="w-4.5 h-4.5 text-indigo-400" />
            <span>Invite Colleague</span>
          </h2>

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 rounded-xl text-xxs font-semibold">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/20 border border-red-900/40 text-red-400 rounded-xl text-xxs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider block mb-1">Workspace Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 px-4 text-slate-250 focus:outline-none focus:border-indigo-500 transition-colors text-xs"
              >
                <option value="member" className="bg-slate-900">Member</option>
                <option value="admin" className="bg-slate-900">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={inviting}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
            >
              {inviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Members & Invites Lists (Span 2/3) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Active Members Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
            <h2 className="text-base font-bold text-slate-200 mb-5 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-indigo-400" />
              <span>Active Workspace Members ({members.length})</span>
            </h2>

            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center border shrink-0 ${
                      colorMap[member.profiles.avatar_color] || 'bg-slate-800 text-slate-200'
                    }`}>
                      {getInitials(member.profiles.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200 truncate">{member.profiles.name}</span>
                        {member.user_id === project?.owner_id ? (
                          <span className="text-xxs px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-400 border border-amber-900/30 font-bold uppercase tracking-wide">Owner</span>
                        ) : (
                          <span className="text-xxs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 uppercase font-semibold">{member.role}</span>
                        )}
                      </div>
                      <p className="text-xxs text-slate-500 truncate mt-0.5">{member.profiles.email}</p>
                    </div>
                  </div>

                  {/* Remove Member option */}
                  {member.user_id !== project?.owner_id && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id, member.profiles.name)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-colors shrink-0"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations Card */}
          {invitations.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
              <h2 className="text-base font-bold text-slate-200 mb-5 flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-amber-500" />
                <span>Pending Invitations ({invitations.length})</span>
              </h2>

              <div className="space-y-4">
                {invitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-350 truncate">{invite.email}</span>
                          <span className="text-xxs px-1.5 py-0.2 bg-slate-800 text-slate-500 rounded uppercase font-semibold">{invite.role}</span>
                        </div>
                        <p className="text-xxs text-slate-600 mt-0.5">Invited on {new Date(invite.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Cancel Invite option */}
                    <button
                      onClick={() => handleCancelInvitation(invite.id, invite.email)}
                      className="p-2 text-slate-550 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-colors shrink-0"
                      title="Cancel Invitation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}
