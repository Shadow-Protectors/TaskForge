Build a full-stack collaborative task management web app using Next.js 14 (App Router) and Supabase. It must be deployable to Vercel with zero configuration.

---

### Core features

**Members**
- Users can sign up / log in via Supabase Auth (email + password or magic link)
- After login, users see a team dashboard
- Admins can invite new members by email
- Each member has a name, avatar (initials-based), and online presence status

**Tasks**
- Create tasks with: title, description, priority (high/medium/low), due date
- Assign a task to one or more members (joint assignment)
- Tasks have statuses: To Do / In Progress / Done
- Members can mark their own assigned tasks as complete via a checkbox
- Tasks belong to a "project" or "sprint" (simple grouping)

**Progress tracking**
- Per-member progress bar showing % of assigned tasks completed
- Team-level bar chart showing tasks done vs in-progress per day (using Chart.js or Recharts)
- Real-time updates using Supabase Realtime subscriptions — when one member checks a task, all others see the change instantly

**Collaboration**
- Activity feed showing recent actions (task created, assigned, completed) with timestamps
- Members online indicator (green dot) using Supabase Presence

---

### Tech stack
- Framework: Next.js 14 with App Router and TypeScript
- Database & auth: Supabase (PostgreSQL + Supabase Auth + Realtime)
- Styling: Tailwind CSS
- Charts: Recharts
- Deployment: Vercel (use environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)

---

### Database schema (Supabase SQL)

Create these tables:
- profiles (id, name, email, avatar_color, created_at)
- projects (id, name, owner_id, created_at)
- project_members (project_id, user_id, role: 'admin'|'member')
- tasks (id, project_id, title, description, priority, status, due_date, created_by, created_at)
- task_assignments (task_id, user_id) — for joint assignment
- activity_log (id, project_id, user_id, action, task_id, created_at)

Use Row Level Security (RLS): users can only see/edit data in projects they are members of.

---

### Pages / routes
- /login — sign in / sign up
- /dashboard — list of projects the user is a member of
- /projects/[id] — main project view (task list + right panel with progress + activity)
- /projects/[id]/members — manage members, invite by email

---

### UI layout
Sidebar with nav links and online member list. Main area with task columns (grouped by status). Right panel with per-member progress bars and a daily task completion bar chart. Top bar with "Add member" and "New task" buttons. Task cards show title, priority badge, due date, and assigned member avatars.

Generate clean, production-quality code. Include the Supabase SQL migration file. Use server components where possible and client components only for interactive parts (checkboxes, real-time updates).