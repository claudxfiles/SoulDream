-- Función para almacenar tokens de Google en user_metadata
CREATE OR REPLACE FUNCTION public.store_google_token(access_token text, refresh_token text default null)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  current_metadata jsonb;
  updated_metadata jsonb;
  token_data jsonb;
BEGIN
  -- Obtener el ID del usuario actual
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no autenticado');
  END IF;
  
  -- Obtener metadata actual
  SELECT raw_user_meta_data INTO current_metadata
  FROM auth.users
  WHERE id = user_id;
  
  -- Crear objeto de token con expiración de 1 hora
  token_data := jsonb_build_object(
    'access_token', access_token,
    'expires_at', (extract(epoch from now()) + 3600)::bigint,
    'scope', 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'
  );
  
  -- Añadir refresh_token si existe
  IF refresh_token IS NOT NULL THEN
    token_data := token_data || jsonb_build_object('refresh_token', refresh_token);
  END IF;
  
  -- Combinar con metadata actual
  IF current_metadata IS NULL THEN
    updated_metadata := jsonb_build_object('google_token', token_data);
  ELSE
    updated_metadata := current_metadata || jsonb_build_object('google_token', token_data);
  END IF;
  
  -- Actualizar metadata del usuario
  UPDATE auth.users
  SET raw_user_meta_data = updated_metadata
  WHERE id = user_id;
  
  RETURN json_build_object('success', true);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$; 