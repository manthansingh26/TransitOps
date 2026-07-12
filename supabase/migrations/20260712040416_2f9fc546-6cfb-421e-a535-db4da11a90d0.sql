
REVOKE EXECUTE ON FUNCTION public.create_trip(text,text,uuid,uuid,numeric,numeric,numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.dispatch_trip(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_trip(uuid,numeric,numeric,numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_trip(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.open_maintenance(uuid,text,numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.close_maintenance(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_role_of(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
