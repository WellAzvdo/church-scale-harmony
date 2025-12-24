-- Fix security issue: Restrict schedules table SELECT access

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone authenticated can view schedules" ON public.schedules;

-- Members can view their own schedules (via linked profile)
CREATE POLICY "Members can view own schedules" 
ON public.schedules 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.member_id = schedules.member_id
  )
);

-- Leaders can view their department schedules (uses existing function)
CREATE POLICY "Leaders can view department schedules" 
ON public.schedules 
FOR SELECT 
USING (can_manage_department(auth.uid(), department_id));