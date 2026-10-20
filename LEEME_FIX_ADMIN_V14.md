# Chiche League V14 — diagnóstico y reintento de sesión de Torneos

Este paquete parte de la V13 con el arreglo de tablas en mobile. No cambia el diseño ni los datos.

## Reemplazo en GitHub

Reemplazar `api/chiche-tournaments.js` y `index.html` (y la copia `ChicheLeague_Clausura2026.html` si la usás) conservando el resto de los archivos.

## Comprobación

1. Esperar a que Vercel indique Ready y recargar la app.
2. Salir de la cuenta de administrador e iniciar sesión de nuevo.
3. Probar crear/editar un torneo.
4. Si continúa el problema, copiar el mensaje exacto nuevo y el registro de Vercel correspondiente a `/api/chiche-tournaments`, ocultando tokens.

Si después de autenticar aparece `permission denied for table chiche_league_state`, es un problema diferente: falta validar el permiso de la tabla en Supabase.

No hay nuevas variables, SQL, ni claves individuales en esta corrección.
