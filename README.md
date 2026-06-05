# Academic Project Management System

A React + TypeScript application for managing academic projects, backed by **Supabase**.

## Demo
Demo: [APMS Demo](https://liacake.github.io/)

### Demo credentials
Password to all demo accounts is `Demo123<3`

**Admin account**
```
admin@esg.ipsantarem.pt
```

**Student accounts**

30 student accounts:

<1-30>demo@esg.ipsantarem.pt

for example:
```
1demo@esg.ipsantarem.pt
```

**Coordinator accounts**

10 coordinator accounts:

<31-40>demo@esg.ipsantarem.pt

for example:
```
31demo@esg.ipsantarem.pt
```


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

All operations can be done on frontend but at least one admin account must be created and have the role "admin" assigned on backend manually first.

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
