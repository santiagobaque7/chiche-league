# CHICHE LEAGUE — V12 · ENTREGA PARA GITHUB

Esta entrega se construyó sobre el repositorio original que compartiste, **no** sobre una V10/V11 que hubiera sido instalada.

## Instalación

1. Antes de actualizar, descargá un respaldo JSON del Clausura 2026 y guardá el commit actual para poder volver atrás.
2. Copiá los archivos y las carpetas del ZIP a la **raíz** del repositorio GitHub. Reemplazá `index.html` y `ChicheLeague_Clausura2026.html`, y mantené `assets/` y `api/`.
3. Verificá que aparezca el archivo nuevo `api/chiche-tournaments.js` además de los archivos existentes de API.
4. Vercel desplegará el cambio al detectar el commit. No se incluye SQL nuevo ni se piden variables de entorno adicionales.
5. Mantené las variables de Supabase que ya usabas para el sistema de identidades (`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`). La V12 reutiliza esas mismas variables.

## Funcionalidades

- Crear torneos **solo administrador**. Copiar opcionalmente DT y base de jugadores, sin copiar planteles, resultados ni puntos.
- Cada edición usa registros separados en `chiche_league_state`, con sus datos de partidos, participantes, puntajes y equipos.
- Nuevo endpoint `api/chiche-tournaments.js` para listar, crear, editar y borrar ediciones; operaciones de escritura autenticadas como administrador.
- Los DT acceden a una lista/selector de sus ediciones en Torneos y Home (según la identidad del DT elegida en el dispositivo). No se añade PIN ni contraseña para jugadores.
- Al cargar o cambiar de edición, se leen de Supabase los datos correspondientes.
- Editar identidad mantiene el sistema compartido sin claves individuales que utilizabas; ahora diferenciado por edición.
- Nuevos torneos empiezan en fecha 1 y permiten configurar cruces desde Torneos > Configurar fixture.
- El Clausura 2026 no puede borrarse desde el gestor.

## Advertencias y límites

- La app **no autentica individualmente a cada DT**, tal como solicitaste. Cualquier persona que seleccione el nombre de un DT puede entrar a sus vistas y editar su identidad. No equivale a control de acceso robusto por usuario.
- La V12 presupone que las tablas y las variables de Supabase existentes admiten varias filas en `chiche_league_state` e identidades por `league_id`. No se ejecutó una prueba contra tu Supabase real; cualquier restricción especial del esquema puede requerir ajustes. No se debe afirmar que quedó verificado en producción.
- La gestión de torneos requiere conexión con Vercel/Supabase. Abrir el HTML directamente desde una carpeta **no** es una prueba funcional de la nube.
- El catálogo utiliza una fila reservada dentro de `chiche_league_state` (`chiche-tournaments-manifest-v12`). No eliminarla manualmente.
- Antes de borrar un torneo se solicita el nombre exacto y una segunda confirmación. La eliminación de una edición es irreversible sin un respaldo.

## Lista corta de comprobación tras desplegar

1. Abrir como público: comprobar Clausura 2026 y puntajes anteriores.
2. Entrar como administrador: comprobar que pueden seguir cargándose puntajes, resultados y cambios.
3. Entrar como DT en otro navegador, editar la identidad y confirmar que aparece en otro dispositivo.
4. Como administrador crear un torneo de PRUEBA, seleccionarlo y volver al Clausura 2026.
5. Cambiar en la prueba participantes, fixture y puntajes; verificar que **no** se alteró el Clausura 2026.
6. Comprobar que un participante ve y puede seleccionar ediciones donde figura como DT.
7. Eliminar solo el torneo de PRUEBA y verificar que el Clausura 2026 sigue disponible.

El ZIP no modifica tu GitHub ni tu Supabase por sí mismo; tenés que subir los archivos.
