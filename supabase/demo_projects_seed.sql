-- ============================================================
-- Demo data: many projects + tasks for one user
-- User UUID: 80d46357-a10a-4b83-9961-6ebad5845a6e
--
-- Run in Supabase Dashboard → SQL Editor (uses elevated privileges).
-- Safe to re-run: removes prior rows titled "Demo Project …" for this owner first.
-- ============================================================

DO $$
DECLARE
  v_user constant uuid := '80d46357-a10a-4b83-9961-6ebad5845a6e';
  v_project_count constant int := 40;
  v_tasks_per_project constant int := 10;
  v_project_id uuid;
  v_i int;
  v_j int;
  v_status text;
  v_task_status text;
  v_priority text;
  v_semester text;
  v_year int;
  v_tech_id uuid;
  v_tech_names text[] := ARRAY[
    'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker',
    'Python', 'MongoDB', 'AWS', 'Vue.js', 'GraphQL',
    'Redis', 'Kubernetes', 'Supabase', 'Vite'
  ];
  v_titles text[] := ARRAY[
    'Smart Campus IoT Dashboard',
    'Peer Review Platform',
    'Automated Attendance System',
    'E-Learning Analytics Portal',
    'Robotics Control Firmware',
    'Blockchain Supply Chain Tracker',
    'AI Study Assistant',
    'Mobile Health Monitor',
    'Cybersecurity Lab Toolkit',
    'Sustainable Energy Monitor',
    'VR Chemistry Lab',
    'Microservices E-Commerce API',
    'Computer Vision Parking System',
    'Open Data GIS Portal',
    'Real-Time Chat for Capstone Teams'
  ];
  v_desc text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user) THEN
    RAISE EXCEPTION 'Profile % not found. Create the auth user / profile first.', v_user;
  END IF;

  -- Remove previous demo seed from this script (same title prefix + owner)
  DELETE FROM public.tasks
  WHERE project_id IN (
    SELECT id FROM public.projects
    WHERE owner_id = v_user AND title LIKE 'Demo Project %'
  );

  DELETE FROM public.project_technologies
  WHERE project_id IN (
    SELECT id FROM public.projects
    WHERE owner_id = v_user AND title LIKE 'Demo Project %'
  );

  DELETE FROM public.project_members
  WHERE project_id IN (
    SELECT id FROM public.projects
    WHERE owner_id = v_user AND title LIKE 'Demo Project %'
  );

  DELETE FROM public.projects
  WHERE owner_id = v_user AND title LIKE 'Demo Project %';

  FOR v_i IN 1..v_project_count LOOP
    v_status := (ARRAY['planning','active','active','completed','archived'])[1 + ((v_i - 1) % 5)];
    v_semester := (ARRAY['Fall','Spring','Summer','Winter'])[1 + ((v_i - 1) % 4)];
    v_year := 2024 + ((v_i - 1) % 3);

    v_desc := format(
      'Academic demo project #%s for SDCE/APMS seed data. Covers requirements, implementation, testing, and documentation phases. Topic: %s.',
      v_i,
      v_titles[1 + ((v_i - 1) % array_length(v_titles, 1))]
    );

    INSERT INTO public.projects (
      title,
      description,
      status,
      owner_id,
      semester,
      year,
      start_date,
      end_date,
      repository_url,
      demo_url,
      is_public
    ) VALUES (
      format('Demo Project %s: %s', lpad(v_i::text, 2, '0'), v_titles[1 + ((v_i - 1) % array_length(v_titles, 1))]),
      v_desc,
      v_status,
      v_user,
      v_semester,
      v_year,
      (date '2025-09-01' + ((v_i - 1) * 12) * interval '1 day')::date,
      (date '2026-06-30' + ((v_i - 1) * 9) * interval '1 day')::date,
      format('https://github.com/demo/apms-project-%s', v_i),
      CASE WHEN v_i % 3 = 0 THEN format('https://demo-%s.apms.example.com', v_i) ELSE NULL END,
      (v_i % 5 <> 0)  -- ~80% public
    )
    RETURNING id INTO v_project_id;

    -- Single member (the demo user)
    INSERT INTO public.project_members (project_id, user_id)
    VALUES (v_project_id, v_user)
    ON CONFLICT DO NOTHING;

    -- 2–4 technologies per project (from catalogue)
    FOR v_j IN 1..(2 + (v_i % 3)) LOOP
      SELECT id INTO v_tech_id
      FROM public.technologies
      WHERE name = v_tech_names[1 + (((v_i + v_j - 2) % array_length(v_tech_names, 1)))]
      LIMIT 1;

      IF v_tech_id IS NOT NULL THEN
        INSERT INTO public.project_technologies (project_id, technology_id)
        VALUES (v_project_id, v_tech_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;

    -- Tasks (all assigned to the same user)
    FOR v_j IN 1..v_tasks_per_project LOOP
      v_task_status := (ARRAY['todo','todo','in-progress','in-progress','review','done'])[1 + ((v_j - 1) % 6)];
      v_priority := (ARRAY['low','medium','medium','high'])[1 + ((v_j - 1) % 4)];

      INSERT INTO public.tasks (
        project_id,
        title,
        description,
        status,
        priority,
        assignee_id,
        due_date
      ) VALUES (
        v_project_id,
        format('Task %s.%s — %s', v_i, v_j, (ARRAY[
          'Draft architecture document',
          'Set up repository and CI',
          'Implement core API endpoints',
          'Build frontend screens',
          'Write unit tests',
          'Integration testing',
          'Code review fixes',
          'Prepare demo script',
          'Update README and docs',
          'Final presentation prep'
        ])[v_j]),
        format('Sprint work item %s for project %s. Deliverable tracked on the Kanban board.', v_j, v_i),
        v_task_status,
        v_priority,
        v_user,
        (current_date + ((v_i + v_j) % 45) * interval '1 day')::date
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seeded % projects × % tasks for user %',
    v_project_count, v_project_count * v_tasks_per_project, v_user;
END $$;

-- Quick verification (optional)
SELECT
  (SELECT count(*) FROM public.projects WHERE owner_id = '80d46357-a10a-4b83-9961-6ebad5845a6e'::uuid AND title LIKE 'Demo Project %') AS demo_projects,
  (SELECT count(*) FROM public.tasks t
   JOIN public.projects p ON p.id = t.project_id
   WHERE p.owner_id = '80d46357-a10a-4b83-9961-6ebad5845a6e'::uuid AND p.title LIKE 'Demo Project %') AS demo_tasks,
  (SELECT count(*) FROM public.project_members pm
   JOIN public.projects p ON p.id = pm.project_id
   WHERE p.owner_id = '80d46357-a10a-4b83-9961-6ebad5845a6e'::uuid AND p.title LIKE 'Demo Project %') AS demo_memberships;
