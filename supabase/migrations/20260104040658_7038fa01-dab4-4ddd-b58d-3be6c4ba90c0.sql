-- Create department_leaders table for many-to-many leadership relationship
CREATE TABLE IF NOT EXISTS public.department_leaders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (department_id, user_id)
);

-- Enable RLS
ALTER TABLE public.department_leaders ENABLE ROW LEVEL SECURITY;

-- RLS policies for department_leaders
CREATE POLICY "Anyone authenticated can view department leaders"
ON public.department_leaders
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage department leaders"
ON public.department_leaders
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Migrate existing leader_id data to department_leaders table
INSERT INTO public.department_leaders (department_id, user_id)
SELECT id, leader_id FROM public.departments
WHERE leader_id IS NOT NULL
ON CONFLICT (department_id, user_id) DO NOTHING;

-- Create a function to check if a user is a leader of a department
CREATE OR REPLACE FUNCTION public.is_department_leader(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_leaders
    WHERE user_id = _user_id AND department_id = _department_id
  )
$$;

-- Update is_user_in_leader_department to use the new department_leaders table
CREATE OR REPLACE FUNCTION public.is_user_in_leader_department(_leader_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.department_leaders dl
    JOIN public.user_departments ud ON ud.department_id = dl.department_id
    WHERE dl.user_id = _leader_id
      AND ud.user_id = _target_user_id
  )
$$;

-- Update can_manage_department to use the new department_leaders table
CREATE OR REPLACE FUNCTION public.can_manage_department(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
      AND approval_status = 'approved'
      AND (
        role = 'admin' 
        OR (role = 'department_leader' AND EXISTS (
          SELECT 1 FROM public.department_leaders 
          WHERE user_id = _user_id AND department_id = _department_id
        ))
      )
  )
$$;

-- Create a function to get all departments a user leads
CREATE OR REPLACE FUNCTION public.get_led_departments(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT department_id FROM public.department_leaders WHERE user_id = _user_id
$$;