# Corrección de acceso a Torneos

Esta actualización arregla un problema de validación del token de administrador en `api/chiche-tournaments.js`.

## Para instalar
Reemplazá **solo** `api/chiche-tournaments.js` en GitHub. Vercel desplegará el cambio. No es necesario volver a subir los HTML.

Después recargá la app y probá crear o editar un torneo con la sesión de administrador.

Si desaparece el error «Solo el administrador puede gestionar torneos» pero aparece «permission denied for table chiche_league_state», es otro problema: los permisos de la tabla. En ese caso aplicá el SQL ya entregado con la V13, si todavía no lo ejecutaste.

La corrección no cambia permisos de usuarios ni crea contraseñas nuevas.
