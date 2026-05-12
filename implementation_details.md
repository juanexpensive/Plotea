# Fase 8 - Perfil, estadisticas y edicion de usuario Details

## Repository Context

- Relevant files:
- `backend/app/domain/entities/social.py`
- `backend/app/domain/repositories/i_user_repository.py`
- `backend/app/data/repositories/user_repository.py`
- `backend/app/data/repositories/watch_log_repository.py`
- `backend/app/domain/services/user_stats_aggregator.py`
- `backend/app/domain/usecases/social/get_user_stats.py`
- `backend/app/domain/usecases/social/update_my_profile.py`
- `backend/app/presentation/schemas/auth.py`
- `backend/app/presentation/schemas/social.py`
- `backend/app/presentation/routers/auth.py`
- `backend/app/presentation/routers/social.py`
- `mobile/src/domain/entities/auth.ts`
- `mobile/src/domain/entities/social.ts`
- `mobile/src/data/repositories/SocialRepository.ts`
- `mobile/src/presentation/features/profile/ProfileViewModel.ts`
- `mobile/src/presentation/features/profile/ProfileScreen.tsx`
- `mobile/src/presentation/features/social/PublicProfileViewModel.ts`
- `mobile/src/presentation/features/social/PublicProfileScreen.tsx`
- `mobile/src/presentation/features/social/UserStatsSection.tsx`
- `tests/test_login.py`
- `tests/test_social.py`
- Existing patterns to follow:
- Clean Architecture con entidades, repositorios y use cases por vertical slice
- FastAPI con schemas Pydantic y dependencia TMDB ya compartida desde `media`
- Mobile con repositorios HTTP simples, view models locales por pantalla y UI en Expo Router
- Constraints:
- Las stats debian calcularse solo desde `watch_log`
- `avatar_url` no admite binarios ni rutas locales
- No se introduce cache persistente TMDB en esta fase
- El perfil publico existente no debia cambiar su contrato base

## Decisions Locked

- `PUT /users/me` actualiza solo `display_name`, `bio` y `avatar_url`
- Los campos omitidos en `PUT /users/me` preservan el valor actual; `null` explicito limpia el campo
- `display_name` rechaza strings en blanco tras `trim`
- `bio` y `avatar_url` aceptan `null`; string en blanco se normaliza a `null`
- `avatar_url` solo acepta URLs absolutas `http/https`
- `GET /auth/me` devuelve ahora `bio` y `avatar_url`
- `GET /users/{username}/stats` devuelve `watched_count`, `estimated_hours`, `top_genres` y `average_rating`
- `estimated_hours` se redondea a un decimal y usa solo runtimes TMDB disponibles
- `top_genres` devuelve top 3 estable por conteo descendente y nombre ascendente
- Fallos parciales de TMDB no rompen el endpoint de stats; solo degradan horas/generos
- En mobile, errores de stats no bloquean la carga del perfil propio ni del perfil publico

## Phase Notes

### Phase 1

- Detailed tasks:
- Extender `tests/test_login.py` para fijar `bio` y `avatar_url` en `/auth/me`
- Anadir tests de actualizacion de perfil y stats en `tests/test_social.py`
- Montar `FakeTmdbClient` con payloads por `(media_type, tmdb_id)` para stats
- Findings:
- El contrato de perfil propio no distinguiÃ³ entre campo omitido y `null` hasta fijarlo en tests
- Las stats requerian una regla explicita de degradacion si TMDB falla
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_login.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- Review notes:
- Se fijÃ³ 422 para `display_name` en blanco y para `avatar_url` insegura
- Status:
- completed

### Phase 2

- Detailed tasks:
- Extender `IUserRepository` y `UserRepository` con `update_profile`
- Crear `PublicUserStats` y `GenreStat`
- Crear `UserStatsAggregator` sobre `GetMediaDetailUseCase`
- Crear `GetUserStatsUseCase` y `UpdateMyProfileUseCase`
- Findings:
- Reutilizar `GetMediaDetailUseCase` evitÃ³ duplicar parsing de runtime y generos entre movie/tv
- El no-op de `PUT /users/me` requiriÃ³ preservar campos no enviados usando `model_fields_set`
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- Review notes:
- La logica de TMDB queda encapsulada en servicio y no en router
- Status:
- completed

