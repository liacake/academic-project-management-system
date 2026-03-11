# Academic Project Management System

A React + TypeScript application for managing academic projects, backed by **Supabase**.

---

## Quick Start

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and note your:
- **Project URL** (e.g. `https://foo.supabase.co`)
- **Anon public key** (found in Project Settings → API)

### 2. Run the database schema

In the **Supabase Dashboard → SQL Editor**, paste and run the contents of:

```
supabase/schema.sql
```

This creates all tables, RLS policies, triggers, and seeds the technologies catalogue.

### 3. Create user accounts

In the **Supabase Dashboard → Authentication → Users**, click **Add user** for each person who needs access. The `handle_new_user` trigger will automatically create their profile row.

You can also set a user's role (student / coordinator / admin / guest) by editing their row in **Table Editor → profiles**.

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### 5. Install dependencies and run

**Using bun:**
```bash
bun install
bunx vite
```

**Using npm:**
```bash
npm install
npm run dev
```
