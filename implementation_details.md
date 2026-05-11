# Fase 6 - Social: usuarios, follows y feed Details

## Repository Context

- Relevant files:
- `backend/app/data/models/follow.py`
- `backend/app/data/models/activity.py`
- `backend/app/data/repositories/user_repository.py`
- `backend/app/data/repositories/follow_repository.py`
- `backend/app/data/repositories/activity_repository.py`
- `backend/app/domain/entities/social.py`
- `backend/app/domain/repositories/i_user_repository.py`
- `backend/app/domain/repositories/i_follow_repository.py`
- `backend/app/domain/repositories/i_activity_repository.py`
- `backend/app/domain/services/activity_publisher.py`
- `backend/app/domain/usecases/social`
- `backend/app/domain/usecases/reviews/create_review.py`
- `backend/app/domain/usecases/watchlog/create_watch_log.py`
- `backend/app/presentation/routers/social.py`
- `backend/app/presentation/schemas/social.py`
- `backend/app/main.py`
- `backend/alembic/versions/0006_social_graph_feed.py`
- `mobile/src/domain/entities/social.ts`
- `mobile/src/data/repositories/SocialRepository.ts`
- `mobile/src/presentation/features/home/HomeScreen.tsx`
- `mobile/src/presentation/features/home/HomeViewModel.ts`
- `mobile/src/presentation/features/social`
- `mobile/app/user-search.tsx`
- `mobile/app/user-profile.tsx`
- `tests/test_social.py`
- Existing patterns to follow:
- Clean Architecture con entidades, interfaces, repositorios concretos y use cases por vertical slice
- Routers FastAPI finos que delegan reglas de negocio a casos de uso
- Tests HTTP async con `AsyncClient` y helpers de login reutilizables
- Repositorios mobile HTTP simples con mapeo explicito hacia entidades de dominio
- Constraints:
- El feed social es privado al usuario autenticado y contiene solo actividad de usuarios seguidos
- La paginacion del feed usa cursor estable, nunca offset
- El perfil publico no expone `email` ni otros datos internos
- La generacion de actividades esta centralizada fuera de routers
- `list_created` queda soportado en backend pero sin emision/render en esta fase

## Decisions Locked

- `GET /users/search` requiere autenticacion y devuelve resultados ligeros para UI de descubrimiento
- `GET /users/{username}` expone un perfil publico con identidad visible, bio/avatar si existen y estado de follow respecto al usuario actual
- `POST /users/{id}/follow` y `DELETE /users/{id}/follow` son idempotentes desde el punto de vista del cliente
- `GET /feed` devuelve items ordenados por `created_at DESC` con desempate estable por `id DESC`
- El cursor del feed es opaco y derivado de `(created_at, id)` para evitar duplicados entre paginas
- Las actividades de `review`, `watch_log` y `follow` se crean desde casos de uso o un servicio reutilizable
- `list_created` queda modelado en el enum/tipo de actividad aunque la emision efectiva se active en la fase 7
- El perfil publico usa un contrato propio y no reutiliza `UserPublic` con `email`

## Phase Notes

### Phase 1

- Detailed tasks:
- Actualizar docs de implementacion para la fase 6
- Crear `tests/test_social.py`
- Cubrir busqueda por username, perfil publico, follow/unfollow, self-follow prohibido y feed paginado por cursor
- Cubrir generacion de actividades al crear resena, watch log y follow
- Findings:
- El repositorio de usuario actual tuvo que ampliarse para busqueda y lectura publica
- Separar `tests/test_social.py` redujo acoplamiento con `tests/test_reviews.py`
- Tests:
- `pytest tests/test_social.py`
- Review notes:
- Follow/unfollow se fijaron como idempotentes para simplificar mobile
- Status:
- completed

### Phase 2

