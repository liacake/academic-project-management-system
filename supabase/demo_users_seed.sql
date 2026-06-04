-- ============================================================
-- Demo auth users for APMS
-- 30 students: 1demo@esg.ipsantarem.pt … 30demo@esg.ipsantarem.pt
-- 10 coordinators: 31demo@esg.ipsantarem.pt … 40demo@esg.ipsantarem.pt
-- Password (all accounts): Demo123<3
--
-- Run in Supabase Dashboard → SQL Editor.
-- Safe to re-run: removes prior numbered demo accounts first.
-- Profiles are created by public.handle_new_user (student_id auto for students).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_password constant text := 'Demo123<3';
  v_instance_id constant uuid := '00000000-0000-0000-0000-000000000000';
  v_first constant text[] := ARRAY[
    'Ana', 'Bruno', 'Carla', 'Diogo', 'Elena', 'Filipe', 'Gabriela', 'Hugo',
    'Inês', 'João', 'Kelly', 'Luís', 'Marta', 'Nuno', 'Olga', 'Pedro',
    'Rita', 'Sofia', 'Tiago', 'Úrsula', 'Vera', 'Xavier', 'Yara', 'Zé',
    'Afonso', 'Beatriz', 'Catarina', 'Daniel', 'Eva', 'Francisco', 'Helena',
    'Igor', 'Joana', 'Leonor', 'Miguel', 'Natália', 'Oscar', 'Patrícia', 'Rui'
  ];
  v_last constant text[] := ARRAY[
    'Silva', 'Santos', 'Oliveira', 'Pereira', 'Costa', 'Rodrigues', 'Martins',
    'Ferreira', 'Sousa', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Ribeiro',
    'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Soares',
    'Vieira', 'Monteiro', 'Cardoso', 'Ramos', 'Reis', 'Pinto', 'Campos',
    'Fonseca', 'Araújo', 'Machado', 'Coelho', 'Barbosa', 'Cunha', 'Faria',
    'Henriques', 'Matos', 'Neves', 'Dias', 'Castro'
  ];
  v_i int;
  v_email text;
  v_name text;
  v_role text;
  v_uid uuid;
  v_first_idx int;
  v_last_idx int;
BEGIN
  -- Remove previous run (profiles cascade from auth.users)
  DELETE FROM auth.users
  WHERE email ~ '^[0-9]+demo@esg\.ipsantarem\.pt$';

  FOR v_i IN 1..40 LOOP
    v_email := v_i::text || 'demo@esg.ipsantarem.pt';
    v_role := CASE WHEN v_i <= 30 THEN 'student' ELSE 'coordinator' END;
    v_first_idx := 1 + ((v_i * 7 - 1) % array_length(v_first, 1));
    v_last_idx := 1 + ((v_i * 11 - 1) % array_length(v_last, 1));
    v_name := v_first[v_first_idx] || ' ' || v_last[v_last_idx];
    v_uid := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      v_instance_id,
      v_uid,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', v_name, 'role', v_role),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END LOOP;

  RAISE NOTICE 'Created 40 demo users (30 students, 10 coordinators). Password: %', v_password;
END $$;

-- Verification
SELECT
  p.role,
  count(*) AS n
FROM public.profiles p
WHERE p.email ~ '^[0-9]+demo@esg\.ipsantarem\.pt$'
GROUP BY p.role
ORDER BY p.role;

SELECT id, name, email, role, student_id
FROM public.profiles
WHERE email ~ '^[0-9]+demo@esg\.ipsantarem\.pt$'
ORDER BY email;
