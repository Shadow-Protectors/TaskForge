-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create Profiles Table (extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null unique,
  avatar_color text not null default 'indigo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Projects Table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Project Members Table
create table public.project_members (
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text check (role in ('admin', 'member')) not null default 'member',
  primary key (project_id, user_id)
);

-- 5. Create Project Invitations (For email-based invitations)
create table public.project_invitations (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  email text not null,
  role text check (role in ('admin', 'member')) not null default 'member',
  invited_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (project_id, email)
);

-- 6. Create Tasks Table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  priority text check (priority in ('high', 'medium', 'low')) not null default 'medium',
  status text check (status in ('To Do', 'In Progress', 'Done')) not null default 'To Do',
  due_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Create Task Assignments (Joint Assignment)
create table public.task_assignments (
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

-- 8. Create Activity Log Table
create table public.activity_log (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  task_id uuid references public.tasks(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Create Habits Table
create table public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  emoji text not null default '✅',
  category text not null default 'General',
  color text not null default '#8b5cf6',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Create Completions Table
create table public.completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  habit_id uuid references public.habits(id) on delete cascade not null,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, habit_id, date)
);

---------------------------------------------------------
-- SECURITY DEFINER HELPER (Prevents RLS Recursion)
---------------------------------------------------------
create or replace function public.is_project_member(project_uuid uuid, user_uuid uuid)
returns boolean security definer stable as $$
begin
  return exists (
    select 1 from public.project_members
    where project_id = project_uuid and user_id = user_uuid
  );
end;
$$ language plpgsql;

---------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invitations enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.activity_log enable row level security;
alter table public.habits enable row level security;
alter table public.completions enable row level security;

-- Profiles
create policy "Allow public read-only profiles" on public.profiles for select using (true);
create policy "Allow users to update own profile" on public.profiles for update using (auth.uid() = id);

-- Projects
create policy "Allow members to view projects" on public.projects for select using (public.is_project_member(id, auth.uid()));
create policy "Allow anyone authenticated to create projects" on public.projects for insert with check (auth.uid() = owner_id);
create policy "Allow owners to update/delete projects" on public.projects for all using (auth.uid() = owner_id);

-- Project Members
create policy "Allow members to view membership" on public.project_members for select using (public.is_project_member(project_id, auth.uid()));
create policy "Allow project admins/owners to manage members" on public.project_members for all using (
  exists (select 1 from public.projects where id = project_id and owner_id = auth.uid()) or
  exists (select 1 from public.project_members where project_id = project_id and user_id = auth.uid() and role = 'admin')
);

-- Project Invitations
create policy "Allow members to view invitations" on public.project_invitations for select using (public.is_project_member(project_id, auth.uid()));
create policy "Allow project admins/owners to manage invitations" on public.project_invitations for all using (
  exists (select 1 from public.projects where id = project_id and owner_id = auth.uid()) or
  exists (select 1 from public.project_members where project_id = project_id and user_id = auth.uid() and role = 'admin')
);

-- Tasks
create policy "Allow project members to view/manage tasks" on public.tasks for all using (public.is_project_member(project_id, auth.uid()));

-- Task Assignments
create policy "Allow project members to view assignments" on public.task_assignments for select using (
  exists (select 1 from public.tasks where id = task_id and public.is_project_member(project_id, auth.uid()))
);
create policy "Allow project members to manage assignments" on public.task_assignments for all using (
  exists (select 1 from public.tasks where id = task_id and public.is_project_member(project_id, auth.uid()))
);

-- Activity Log
create policy "Allow project members to view activity" on public.activity_log for select using (public.is_project_member(project_id, auth.uid()));
create policy "Allow project members to insert logs" on public.activity_log for insert with check (public.is_project_member(project_id, auth.uid()));

-- Habits (Personal)
create policy "Allow users to manage own habits" on public.habits for all using (auth.uid() = user_id);

-- Completions (Personal)
create policy "Allow users to manage own completions" on public.completions for all using (auth.uid() = user_id);

---------------------------------------------------------
-- TRIGGERS
---------------------------------------------------------

-- A. Auto-Create Profile & Process Invitations on Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    case floor(random() * 5)::integer
      when 0 then 'indigo'
      when 1 then 'fuchsia'
      when 2 then 'emerald'
      when 3 then 'amber'
      else 'sky'
    end
  );
  
  -- Automatically join projects they were previously invited to
  insert into public.project_members (project_id, user_id, role)
  select project_id, new.id, role
  from public.project_invitations
  where email = new.email;
  
  delete from public.project_invitations where email = new.email;
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- B. Auto-Assign Project Creator as Owner & Member
create or replace function public.handle_new_project()
returns trigger as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'admin');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_project_created
  after insert on public.projects
  for each row execute procedure public.handle_new_project();

---------------------------------------------------------
-- ENABLE REALTIME REPLICATION
---------------------------------------------------------
begin;
  -- Remove existing if any
  alter publication supabase_realtime remove table public.tasks;
  alter publication supabase_realtime remove table public.task_assignments;
  alter publication supabase_realtime remove table public.profiles;
  alter publication supabase_realtime remove table public.activity_log;
exception when others then
  -- Ignore if they weren't in publication
end;

alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.task_assignments;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.activity_log;
