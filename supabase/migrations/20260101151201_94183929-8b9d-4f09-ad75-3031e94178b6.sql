-- Allow department leaders to view user_roles of users in their department
CREATE POLICY "Leaders can view department user roles"
ON public.user_roles
FOR SELECT
USING (
  -- Check if current user is a department leader
  has_role(auth.uid(), 'department_leader'::app_role)
  AND
  -- Check if the target user is in one of the leader's departments
  EXISTS (
    SELECT 1
    FROM user_roles leader_role
    JOIN user_departments ud_target ON ud_target.user_id = user_roles.user_id
    WHERE leader_role.user_id = auth.uid()
      AND leader_role.role = 'department_leader'
      AND leader_role.approval_status = 'approved'
      AND leader_role.department_id = ud_target.department_id
  )
);