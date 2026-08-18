CHICHE LEAGUE CLAUSURA 2026 — V57

FLUJO AUTOMÁTICO DE FECHAS
- Mientras una fecha está en juego, Formaciones y Puntajes muestran esa fecha.
- Si la fecha termina pero la ronda de cambios todavía no terminó, el contexto sigue en esa fecha.
- Al finalizar todos los cambios posteriores a una fecha, Formaciones y Puntajes avanzan automáticamente a la fecha siguiente.
- Cambios conserva y presenta el historial como “Cambios previos a Fecha N”.
- El selector de Cambios muestra la fecha que se va a jugar, aunque internamente la ronda siga asociada a la fecha base anterior.
- Funciona tanto para Admin como para usuarios públicos al recibir el estado desde Supabase.
- No reinicia ni modifica el estado de la ronda actual.
- Supabase y STORAGE v25 preservados.
