-- Fix security issue: Restrict members table access to admins and department leaders only
DROP POLICY IF EXISTS "Anyone authenticated can view members" ON public.members;

CREATE POLICY "Admins and leaders can view members" 
ON public.members 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'department_leader')
);

-- Members can view their own linked record
CREATE POLICY "Users can view their own member record" 
ON public.members 
FOR SELECT 
USING (
  user_id = auth.uid()
);

-- Fix security issue: Restrict internal_alerts INSERT to service role only
DROP POLICY IF EXISTS "System can create alerts" ON public.internal_alerts;

-- Only admins can create alerts (for manual alerts)
CREATE POLICY "Admins can create alerts" 
ON public.internal_alerts 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create a security definer function for system to create alerts
CREATE OR REPLACE FUNCTION public.create_system_alert(
  _type text,
  _title text,
  _message text,
  _date date,
  _target_user_id uuid DEFAULT NULL,
  _department_id uuid DEFAULT NULL,
  _member_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _alert_id uuid;
BEGIN
  INSERT INTO public.internal_alerts (type, title, message, date, target_user_id, department_id, member_id)
  VALUES (_type, _title, _message, _date, _target_user_id, _department_id, _member_id)
  RETURNING id INTO _alert_id;
  
  RETURN _alert_id;
END;
$$;