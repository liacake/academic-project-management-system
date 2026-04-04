-- ============================================================
-- Academic Project Management System – Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- -------------------------------------------------------
-- TABLES
-- -------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null check (role in ('student','coordinator','admin','guest')) default 'student',
  student_id  text,
  avatar      text,
  created_at  timestamptz default now()
);

create table if not exists public.technologies (
  id        uuid primary key default gen_random_uuid(),
  name      text not null unique,
  category  text not null check (category in ('language','framework','tool','database','cloud','other')),
  color     text not null default '#888888'
);

create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null default '',
  status          text not null check (status in ('planning','active','completed','archived')) default 'planning',
  owner_id        uuid references public.profiles(id) on delete set null,
  coordinator_id  uuid references public.profiles(id) on delete set null,
  semester        text,
  year            int,
  repository_url  text,
  demo_url        text,
  thumbnail       text,
  is_public       boolean not null default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.project_technologies (
  project_id    uuid references public.projects(id) on delete cascade,
  technology_id uuid references public.technologies(id) on delete cascade,
  primary key (project_id, technology_id)
);

create table if not exists public.project_members (
  project_id uuid references public.projects(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  primary key (project_id, user_id)
);

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

-- coordinator_invites: pending invitations for a coordinator to accept/decline
create table if not exists public.coordinator_invites (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects(id) on delete cascade not null,
  invitee_id   uuid references public.profiles(id) on delete cascade not null,
  invited_by   uuid references public.profiles(id) on delete set null,
  status       text not null check (status in ('pending','accepted','declined')) default 'pending',
  created_at   timestamptz default now(),
  unique (project_id, invitee_id)
);

-- -------------------------------------------------------
-- HELPER FUNCTIONS (all tables exist now)
-- -------------------------------------------------------

-- Breaks the projects <-> project_members RLS circular reference
create or replace function public.is_project_member(p_project_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = auth.uid()
  );
$$;

-- A user can modify a project if: they are the owner, OR the coordinator,
-- OR there is no coordinator assigned yet and they are a member.
create or replace function public.can_modify_project(p_project_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id
      and (
        p.owner_id = auth.uid()
        or p.coordinator_id = auth.uid()
        or (p.coordinator_id is null and public.is_project_member(p_project_id))
      )
  );
$$;

-- -------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- -------------------------------------------------------

alter table public.profiles             enable row level security;
alter table public.technologies         enable row level security;
alter table public.projects             enable row level security;
alter table public.project_technologies enable row level security;
alter table public.project_members      enable row level security;
alter table public.tasks                enable row level security;
alter table public.coordinator_invites  enable row level security;

-- -------------------------------------------------------
-- POLICIES
-- -------------------------------------------------------

-- profiles
create policy "Profiles viewable by authenticated users"
  on public.profiles for select using (auth.uid() is not null);

create policy "Profile can be created for authenticated user"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- technologies
create policy "Technologies readable by authenticated"
  on public.technologies for select using (auth.uid() is not null);

create policy "Admins can manage technologies"
  on public.technologies for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- projects: two SELECT policies (OR logic), no circular reference
create policy "Public projects and own projects are viewable"
  on public.projects for select
  using (is_public = true or auth.uid() = owner_id);

create policy "Project members can view their projects"
  on public.projects for select
  using (public.is_project_member(id));

create policy "Authenticated users can create projects"
  on public.projects for insert
  with check (auth.uid() = owner_id);

create policy "Authorised users can update projects"
  on public.projects for update
  using (public.can_modify_project(id));

create policy "Project owners can delete their projects"
  on public.projects for delete
  using (auth.uid() = owner_id);

-- project_technologies
create policy "Project technologies readable by authenticated"
  on public.project_technologies for select using (auth.uid() is not null);

create policy "Authorised users can manage project technologies"
  on public.project_technologies for all
  using (public.can_modify_project(project_id));

-- project_members
create policy "Project members readable by authenticated"
  on public.project_members for select using (auth.uid() is not null);

create policy "Authorised users can manage members"
  on public.project_members for all
  using (public.can_modify_project(project_id));

-- tasks
create policy "Tasks readable by project viewers"
  on public.tasks for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.is_public = true or p.owner_id = auth.uid() or public.is_project_member(p.id))
    )
  );

create policy "Members can insert tasks"
  on public.tasks for insert with check (public.can_modify_project(project_id));

create policy "Members can update tasks"
  on public.tasks for update using (public.can_modify_project(project_id));

create policy "Owners can delete tasks"
  on public.tasks for delete using (
    exists (select 1 from public.projects where id = project_id and owner_id = auth.uid())
  );

-- coordinator_invites
create policy "Invites visible to invitee and project owner"
  on public.coordinator_invites for select
  using (invitee_id = auth.uid() or invited_by = auth.uid() or
    exists (select 1 from public.projects where id = project_id and owner_id = auth.uid()));

create policy "Project members can create invites"
  on public.coordinator_invites for insert
  with check (public.can_modify_project(project_id));

create policy "Invitee can update their invite"
  on public.coordinator_invites for update
  using (invitee_id = auth.uid());

create policy "Project owner can delete invites"
  on public.coordinator_invites for delete
  using (exists (select 1 from public.projects where id = project_id and owner_id = auth.uid()));

-- -------------------------------------------------------
-- TRIGGER: accept invite → set coordinator_id on project
-- -------------------------------------------------------

create or replace function public.handle_invite_accepted()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    update public.projects
    set coordinator_id = new.invitee_id, updated_at = now()
    where id = new.project_id;
  end if;
  return new;
end;
$$;

create trigger trg_invite_accepted
  after update on public.coordinator_invites
  for each row execute procedure public.handle_invite_accepted();

-- -------------------------------------------------------
-- TRIGGERS: auto-update updated_at
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
-- TRIGGER: auto-create profile on sign-up
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
-- ANON (guest) read access for public projects
-- Allows unauthenticated users to browse public projects.
-- -------------------------------------------------------
create policy "Anon users can view public projects"
  on public.projects for select
  using (is_public = true);

create policy "Anon users can view technologies of public projects"
  on public.project_technologies for select
  using (exists (
    select 1 from public.projects where id = project_id and is_public = true
  ));

create policy "Anon users can view members count of public projects"
  on public.project_members for select
  using (exists (
    select 1 from public.projects where id = project_id and is_public = true
  ));

create policy "Technologies readable by anon"
  on public.technologies for select using (true);

-- -------------------------------------------------------
-- SEED: technology catalogue
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
