CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_org_id UUID;
  org_slug TEXT;
  user_email TEXT;
  user_meta JSONB;
BEGIN
  -- Look up user info from auth.users since this trigger fires on profiles table
  SELECT email, raw_user_meta_data 
  INTO user_email, user_meta
  FROM auth.users 
  WHERE id = NEW.user_id;

  -- Generate unique slug based on email
  org_slug := 'org-' || substr(md5(COALESCE(user_email, NEW.user_id::text) || now()::text), 1, 8);
  
  -- Create organization for the new user
  INSERT INTO public.organizations (name, slug)
  VALUES (
    COALESCE(user_meta ->> 'organization', 'Minha Organização'),
    org_slug
  )
  RETURNING id INTO new_org_id;
  
  -- Update profile with org_id and role_in_org = admin
  UPDATE public.profiles
  SET org_id = new_org_id, role_in_org = 'admin'
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;