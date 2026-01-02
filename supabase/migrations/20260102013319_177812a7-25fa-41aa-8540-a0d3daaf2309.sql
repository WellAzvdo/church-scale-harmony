-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Leaders can view department user roles" ON public.user_roles;

-- Create a security definer function to check if a user is in a leader's department
-- This avoids recursion by bypassing RLS
CREATE OR REPLACE FUNCTION public.is_user_in_leader_department(_leader_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles leader_role
    JOIN user_departments ud_target ON ud_target.department_id = leader_role.department_id
    WHERE leader_role.user_id = _leader_id
      AND leader_role.role = 'department_leader'
      AND leader_role.approval_status = 'approved'
      AND ud_target.user_id = _target_user_id
  )
$$;

-- Create the fixed policy using the security definer function
CREATE POLICY "Leaders can view department user roles"
ON public.user_roles
FOR SELECT
USING (
  is_user_in_leader_department(auth.uid(), user_id)
);