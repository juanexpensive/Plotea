# Fase 7 - Listas personalizadas Details

## Repository Context

- Relevant files:
- `backend/app/data/models/list.py`
- `backend/app/data/models/list_item.py`
- `backend/app/data/models/activity.py`
- `backend/app/data/repositories/list_repository.py`
- `backend/app/data/repositories/activity_repository.py`
- `backend/app/domain/entities/lists.py`
- `backend/app/domain/entities/social.py`
- `backend/app/domain/repositories/i_list_repository.py`
- `backend/app/domain/repositories/i_activity_repository.py`
- `backend/app/domain/services/activity_publisher.py`
- `backend/app/domain/usecases/lists`
- `backend/app/presentation/routers/lists.py`
- `backend/app/presentation/routers/social.py`
- `backend/app/presentation/schemas/lists.py`
- `backend/app/presentation/schemas/social.py`
- `backend/app/main.py`
- `backend/alembic/versions/0007_lists.py`
- `mobile/src/domain/entities/lists.ts`
- `mobile/src/domain/entities/social.ts`
- `mobile/src/data/repositories/ListsRepository.ts`
- `mobile/src/presentation/features/lists`
- `mobile/src/presentation/features/profile/ProfileScreen.tsx`
- `mobile/src/presentation/features/profile/ProfileViewModel.ts`
- `mobile/src/presentation/features/social/PublicProfileScreen.tsx`
- `mobile/src/presentation/features/social/PublicProfileViewModel.ts`
- `mobile/src/presentation/features/home/HomeScreen.tsx`
- `mobile/src/presentation/features/home/HomeViewModel.ts`
- `mobile/app/my-lists.tsx`
- `mobile/app/list-detail.tsx`
- `tests/test_lists.py`
- Existing patterns to follow:
- Clean Architecture con entidades, interfaces, repositorios concretos y use cases por vertical slice
- Routers FastAPI finos que delegan reglas de negocio a casos de uso
- Tests HTTP async con `AsyncClient` y helpers de login reutilizables
- Repositorios mobile HTTP simples con mapeo explicito hacia entidades de dominio
- Constraints:
- Fase 6 ya estaba cerrada; el feed social mantiene cursor opaco por `(created_at, id)` y la publicacion de actividad sigue fuera de routers
- Las listas privadas ajenas responden `404`
- `list_created` solo se publica para listas publicas
- El reorder mobile es por swap entre dos items seleccionados, no drag and drop
- La metadata de media en listas es best effort; si TMDB no responde o no esta inicializado, `media_summary` puede venir `null`

## Decisions Locked

- `GET /lists/me` devuelve summaries de listas propias ordenadas por `updated_at DESC`
- `GET /users/{username}/lists` expone solo listas publicas del usuario
- `GET /lists/{id}` permite ver listas propias o listas publicas ajenas; listas privadas ajenas responden `404`
- `POST /lists/{id}/items` rechaza duplicados con `409`
- `DELETE /lists/{id}/items/{tmdb_id}/{media_type}` es idempotente para simplificar mobile
- `PATCH /lists/{id}/items/reorder` intercambia `position` entre dos items concretos y falla con `404` si falta alguno
- `list_created` amplía su contrato con `list_name`, `items_count` e `is_public`
- El feed social solo devuelve `list_created` cuando la lista sigue existiendo y es publica
- El perfil propio y el perfil publico siguen separados; no se mezclan estados de listas entre ambos

## Phase Notes

### Phase 1

- Detailed tasks:
- Crear `tests/test_lists.py`
- Fijar contratos de creacion, validacion, privacidad, ownership, duplicados, reorder y feed social
- Asegurar que `list_created` no aparezca para listas privadas
- Findings:
- La Fase 6 ya tenia `list_created` modelado pero sin emision ni render mobile
- Fue necesario cerrar una politica explicita para privacidad y duplicados antes de tocar persistencia
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- Review notes:
- Se fijo `404` para listas privadas ajenas y `409` para duplicados de item
- Status:
- completed

### Phase 2

