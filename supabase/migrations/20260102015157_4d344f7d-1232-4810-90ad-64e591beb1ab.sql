-- Drop and recreate the function to check department membership via user_departments instead of user_roles
CREATE OR REPLACE FUNCTION public.is_user_in_leader_department(_leader_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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

-- Also need to fix the profiles RLS policy for leaders
-- Drop the existing policy
DROP POLICY IF EXISTS "Leaders can view profiles of department users" ON public.profiles;

-- Create a new policy using the corrected function
CREATE POLICY "Leaders can view profiles of department users" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'department_leader') 
  AND is_user_in_leader_department(auth.uid(), id)
);