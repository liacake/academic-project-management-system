-- ============================================================
-- Academic Project Management System – Supabase Schema (fixed)
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Profiles (extends auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null check (role in ('student','coordinator','admin','guest')) default 'student',
  student_id  text,
  avatar      text,
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated users"
  on public.profiles for select using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- 2. Technologies (shared catalogue)
create table if not exists public.technologies (
  id        uuid primary key default gen_random_uuid(),
  name      text not null unique,
  category  text not null check (category in ('language','framework','tool','database','cloud','other')),
  color     text not null default '#888888'
);
alter table public.technologies enable row level security;

create policy "Technologies readable by authenticated"
  on public.technologies for select using (auth.role() = 'authenticated');

create policy "Admins can manage technologies"
  on public.technologies for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3. Projects
create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null default '',
  status          text not null check (status in ('planning','active','completed','archived')) default 'planning',
  owner_id        uuid references public.profiles(id) on delete set null,
  semester        text,
  year            int,
  repository_url  text,
  demo_url        text,
  thumbnail       text,
  is_public       boolean not null default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.projects enable row level security;

-- ── FIX: separate SELECT into two non-recursive policies ──────────────────
-- Policy 1: owner or public — no cross-table join needed
create policy "Owners and public projects are viewable"
  on public.projects for select
  using (is_public = true or auth.uid() = owner_id);

-- Policy 2: members — uses a security definer function to break the cycle
create or replace function public.is_project_member(project_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.project_members
    where project_members.project_id = $1
      and project_members.user_id = auth.uid()
  );
$$;

create policy "Project members can view their projects"
  on public.projects for select
  using (public.is_project_member(id));

-- ── INSERT: simple — no recursive reference needed ────────────────────────
create policy "Authenticated users can create projects"
  on public.projects for insert
  with check (auth.uid() = owner_id);

-- ── UPDATE / DELETE: owner only ───────────────────────────────────────────
create policy "Project owners can update their projects"
  on public.projects for update
  using (auth.uid() = owner_id);

create policy "Project owners can delete their projects"
  on public.projects for delete
  using (auth.uid() = owner_id);

-- 4. Project ↔ Technology (many-to-many)
create table if not exists public.project_technologies (
  project_id    uuid references public.projects(id) on delete cascade,
  technology_id uuid references public.technologies(id) on delete cascade,
  primary key (project_id, technology_id)
);
alter table public.project_technologies enable row level security;

create policy "Project technologies readable by authenticated"
  on public.project_technologies for select
  using (auth.role() = 'authenticated');

create policy "Owners can manage project technologies"
  on public.project_technologies for all
  using (exists (
    select 1 from public.projects
    where id = project_id and owner_id = auth.uid()
  ));

-- 5. Project Members (many-to-many)
create table if not exists public.project_members (
  project_id uuid references public.projects(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  primary key (project_id, user_id)
);
alter table public.project_members enable row level security;

create policy "Project members readable by authenticated"
  on public.project_members for select
  using (auth.role() = 'authenticated');

create policy "Owners can manage members"
  on public.project_members for all
  using (exists (
    select 1 from public.projects
    where id = project_id and owner_id = auth.uid()
  ));

-- 6. Tasks
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade not null,
  title       text not null,
  description text,
  status      text not null check (status in ('todo','in-progress','review','done')) default 'todo',
  priority    text not null check (priority in ('low','medium','high')) default 'medium',
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date    date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.tasks enable row level security;

create policy "Tasks readable by project viewers"
  on public.tasks for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.is_public = true
             or p.owner_id = auth.uid()
             or public.is_project_member(p.id))
    )
  );

create policy "Members can insert tasks"
  on public.tasks for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid()
             or public.is_project_member(p.id))
    )
  );

create policy "Members can update tasks"
  on public.tasks for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid()
             or public.is_project_member(p.id))
    )
  );

create policy "Owners can delete tasks"
  on public.tasks for delete using (
    exists (
      select 1 from public.projects
      where id = project_id and owner_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- Helper: auto-update updated_at on projects & tasks
-- -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_projects_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();

create trigger trg_tasks_updated_at before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- -------------------------------------------------------
-- Helper: create profile row when a new auth user signs up
-- -------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -------------------------------------------------------
-- Seed: technologies
-- -------------------------------------------------------
insert into public.technologies (name, category, color) values
  ('React',       'framework', '#61DAFB'),
  ('TypeScript',  'language',  '#3178C6'),
  ('Node.js',     'framework', '#339933'),
  ('PostgreSQL',  'database',  '#4169E1'),
  ('Docker',      'tool',      '#2496ED'),
  ('Python',      'language',  '#3776AB'),
  ('MongoDB',     'database',  '#47A248'),
  ('AWS',         'cloud',     '#FF9900'),
  ('Vue.js',      'framework', '#4FC08D'),
  ('GraphQL',     'tool',      '#E10098'),
  ('Redis',       'database',  '#DC382D'),
  ('Kubernetes',  'cloud',     '#326CE5'),
  ('Supabase',    'database',  '#3ECF8E'),
  ('Vite',        'tool',      '#646CFF')
on conflict (name) do nothing;
