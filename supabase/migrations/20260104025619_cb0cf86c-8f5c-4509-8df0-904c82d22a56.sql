
-- Fix the RLS policy for members viewing their own schedules
-- The current policy incorrectly joins through profiles.member_id which is NULL
-- Schedules are linked directly to profile IDs via schedules.member_id

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Members can view own schedules" ON public.schedules;

-- Create the corrected policy - members can view schedules where member_id matches their auth.uid()
CREATE POLICY "Members can view own schedules" 
ON public.schedules 
FOR SELECT 
USING (member_id = auth.uid());
