CHICHE LEAGUE CLAUSURA 2026 — V82

CORRECCIÓN DEL PROXY VERCEL

Problema de V81 corregido:
- La lectura pública armaba incorrectamente el parámetro league_id.
- Se rehizo el cliente cloud para construir query params correctamente.
- Se rehizo api/chiche-cloud.js con headers separados para Auth y REST.
- Login, refresh, logout, lectura y guardado pasan exclusivamente por Vercel.
- El navegador NO contiene ni consulta el dominio de Supabase.

NUEVO DIAGNÓSTICO
- /api/chiche-cloud?action=health
  debe responder JSON con ok=true si la función está desplegada.

PRUEBA RECOMENDADA DESPUÉS DEL DEPLOY
1. Abrir:
   https://chiche-league-clausura-2026.vercel.app/api/chiche-cloud?action=health
2. Debe mostrar {"ok":true,...}
3. Abrir la app en incógnito.
4. Debe cargar la partida oficial sin mostrar "Iniciar torneo".
5. Login Admin debe habilitar módulos de edición.

IMPORTANTE
- Subir también la carpeta api con chiche-cloud.js.
- Reemplazar index.html y ChicheLeague_Clausura2026.html.
- Mantener el mismo proyecto Vercel/GitHub.
