# Chiche League V13 — Actualización

1. Guardar una copia JSON del Clausura 2026.
2. Subir a GitHub el contenido del ZIP, respetando `api/`, `assets/` y `index.html`.
3. En Supabase > SQL Editor ejecutar **una única vez** `PERMISOS_TORNEOS_SUPABASE.sql` para habilitar creación y edición de torneos. Es necesario por el error real `permission denied for table chiche_league_state`. No cambia Vercel, contraseñas ni permisos de usuarios públicos.
4. Verificar `Home > Ingresar como administrador`, crear una edición de prueba, volver a Clausura 2026 y comprobar el historial.
5. Un DT sin sesión de administrador puede ver el Clausura 2026; la selección de DT en este sistema no equivale a una autenticación individual.

Advertencia: no se realizaron pruebas contra la instancia real de Supabase. La operación de renombrar DT históricos intenta migrar referencias; antes de usarla con puntuaciones reales, respaldar JSON y verificar tablas, planteles y cambios.
