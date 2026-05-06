# Fase 5 - Comentarios y votos utiles Details

## Repository Context

- Relevant files:
- `backend/app/data/models`
- `backend/app/data/repositories`
- `backend/app/domain/entities`
- `backend/app/domain/repositories`
- `backend/app/domain/usecases/reviews`
- `backend/app/presentation/routers/reviews.py`
- `backend/app/presentation/schemas/review.py`
- `backend/alembic/versions`
- `mobile/src/domain/entities/media.ts`
- `mobile/src/data/repositories/ReviewRepository.ts`
- `mobile/src/presentation/features/detail`
- `tests/test_reviews.py`
- Existing patterns to follow:
- Clean Architecture ya usada en auth, media status, watch log y resenas
- Tests HTTP async con `AsyncClient`
- Detail screen con formularios inline y estado local simple
- Constraints:
- Replies de un solo nivel
- Soft delete en comentarios con copy fija
- Sin autovoto y un voto maximo por usuario/resena
- No introducir notificaciones en esta fase

## Decisions Locked

- `GET /media/{media_type}/{tmdb_id}/reviews` mantiene orden `created_at DESC`
- `GET /reviews/{id}/comments` devuelve comentarios raiz ordenados por `created_at ASC`, con `replies` tambien en `ASC`
- `POST /reviews/{id}/comments` acepta `parent_comment_id` opcional
- No se puede responder a una respuesta; solo a comentarios raiz
- Borrar comentario hace soft delete y conserva replies
- El placeholder de comentario borrado es copy fija no interactiva
- `ReviewResponse` expone `comment_count`, `helpful_votes` y `has_voted`
- Mobile carga comentarios bajo demanda por resena
- Una sola caja de respuesta activa por resena

## Phase Notes

### Phase 1

- Detailed tasks:
- Actualizar docs de implementacion para la fase
- Extender `tests/test_reviews.py` con comentarios, replies, votos y agregados
- Findings:
- La Fase 4 ya tenia el punto natural de integracion en `DetailScreen`; no hace falta navegar a otra pantalla
- Para `has_voted` hace falta soportar usuario opcional en el listado de resenas
- Tests:
- `pytest tests/test_reviews.py`
- Review notes:
- Confirmar status codes para reply invalido y autovoto antes de acoplar el mobile
- Status:
- completed

### Phase 2

- Detailed tasks:
- Crear modelos `comments` y `review_votes` con migracion
- Extender entidad/repositorio de resenas con agregados sociales
- Crear entidades, interfaces, repositorios y use cases de comentarios y votos
- Exponer endpoints y schemas nuevos
- Findings:
- Los votos se borran por cascada al eliminar resena; no requieren limpieza manual en use case
- El listado de comentarios se agrupa en el repositorio para no montar arboles en el router
- `ReviewResponse` se enriquecio sin cambiar la ruta existente de listado
- Tests:
- `pytest tests/test_reviews.py`
- Review notes:
- Validar que SQLite de tests respete el comportamiento de cascada y self-reference esperado
- Status:
- completed

### Phase 3

- Detailed tasks:
- Extender tipos mobile y repositorio HTTP
- Cargar usuario actual y estado de hilos por resena en `DetailViewModel`
- Integrar acciones de voto, comentar, responder y borrar
- Findings:
- La pantalla ya tenia `ReviewCard`; se extendio en lugar de introducir otra surface
- Los errores de comentarios viven por resena para no tumbar el resto del detalle
- Se usa `/auth/me` para resolver permisos de voto/comentario en mobile sin estado global nuevo
- Tests:
- `npx tsc --noEmit`
- Review notes:
- Cuidar que una accion de un hilo no resetee todos los estados de otros hilos
- Status:
- completed

### Phase 4

- Detailed tasks:
- Ejecutar checks
- Revisar diff
- Registrar hallazgos con estado
- Findings:
- `pytest tests/` pasa tras introducir comentarios, votos y agregados sociales
- `npx tsc --noEmit` pasa con el detalle expandido
- No se ha ejecutado una prueba manual en Expo dentro de esta sesion
- Tests:
- `pytest tests/test_reviews.py`
- `pytest tests/`
- `npx tsc --noEmit`
- Review notes:
- Confirmar copy, placeholders y riesgos residuales de prueba manual
- Status:
- completed

## Review Findings

- fixed: `ReviewResponse` expone `comment_count`, `helpful_votes` y `has_voted` sin anadir roundtrips extra en mobile
- fixed: los comentarios se cargan bajo demanda y mantienen estado local por resena
- fixed: el soft delete conserva replies y muestra `Comentario eliminado.`
- accepted risk: no se ha validado visualmente en Expo el comportamiento final del hilo de comentarios

## Deferred Work

- Editar comentarios
- Ordenar resenas por utilidad
- Notificaciones por comentario/voto
- Infraestructura de tests frontend

## Final Confidence Check

- Confidence score:
- 8.5/10
- Likely code review callouts:
- El endpoint `GET /reviews/{id}/comments` devuelve lista vacia si la resena no existe en lugar de `404`; es aceptable para la UI actual, pero podria discutirse como contrato
- La vista de detalle sigue siendo un archivo grande y podria extraerse en componentes compartidos si la feature social crece mas
- Residual risks:
- Falta validacion manual en Expo para confirmar copy, espaciado y flujos de reply/borrado
