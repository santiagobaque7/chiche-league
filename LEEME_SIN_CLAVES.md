# Chiche League — actualización sin nueva configuración

- Esta entrega conserva la navegación/diseño V11 y el guardado de identidades del repositorio anterior.
- **No pide contraseñas individuales ni SQL adicional, ni nuevas variables de Vercel.** Se mantienen `api/chiche-identity.js` y `api/chiche-cloud.js` que venían funcionando.
- No ejecutar el SQL V11 ni instalar `api/chiche-tournaments.js` / `lib/chiche-shared.js`.
- La sección Torneos NO crea, modifica ni elimina ediciones compartidas: esa función sigue pendiente de implementar con un backend compatible. No se simula como si funcionara.
- Para actualizar: crear respaldo del repositorio y de los datos, luego reemplazar los archivos manteniendo la estructura. Verificar en Preview el guardado de identidad desde dos navegadores antes de usar Production.
- Sin autenticación individual, cualquier persona que pueda seleccionar un DT en la app podría editar ese club. Es el mismo modelo de confianza del repositorio anterior.