- Detailed tasks:
- Crear modelos `follows` y `activities` con migracion y constraints
- Introducir entidades de dominio para perfil publico, activity actor y feed items
- Extender interfaces/repositorios para busqueda de usuarios, lectura de perfil publico, follow graph y feed
- Crear casos de uso para search users, get public profile, follow user, unfollow user y list feed
- Crear `ActivityPublisher` para desacoplar `create_review` y `create_watch_log` de la persistencia concreta del feed
- Findings:
- `create_review` y `create_watch_log` quedaron conectados a publicacion de actividad sin meter logica en routers
- El feed se resolvio con una sola query agregada y mapeo a union discriminada en backend
- Tests:
- `pytest tests/test_social.py`
- Review notes:
- SQLite de tests soporta correctamente unicidad compuesta, self-reference y orden por cursor con desempate por `id`
- Status:
- completed

### Phase 3

- Detailed tasks:
- Crear schemas de presentacion para busqueda, perfil publico, feed item y pagina con cursor
- Anadir router social con endpoints de usuarios/follow/feed
- Registrar modelos y router nuevos en `main.py`
- Mapear entidades a respuestas sin filtrar accidentalmente campos privados
- Findings:
- El contrato de perfil publico elimina por completo `email`
- El feed ya queda preparado a nivel de contrato para `list_created` sin romper mobile mas adelante
- Tests:
- `pytest tests/test_social.py`
- Review notes:
- El cursor es suficientemente estable para timestamps compartidos gracias al desempate por `id`
- Status:
- completed

### Phase 4

- Detailed tasks:
- Crear entidades mobile para public profile, user search result, follow state y feed item
- Anadir repositorio HTTP social y wiring de navegacion
- Integrar bloque social dentro de `Home` debajo del feed actual
- Implementar pantalla de busqueda y pantalla de perfil publico
- Resolver follow/unfollow con actualizacion local en perfil y refetch simple en `Home`
- Findings:
- `ProfileScreen` del usuario autenticado no se mezclo con el perfil publico, evitando estados cruzados
- `Home` conserva el contenido de descubrimiento y anade una seccion social separada con su propio loading/error
- Tests:
- `npx tsc --noEmit`
- Review notes:
- La paginacion incremental filtra ids repetidos para blindar duplicados entre cargas
- Status:
- completed

### Phase 5

- Detailed tasks:
- Ejecutar checks completos
- Revisar diff con foco en privacidad, paginacion y side effects de actividad
- Registrar findings, accepted risks y trabajo diferido
- Findings:
- `pytest tests/test_social.py` pasa
- `pytest tests/` pasa con 67 tests verdes
- `npx tsc --noEmit` pasa
- No se ha ejecutado una prueba manual en Expo dentro de esta sesion
- Tests:
- `pytest tests/test_social.py`
- `pytest tests/`
- `npx tsc --noEmit`
- Review notes:
- Se acepta como riesgo residual la falta de validacion visual/manual en Expo
- Status:
- completed

## Review Findings

- fixed: el perfil publico no reutiliza `UserPublic` con `email`, evitando fuga de datos privados
- fixed: el feed usa cursor opaco por `(created_at, id)` y cubre paginacion sin duplicados en tests
- fixed: la emision de actividades desde reviews/watchlog/follow vive fuera de routers
- accepted risk: falta validacion manual en Expo para UX fina del feed social, empty states y transiciones de follow

## Deferred Work

- Recomendaciones de cuentas
- Notificaciones por follow o actividad nueva
- Reacciones/comentarios sobre items del feed
- Exposicion UI de `list_created` antes de la fase 7
- Privacidad avanzada de perfil o feed

## Final Confidence Check

- Confidence score:
- 9/10
- Likely code review callouts:
- La actividad `list_created` esta preparada en backend pero aun no se emite ni se representa en mobile
- El bloque social de `Home` puede pedir una segunda pasada de UX una vez se pruebe en dispositivo real
- Residual risks:
- Falta validacion manual en Expo para confirmar espaciado, copies y ritmo visual del feed social
