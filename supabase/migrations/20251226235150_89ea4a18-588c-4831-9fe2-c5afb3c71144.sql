-- Create user_departments table for assigning users to departments
CREATE TABLE public.user_departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Add church location settings table for geolocation check-in
CREATE TABLE public.church_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'Igreja',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius_meters integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default church location (can be updated by admin)
INSERT INTO public.church_settings (name, latitude, longitude, radius_meters)
VALUES ('Igreja', -23.550520, -46.633308, 150);

-- Enable RLS on new tables
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_departments
CREATE POLICY "Admins can manage user departments"
ON public.user_departments
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Leaders can view user departments in their department"
ON public.user_departments
FOR SELECT
USING (
  public.has_role(auth.uid(), 'department_leader') 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Leaders can manage their department assignments"
ON public.user_departments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'department_leader' 
    AND ur.department_id = user_departments.department_id
    AND ur.approval_status = 'approved'
  )
);

-- Policies for church_settings
CREATE POLICY "Anyone authenticated can view church settings"
ON public.church_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage church settings"
ON public.church_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add geolocation fields to checkins table
ALTER TABLE public.checkins 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS location_validated boolean DEFAULT false;