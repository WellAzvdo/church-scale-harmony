-- Drop the foreign key constraint on schedules.member_id that references members table
-- This allows schedules to reference profiles.id directly since we're using profiles for users
ALTER TABLE public.schedules 
DROP CONSTRAINT IF EXISTS schedules_member_id_fkey;

-- Add a new foreign key constraint to reference profiles instead
ALTER TABLE public.schedules
ADD CONSTRAINT schedules_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update the checkins table FK as well for consistency
ALTER TABLE public.checkins 
DROP CONSTRAINT IF EXISTS checkins_member_id_fkey;

ALTER TABLE public.checkins
ADD CONSTRAINT checkins_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;