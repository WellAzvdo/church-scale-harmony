-- Add RLS policy for leaders to view profiles of users in their department
CREATE POLICY "Leaders can view profiles of department users"
ON public.profiles
FOR SELECT
USING (
  -- User has the department_leader role
  has_role(auth.uid(), 'department_leader'::app_role)
  AND
  -- Profile belongs to a user in the leader's department
  EXISTS (
    SELECT 1 FROM public.user_departments ud1
    JOIN public.user_roles ur ON ur.user_id = auth.uid() AND ur.role = 'department_leader'
    JOIN public.user_departments ud2 ON ud2.department_id = ur.department_id AND ud2.user_id = profiles.id
    WHERE ud1.user_id = auth.uid()
  )
);