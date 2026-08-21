CHICHE LEAGUE CLAUSURA 2026 — V63

LANDING DINÁMICA SEGÚN ESTADO DE LA FECHA

- Formaciones deja de ser la landing por defecto.
- Si una fecha ya tiene al menos un puntaje cargado y todavía no terminó:
  landing = Fixture y Resultados de esa fecha.
- Cuando se carga el último puntaje pendiente:
  landing = Puntajes de esa fecha cerrada.
- Durante la ronda de cambios posterior y aun después de terminar los cambios:
  Puntajes sigue mostrando la última fecha cerrada.
- Aunque la app prepare internamente la fecha siguiente, no aterriza en una
  tabla vacía de esa próxima fecha.
- Cuando se carga el primer puntaje de la fecha siguiente:
  landing = Fixture y Resultados de la nueva fecha.
- El comportamiento aplica a Admin y usuarios públicos.
- La navegación manual no se pisa mientras no cambie el estado de la fecha.
- STORAGE chicheLeagueDB_v25 y Supabase preservados.