### Phase 3

- Detailed tasks:
- Ampliar `UserResponse` con `bio` y `avatar_url`
- Crear `UpdateMyProfileRequest`, `GenreStatResponse` y `PublicUserStatsResponse`
- Exponer `PUT /users/me` y `GET /users/{username}/stats`
- Findings:
- `PUT /users/me` usa `UserResponse` porque es un endpoint propio y necesita `email`
- `GET /users/{username}/stats` se apoyÃ³ en la dependencia `get_tmdb_client` ya existente
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_login.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- Review notes:
- El perfil publico base sigue sin exponer email y las stats viven separadas
- Status:
- completed

### Phase 4

- Detailed tasks:
- Ampliar `User` mobile con `bio` y `avatar_url`
- Anadir `updateMyProfile` y `getUserStats` en `SocialRepository`
- Extender `ProfileViewModel` con modo de edicion, borradores y guardado
- Renderizar formulario inline y avatar remoto en `ProfileScreen`
- Findings:
- Cargar stats en segunda llamada despues de `getMe` evitÃ³ bloquear toda la pantalla si TMDB falla
- La edicion inline permitiÃ³ mantener la fase pequena sin abrir nueva ruta
- Tests:
- `npx tsc --noEmit`
- Review notes:
- El feedback de guardado y cancelacion queda dentro de la misma pantalla
- Status:
- completed

### Phase 5

- Detailed tasks:
- Crear entidad `PublicUserStats` mobile y componente compartido `UserStatsSection`
- Extender `PublicProfileViewModel` para cargar stats de forma aislada
- Renderizar avatar remoto y bloque de stats en `PublicProfileScreen`
- Findings:
- Se mantuvieron los contadores base del perfil publico y se aÃ±adieron stats detalladas aparte
- `UserStatsSection` evita duplicacion fuerte entre perfil propio y publico
- Tests:
- `npx tsc --noEmit`
- Review notes:
- El perfil publico sigue siendo read-only salvo la accion de follow
- Status:
- completed

### Phase 6

- Detailed tasks:
- Ejecutar tests del slice nuevo y TypeScript
- Revisar diff y actualizar docs de implementacion
- Registrar riesgos residuales reales
- Findings:
- `test_login.py` pasa con 4 tests verdes
- `test_social.py` pasa con 16 tests verdes
- `npx tsc --noEmit` pasa
- No se ha ejecutado Expo en esta sesion
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_login.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `npx tsc --noEmit`
- Review notes:
- Sigue pendiente la validacion manual en dispositivo para confirmar el flujo de edicion y el render de avatar remoto
- Status:
- completed

## Review Findings

- fixed: `PUT /users/me` preserva campos omitidos y solo limpia cuando llega `null` explicito
- fixed: las stats se calculan solo desde `watch_log`, sin mezclar `reviews` ni `watchlist`
- fixed: el endpoint de stats degrada horas/generos cuando TMDB falla sin inventar datos
- fixed: el perfil propio mobile soporta editar `display_name`, `bio` y `avatar_url`
- fixed: el perfil publico y el propio comparten bloque de stats sin mezclar estado UI
- accepted risk: el calculo de stats hace llamadas TMDB por entrada de `watch_log` y aun no introduce cache persistente
- accepted risk: no hubo validacion visual/manual en Expo en esta sesion

## Deferred Work

- Cache persistente o memoizacion de metadata TMDB para stats
- Upload real de avatar y almacenamiento propio
- Edicion de username o email
- Recalculo agregado/materializado de stats para usuarios con diarios grandes
- Hardening visual del formulario de perfil tras prueba en dispositivo real

## Final Confidence Check

- Confidence score:
- 8.7/10
- Likely code review callouts:
- El agregador de stats hace enriquecimiento TMDB secuencial y podria necesitar cache o batching si crece el volumen de `watch_log`
- `avatar_url` se valida por esquema `http/https`, pero no se valida reachability ni contenido real de imagen
- La UX de edicion inline y el render de avatar remoto necesitan validacion manual en Expo
- Residual risks:
- No se ha ejecutado `pytest ..\tests -q` en esta sesion hasta este punto de documentacion
- Las stats dependen de disponibilidad parcial de TMDB para horas y generos
