CHICHE LEAGUE CLAUSURA 2026 — V81

SOLUCIÓN CISCO UMBRELLA / SUPABASE
- El navegador ya NO accede directamente a supabase.co.
- Lectura pública, login, refresh, logout y guardado pasan por /api/chiche-cloud en Vercel.
- Flujo: navegador -> dominio Vercel -> función serverless -> Supabase.
- Esto evita el bloqueo DNS corporativo de Cisco Umbrella sobre supabase.co.
- En incógnito la app puede obtener la partida oficial aunque no exista localStorage previo.

SINCRONIZACIÓN
- Lectura pública cada 10 segundos mientras la pestaña está visible.
- Refresco inmediato al volver a la pestaña.
- Admin sigue guardando automáticamente mediante la API de Vercel.

IMPORTANTE PARA GITHUB / VERCEL
- Subir también la carpeta api con chiche-cloud.js.
- No crear un proyecto nuevo: reemplazar/subir estos archivos al mismo repositorio conectado al Vercel actual.

PERSISTENCIA
- STORAGE chicheLeagueDB_v25 preservado.
- Supabase existente preservado.
- No se cambia ninguna tabla de base de datos.