- Detailed tasks:
- Crear tablas `lists` y `list_items` con migracion `0007`
- Anadir entidades de dominio para summary, detail, items y owner
- Crear `ListRepository` e interfaz `IListRepository`
- Implementar use cases para CRUD de listas, add/remove item y swap de posiciones
- Extender `ActivityPublisher` e `IActivityRepository` para `publish_list_created`
- Findings:
- El repo no tenia `media_cache` persistida; la metadata de media se resolvio como enriquecimiento best effort usando la infraestructura TMDB ya existente
- Se mantuvo `position` sin unique a nivel DB para simplificar el swap atomico sin meter una estrategia mas compleja
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- Review notes:
- El ownership y la visibilidad viven en dominio/repositorio, no en routers
- Status:
- completed

### Phase 3

- Detailed tasks:
- Crear router `lists` y schemas dedicados
- Registrar modelos y router nuevos en `main.py`
- Ampliar `ListCreatedActivityResponse` y la entidad `ListCreatedActivity`
- Actualizar `ActivityRepository` para devolver `list_name`, `items_count` e `is_public` sin romper el feed existente
- Findings:
- El feed social de Fase 6 no necesitó cambiar su cursor ni su orden para soportar listas
- `list_created` se filtra por visibilidad publica en el agregado del feed para no filtrar listas privadas
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- Review notes:
- La ampliacion del contrato social convive con `review`, `watch_log` y `follow` sin romper sus tests previos
- Status:
- completed

### Phase 4

- Detailed tasks:
- Crear entidades y repositorio HTTP de listas en mobile
- Anadir `my-lists` y `list-detail`
- Integrar listas propias en `ProfileScreen`
- Integrar listas publicas en `PublicProfileScreen`
- Integrar `list_created` en el bloque social de `Home`
- Implementar swap por dos toques con feedback visual simple
- Findings:
- Se reutilizo una sola pantalla de detalle con modo editable o lectura, respetando la separacion entre perfil propio y perfil publico
- El swap se apoyo en `LayoutAnimation` y `Animated` para evitar dependencias nuevas de gestos
- Tests:
- `npx tsc --noEmit`
- Review notes:
- El copy y los fallbacks muestran placeholder y `movie/tv #tmdb_id` cuando falta metadata
- Status:
- completed

### Phase 5

- Detailed tasks:
- Ejecutar la suite de listas, la suite social, la suite completa backend y TypeScript
- Revisar puntos de friccion reales en metadata TMDB, feed social y UX de swap
- Actualizar docs con riesgos aceptados
- Findings:
- `test_lists.py` pasa con 8 tests verdes
- `test_social.py` pasa con 9 tests verdes
- `pytest ..\tests -q` pasa con 75 tests verdes
- `npx tsc --noEmit` pasa
- No se ha ejecutado Expo en esta sesion
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests -q`
- `npx tsc --noEmit`
- Review notes:
- Se acepta como riesgo residual la falta de validacion manual/visual en Expo
- Status:
- completed

## Review Findings

- fixed: el feed social mantiene cursor opaco por `(created_at, id)` y la ampliacion de `list_created` no rompe la Fase 6
- fixed: las listas privadas ajenas quedan ocultas con `404` y no aparecen en feed ni en perfil publico
- fixed: `list_created` solo se publica para listas publicas
- fixed: el mobile soporta `list_created` y navega al detalle publico de la lista
- accepted risk: la metadata de media depende de enriquecimiento best effort y puede ser `null` si TMDB falla o no esta disponible
- accepted risk: falta validacion manual en Expo para confirmar la sensacion visual del swap y la navegacion real desde el feed social

## Deferred Work

- Slugs publicos de listas
- Cache persistente/local de metadata TMDB para listas
- Listas colaborativas
- Likes, comentarios o guardados sobre listas
- Drag and drop avanzado para reorder
- Hardening visual del swap y microinteracciones tras prueba en dispositivo real

## Final Confidence Check

- Confidence score:
- 8.5/10
- Likely code review callouts:
- El enriquecimiento de metadata de media hace llamadas best effort a TMDB y puede merecer una capa de cache si el slice crece
- `list_created` depende de la visibilidad actual de la lista; si una lista publica se borra o se vuelve privada, su evento deja de renderizarse en feed
- La UX de swap necesita validacion manual para confirmar que el feedback visual es suficientemente claro en dispositivo real
- Residual risks:
- No se ha ejecutado una prueba manual en Expo dentro de esta sesion
- El slice no introduce una estrategia de cache persistente para metadata de listas
