-- ============================================================
-- Demo data: many projects + tasks for one owner user
-- Owner UUID: 80d46357-a10a-4b83-9961-6ebad5845a6e
--
-- Run in Supabase Dashboard → SQL Editor (uses elevated privileges).
-- Safe to re-run: removes prior rows from this script (repository_url marker
-- or legacy "Demo Project %" titles) for this owner first.
-- ============================================================

DO $$
DECLARE
  v_user constant uuid := '80d46357-a10a-4b83-9961-6ebad5845a6e';
  v_seed_repo_prefix constant text := 'https://github.com/demo/apms-seed-';
  v_legacy_repo_prefix constant text := 'https://github.com/demo/apms-project-';
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
  v_title text;
  v_desc text;
  v_coord_id uuid;
  v_member_count int;
  v_student_count int;
  v_assignee_id uuid;
  v_coordinator_ids uuid[];
  v_member_ids uuid[];
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
    'Real-Time Chat for Capstone Teams',
    'Library Seat Booking App',
    'Nutrition Tracking Wearable Sync',
    'Sign Language Recognition Module',
    'Campus Event Discovery Feed',
    'Automated Essay Feedback Tool',
    'Drone Path Planning Simulator',
    'Smart Greenhouse Controller',
    'Accessibility Audit Chrome Extension',
    'Peer Tutoring Marketplace',
    'Incident Response Playbook Wiki',
    'Music Practice Progress Tracker',
    'Waste Sorting CV Classifier',
    'Public Transport Delay Predictor',
    'Clinical Trial Data Explorer',
    'Language Exchange Matching App',
    '3D Printer Farm Monitor',
    'Volunteer Shift Scheduler',
    'Mental Wellness Check-In Portal',
    'Historical Archive Digitizer',
    'Fleet Maintenance Log System',
    'Adaptive Quiz Generator',
    'Urban Noise Pollution Map',
    'Recipe Scaling & Nutrition API',
    'Offline-First Field Survey Tool',
    'Collaborative Whiteboard for Labs'
  ];
  v_task_titles text[] := ARRAY[
    'Draft architecture document',
    'Set up repository and CI',
    'Implement core API endpoints',
    'Build frontend screens',
    'Write unit tests',
    'Integration testing',
    'Code review fixes',
    'Prepare presentation',
    'Update README and docs',
    'Final presentation prep'
  ];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user) THEN
    RAISE EXCEPTION 'Profile % not found. Create the auth user / profile first.', v_user;
  END IF;

  SELECT coalesce(array_agg(id ORDER BY random()), ARRAY[]::uuid[])
  INTO v_coordinator_ids
  FROM public.profiles
  WHERE role = 'coordinator';

  IF coalesce(array_length(v_coordinator_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'At least one coordinator profile is required for demo seed.';
  END IF;

  SELECT count(*)::int
  INTO v_student_count
  FROM public.profiles
  WHERE role = 'student' AND id <> v_user;

  -- Remove previous demo seed (this script + legacy title prefix)
  DELETE FROM public.tasks
  WHERE project_id IN (
    SELECT id FROM public.projects
    WHERE owner_id = v_user
      AND (
        repository_url LIKE v_seed_repo_prefix || '%'
        OR repository_url LIKE v_legacy_repo_prefix || '%'
        OR title LIKE 'Demo Project %'
      )
  );

  DELETE FROM public.project_technologies
  WHERE project_id IN (
    SELECT id FROM public.projects
    WHERE owner_id = v_user
      AND (
        repository_url LIKE v_seed_repo_prefix || '%'
        OR repository_url LIKE v_legacy_repo_prefix || '%'
        OR title LIKE 'Demo Project %'
      )
  );

  DELETE FROM public.coordinator_invites
  WHERE project_id IN (
    SELECT id FROM public.projects
    WHERE owner_id = v_user
      AND (
        repository_url LIKE v_seed_repo_prefix || '%'
        OR repository_url LIKE v_legacy_repo_prefix || '%'
        OR title LIKE 'Demo Project %'
      )
  );

  DELETE FROM public.project_members
  WHERE project_id IN (
    SELECT id FROM public.projects
    WHERE owner_id = v_user
      AND (
        repository_url LIKE v_seed_repo_prefix || '%'
        OR repository_url LIKE v_legacy_repo_prefix || '%'
        OR title LIKE 'Demo Project %'
      )
  );

  DELETE FROM public.projects
  WHERE owner_id = v_user
    AND (
      repository_url LIKE v_seed_repo_prefix || '%'
      OR repository_url LIKE v_legacy_repo_prefix || '%'
      OR title LIKE 'Demo Project %'
    );

  FOR v_i IN 1..v_project_count LOOP
    v_status := (ARRAY['planning','active','active','completed','archived'])[1 + ((v_i - 1) % 5)];
    v_semester := (ARRAY['Fall','Spring','Summer','Winter'])[1 + ((v_i - 1) % 4)];
    v_year := 2024 + ((v_i - 1) % 3);
    v_title := v_titles[v_i];

    v_desc := format(
      'Capstone project covering requirements, implementation, testing, and documentation. Focus area: %s. Semester: %s %s.',
      v_title, v_semester, v_year
    );

    v_coord_id := v_coordinator_ids[1 + floor(random() * array_length(v_coordinator_ids, 1))::int];

    INSERT INTO public.projects (
      title,
      description,
      status,
      owner_id,
      coordinator_id,
      semester,
      year,
      start_date,
      end_date,
      repository_url,
      demo_url,
      is_public
    ) VALUES (
      v_title,
      v_desc,
      v_status,
      v_user,
      v_coord_id,
      v_semester,
      v_year,
      (date '2025-09-01' + ((v_i - 1) * 12) * interval '1 day')::date,
      (date '2026-06-30' + ((v_i - 1) * 9) * interval '1 day')::date,
      v_seed_repo_prefix || v_i,
      CASE WHEN v_i % 3 = 0 THEN format('https://%s.apms.example.com', lower(replace(v_title, ' ', '-'))) ELSE NULL END,
      (v_i % 5 <> 0)
    )
    RETURNING id INTO v_project_id;

    -- Owner is always a member
    INSERT INTO public.project_members (project_id, user_id)
    VALUES (v_project_id, v_user)
    ON CONFLICT DO NOTHING;

    -- Random students (2–10, or fewer if not enough student profiles)
    v_member_count := CASE
      WHEN v_student_count = 0 THEN 0
      ELSE least(
        v_student_count,
        greatest(2, 2 + floor(random() * 9)::int)
      )
    END;

    IF v_member_count > 0 THEN
      SELECT coalesce(array_agg(id), ARRAY[]::uuid[])
      INTO v_member_ids
      FROM (
        SELECT id
        FROM public.profiles
        WHERE role = 'student' AND id <> v_user
        ORDER BY random()
        LIMIT v_member_count
      ) picked;

      FOREACH v_assignee_id IN ARRAY v_member_ids LOOP
        INSERT INTO public.project_members (project_id, user_id)
        VALUES (v_project_id, v_assignee_id)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;

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

    -- Tasks with natural titles; assignee = random project member (incl. owner)
    FOR v_j IN 1..v_tasks_per_project LOOP
      v_task_status := (ARRAY['todo','todo','in-progress','in-progress','review','done'])[1 + ((v_j - 1) % 6)];
      v_priority := (ARRAY['low','medium','medium','high'])[1 + ((v_j - 1) % 4)];

      SELECT pm.user_id
      INTO v_assignee_id
      FROM public.project_members pm
      WHERE pm.project_id = v_project_id
      ORDER BY random()
      LIMIT 1;

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
        v_task_titles[v_j],
        format(
          'Deliverable for the %s milestone. Tracked on the team Kanban board.',
          (ARRAY['planning','development','testing','release'])[1 + ((v_j - 1) % 4)]
        ),
        v_task_status,
        v_priority,
        v_assignee_id,
        (current_date + ((v_i + v_j) % 45) * interval '1 day')::date
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seeded % projects × % tasks for owner % (% student profiles available for membership)',
    v_project_count, v_project_count * v_tasks_per_project, v_user, v_student_count;
END $$;

-- Quick verification (optional)
SELECT
  (SELECT count(*) FROM public.projects
   WHERE owner_id = '80d46357-a10a-4b83-9961-6ebad5845a6e'::uuid
     AND repository_url LIKE 'https://github.com/demo/apms-seed-%') AS seeded_projects,
  (SELECT count(*) FROM public.tasks t
   JOIN public.projects p ON p.id = t.project_id
   WHERE p.owner_id = '80d46357-a10a-4b83-9961-6ebad5845a6e'::uuid
     AND p.repository_url LIKE 'https://github.com/demo/apms-seed-%') AS seeded_tasks,
  (SELECT count(*) FROM public.project_members pm
   JOIN public.projects p ON p.id = pm.project_id
   WHERE p.owner_id = '80d46357-a10a-4b83-9961-6ebad5845a6e'::uuid
     AND p.repository_url LIKE 'https://github.com/demo/apms-seed-%') AS seeded_memberships,
  (SELECT count(*) FROM public.projects
   WHERE owner_id = '80d46357-a10a-4b83-9961-6ebad5845a6e'::uuid
     AND coordinator_id IS NOT NULL
     AND repository_url LIKE 'https://github.com/demo/apms-seed-%') AS seeded_with_coordinator;
