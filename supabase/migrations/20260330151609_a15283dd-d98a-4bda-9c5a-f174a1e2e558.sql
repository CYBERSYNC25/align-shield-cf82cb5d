
CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE user_sessions
  SET last_active_at = now()
  WHERE id = p_session_id
    AND user_id = auth.uid()
    AND revoked = false
    AND expires_at > now();
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$function$;
