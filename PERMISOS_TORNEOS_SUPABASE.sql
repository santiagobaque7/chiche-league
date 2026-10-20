-- Ejecutar UNA SOLA VEZ en Supabase > SQL Editor, para habilitar la API de Vercel.
-- Solo service_role; NO concede permisos de escritura al público ni a anon.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chiche_league_state TO service_role;
-- Si la tabla de identidades ya funciona, no requiere otro cambio.
