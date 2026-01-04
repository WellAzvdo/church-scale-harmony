
-- Fix the is_user_in_leader_department function to use departments.leader_id
-- instead of user_roles.department_id for determining leadership

CREATE OR REPLACE FUNCTION public.is_user_in_leader_department(_leader_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM departments d
    JOIN user_departments ud ON ud.department_id = d.id
    WHERE d.leader_id = _leader_id
      AND ud.user_id = _target_user_id
  )
$$;
