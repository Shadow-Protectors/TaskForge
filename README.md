<div align="center">

# 🚀 TaskForge

**A collaborative project management & gamified habit tracking platform**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

*Forge your habits. Ship your projects. Together.*

</div>

---

## ✨ Overview

**TaskForge** is a full-stack productivity web application that unifies two workflows in one sleek, dark-mode interface:

- **Collaborative Task Management** — Create projects, invite teammates, assign tasks, set priorities & due dates, and track real-time progress with live activity feeds.
- **Gamified Habit Tracking** — Build personal habits with streaks, XP, levels, and achievement badges to stay consistent every day.

---

## 🎯 Features

### 🗂️ Project Workspace
| Feature | Description |
|---|---|
| **Projects** | Create and manage multiple projects per workspace |
| **Members & Roles** | Invite teammates as `admin` or `member` via email |
| **Task Board** | Kanban-style tasks with `To Do`, `In Progress`, `Done` statuses |
| **Priorities** | Mark tasks as `High`, `Medium`, or `Low` priority |
| **Due Dates** | Assign deadlines to keep work on track |
| **Activity Feed** | Real-time log of every team action |
| **Email Invitations** | Invite users who auto-join on account creation |

### 🏆 Habit Tracker
| Feature | Description |
|---|---|
| **Daily Habits** | Create habits with custom emoji, color & category |
| **Streaks** | Track consecutive completion days with 🔥 streak counters |
| **XP & Levels** | Earn 10 XP per completion and level up |
| **Achievements** | Unlock badges (Getting Started, Week Warrior, Consistency King) |
| **Confetti 🎉** | Animated celebration on every habit completion |
| **Command Center** | Dashboard combining projects, activity feed, and today's habits |

### 🔐 Auth & Security
- Email/password authentication via Supabase Auth
- **Row Level Security (RLS)** — users can only access their own data and projects they are members of
- Auto-profile creation on signup with randomized avatar color
- Middleware-protected routes (workspace requires active session)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org) (App Router, Server Components) |
| **Language** | [TypeScript 5](https://typescriptlang.org) |
| **Database & Auth** | [Supabase](https://supabase.com) (PostgreSQL + Realtime + Auth) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Charts** | [Recharts](https://recharts.org) |
| **Animations** | [canvas-confetti](https://github.com/catdad/canvas-confetti) |

---

## 📁 Project Structure

```
taskforge/
├── src/
│   ├── app/
│   │   ├── (workspace)/          # Protected routes (requires login)
│   │   │   ├── dashboard/        # Command Center — habits + projects overview
│   │   │   ├── habits/           # Personal habit management
│   │   │   ├── projects/[id]/    # Individual project board & members
│   │   │   └── layout.tsx        # Workspace shell with sidebar navigation
│   │   ├── auth/                 # Auth callback handler
│   │   ├── login/                # Sign in / Sign up page
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing / redirect
│   ├── components/
│   │   └── layout/               # Shared UI components (sidebar, etc.)
│   ├── hooks/                    # Custom React hooks
│   ├── lib/
│   │   ├── supabase/             # Supabase client (browser + server + middleware)
│   │   └── habits/               # Streak calculation logic
│   └── middleware.ts             # Auth middleware for route protection
├── supabase_schema.sql           # Full database schema with RLS policies & triggers
├── .env.example                  # Environment variable template
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- A free [Supabase](https://supabase.com) account

### 1. Clone the repository

```bash
git clone https://github.com/Shadow-Protectors/TaskForge.git
cd TaskForge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/dashboard)
2. Go to **SQL Editor** and run the full contents of [`supabase_schema.sql`](supabase_schema.sql)
   - This creates all tables, RLS policies, triggers, and enables Realtime
3. Go to **Settings → API** and copy your **Project URL** and **anon public key**

### 4. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up and start forging! ⚡

---

## 🗄️ Database Schema

The [`supabase_schema.sql`](supabase_schema.sql) file sets up the full database with a single command. Here is an overview:

```
profiles          → Extends Supabase Auth users (name, email, avatar_color)
projects          → Team workspaces owned by a user
project_members   → Many-to-many: users ↔ projects (role: admin | member)
project_invitations → Email-based pending invitations
tasks             → Cards with title, priority, status, due_date
task_assignments  → Many-to-many: tasks ↔ users
activity_log      → Timestamped audit trail per project
habits            → Personal daily habits (emoji, color, category)
completions       → Daily habit check-ins (unique per user/habit/date)
```

**Key behaviors (via triggers):**
- 🔑 New user signup → auto-creates profile, auto-joins any pending project invitations
- 🏗️ New project created → creator is automatically added as `admin` member

---

## 🔒 Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous public key |

> ⚠️ **Never commit your `.env` file.** It is excluded by `.gitignore`. Only `.env.example` (with placeholder values) is tracked.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ by the **Shadow Protectors** team

</div>
