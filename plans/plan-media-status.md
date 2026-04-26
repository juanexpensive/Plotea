# Plan: Estado personal de media

PRD: [prd-plotskip.md](prd-plotskip.md)
Fecha: 2026-04-26

## Decisiones fijas

- **Modelo:** `user_media_status` guarda un unico estado por usuario y obra.
- **Estados:** `watched`, `watchlist` o ausencia de fila para limpiar estado.
- **Identidad de obra:** `(tmdb_id, media_type)` con `media_type` limitado a `movie` o `tv`.
- **API protegida:** solo usuarios autenticados pueden leer o modificar su estado personal.
- **Mobile:** la pantalla de detalle muestra botones para marcar estado y se actualiza de forma inmediata tras guardar.

## Fases

### Fase 1 - Backend de estado personal
**Objetivo:** El backend puede persistir, leer y limpiar el estado de una obra para el usuario autenticado.

**Incluye:**
- [ ] Modelo ORM `user_media_status`
- [ ] Migracion Alembic
- [ ] Entidad/repositorio/usecases
- [ ] Endpoints `GET` y `PUT` en `/media/{media_type}/{tmdb_id}/status`
- [ ] Tests de marcar vista, watchlist, limpiar estado y rechazar tipos invalidos

**Criterio:** `pytest tests/test_media_status.py -q` pasa.

### Fase 2 - Mobile en detalle
**Objetivo:** Desde la ficha de una pelicula/serie se puede marcar como vista o watchlist.

**Incluye:**
- [ ] Tipos y llamadas HTTP en `MediaRepository`
- [ ] ViewModel de detalle con carga/guardado de estado
- [ ] Botones de estado en `DetailScreen`

**Criterio:** `npx tsc --noEmit` pasa y la UI muestra el estado actual.

### Fase 3 - Verificacion
**Objetivo:** El corte queda estable para continuar con diario/reviews.

**Incluye:**
- [ ] Suite backend completa
- [ ] TypeScript mobile

**Criterio:** Tests backend y typecheck pasan.
