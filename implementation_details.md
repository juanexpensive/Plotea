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

# Fase 9 - Confirmacion de contrasena y refresco del perfil Details

## Repository Context

- Relevant files:
- `mobile/src/presentation/features/auth/RegisterViewModel.ts`
- `mobile/src/presentation/features/auth/RegisterScreen.tsx`
- `mobile/src/presentation/features/profile/ProfileViewModel.ts`
- `implementation.md`
- `implementation_details.md`
- Existing patterns to follow:
- `useFocusEffect` en view models mobile que deben refrescar datos al volver a foco
- Validacion ligera en cliente antes de llamar a repositorios HTTP
- Constraints:
- `POST /auth/register` mantiene el mismo payload
- No existe suite de tests frontend automatizada en el repo
- El perfil publico ya resuelve el refresco con `useFocusEffect` y sirve como referencia

## Decisions Locked

- La confirmacion de contrasena vive solo en mobile y no forma parte del contrato backend
- Si falta cualquiera de los dos campos de contrasena, el formulario sigue mostrando `Rellena todos los campos`
- Si las contrasenas no coinciden, no se llama a `register` y se muestra `Las contrasenas no coinciden`
- El perfil propio se recarga al recuperar foco usando `useFocusEffect`
- La recarga del perfil sigue separando la llamada de stats para no bloquear la pantalla completa
- Si la pantalla vuelve a foco durante edicion activa, se conservan los drafts locales y solo se actualiza el resto del estado remoto
- Las respuestas tardias no deben mutar estado tras perder foco gracias al patron `active`

## Phase Notes

### Phase 1

- Detailed tasks:
- Extender `RegisterViewModel` con `confirmPassword`
- Validar campos completos y coincidencia antes de llamar a `register`
- Renderizar segundo input seguro en `RegisterScreen`
- Findings:
- La validacion cliente puede resolverse sin tocar `AuthRepository` ni backend
- El flujo de error existente ya permite mostrar el mensaje de mismatch sin nueva UI
- Tests:
- `npx tsc --noEmit`
- Review notes:
- Se mantiene el comportamiento actual de alta para contrasenas validas
- Status:
- completed

### Phase 2

- Detailed tasks:
- Extraer la carga de perfil a una rutina reutilizable basada en foco
- Sustituir `useEffect([])` por `useFocusEffect`
- Rehidratar drafts solo cuando no hay edicion activa
- Mantener carga de stats aislada y protegida por cleanup
- Findings:
- El patron de `PublicProfileViewModel` encaja bien para evitar updates tras unblur/unmount
- Recargar stats tras guardar perfil evita dejar valores stale hasta el siguiente cambio de foco
- Tests:
- `npx tsc --noEmit`
- Review notes:
- Se preserva la tolerancia a fallo parcial de stats que ya tenia la pantalla
- Status:
- completed

### Phase 3

- Detailed tasks:
- Actualizar `implementation.md` y `implementation_details.md`
- Ejecutar validacion TypeScript
- Revisar el diff para detectar regresiones de estado y UX
- Findings:
- No fue necesario tocar contratos, entidades backend ni repositorios HTTP
- Sigue pendiente validacion manual para confirmar el refresco al volver desde diario/listas/estado
- Tests:
- `npx tsc --noEmit`
- Review notes:
- La mayor incertidumbre residual es visual/flujo, no tipado ni contrato
- Status:
- completed

## Review Findings

- fixed: el registro mobile exige confirmar contrasena antes de crear la cuenta
- fixed: el formulario no llama al backend cuando las contrasenas divergen
- fixed: el perfil propio deja de depender de una unica carga inicial y se sincroniza al recuperar foco
- fixed: la recarga del perfil protege el estado frente a respuestas tardias
- accepted risk: no hay test automatizado de UI que cubra el mismatch de contrasena
- accepted risk: el refresco del perfil necesita validacion manual en Expo/dispositivo real para confirmar timing y UX

## Deferred Work

- Validacion de fortaleza de contrasena en registro
- Tests automatizados frontend para flujos de auth y perfil
- Pull to refresh explicito en perfil propio si se quiere refresco manual adicional

## Final Confidence Check

- Confidence score:
- 9.1/10
- Likely code review callouts:
- Podria discutirse si conviene preservar drafts durante edicion activa o forzar sincronizacion completa al volver a foco
- La recarga por foco hace varias llamadas de red y podria merecer optimizacion si crece el coste del perfil
- Residual risks:
- No se ha ejecutado validacion manual en Expo en esta sesion

# Fase 10 - Navegacion de 5 tabs, Social visual y Perfil curado Details

## Repository Context

- Relevant files:
- `backend/app/data/models/user_favorite_media.py`
- `backend/app/presentation/routers/social.py`
- `backend/app/presentation/routers/watch_log.py`
- `mobile/app/(tabs)/_layout.tsx`
- `mobile/src/presentation/features/social/SocialScreen.tsx`
- `mobile/src/presentation/features/social/SocialViewModel.ts`
- `mobile/src/presentation/features/profile/ProfileViewModel.ts`
- `mobile/src/presentation/features/profile/ProfileScreen.tsx`
- `tests/test_social.py`
- `tests/test_watch_log.py`
- Existing patterns to follow:
- feed social ya paginado con cursor y enrichment parcial en mobile
- watchlog list actual enriqueciendo TMDB en cliente como referencia funcional
- tabs con `expo-router` y `headerShown: false` en el shell principal
- Constraints:
- el feed actual no traia titulo ni caratula, asi que el radar visual necesitaba contrato propio
- `DESIGN.md` marca una jerarquia sobria y densa, pero el proyecto mantiene un sistema dark ya implantado
- no habia concepto previo de favoritas manuales en backend ni mobile

## Decisions Locked

- La app principal queda con 5 tabs: `Inicio`, `Social`, `Diario`, `Listas`, `Perfil`
- `Inicio` deja de mostrar actividad social y se centra en descubrir y buscar
- El bloque visual social se agrupa por obra (`tmdb_id + media_type`), no por evento individual
- El bloque visual social solo usa `watch_log` y `review` en v1
- `follow` y `list_created` siguen viviendo solo en el feed detallado
- Las 4 favoritas del perfil son manuales y aceptan peliculas y series
- Los visionados recientes del perfil llegan enriquecidos desde backend en vez de montar otro enrichment local ad hoc
- El fallback cuando TMDB falla devuelve titulo generico y poster nulo, no error fatal
- `Perfil` mantiene accesos secundarios a `Diario` y `Listas`, pero el peso principal se mueve a sus tabs propias

## Phase Notes

### Phase 1

- Detailed tasks:
- Anadir tests para `GET/PUT /users/me/favorites`
- Anadir test para `GET /feed/visual`
- Anadir test para `GET /watchlog/me/recent`
- Findings:
- El resumen visual necesitaba agrupar sin cortar demasiado pronto para no perder actividad posterior de una obra ya vista
- Reutilizar `FakeTmdbClient` simplifico fijar caratula/titulo en contratos nuevos
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_watch_log.py -q`
- Review notes:
- Se fijo que los endpoints nuevos deben seguir respondiendo incluso si el enrichment no trae poster real
- Status:
- completed

### Phase 2

- Detailed tasks:
- Crear tabla `user_favorite_media`
- Crear repositorio de favoritas y use cases de lectura/escritura
- Crear `MediaSummaryLoader` como servicio compartido
- Crear use case para feed visual agrupado y otro para watchlog reciente enriquecido
- Findings:
- `MediaSummaryLoader` permite compartir fallback de metadata entre social, favoritas y recent watch
- Mantener los endpoints separados evita inflar el contrato del feed social existente
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_watch_log.py -q`
- Review notes:
- La agrupacion visual corta al numero de obras resultantes, no al numero de eventos leidos
- Status:
- completed

### Phase 3

- Detailed tasks:
- Ampliar tabs a 5 destinos
- Crear tabs reales para `Social`, `Diario` y `Listas`
- Limpiar `HomeViewModel` de estado social
- Findings:
- `WatchLogListScreen` y `MyListsScreen` se pudieron reutilizar como tab screens sin duplicar logica
- Mantener tambien las rutas stack existentes preserva compatibilidad con pushes previos
- Tests:
- `npx tsc --noEmit`
- Review notes:
- La navegacion se vuelve mucho mas explicita sin necesidad de rehacer la estructura root
- Status:
- completed

### Phase 4

- Detailed tasks:
- Crear `SocialViewModel` con cargas independientes para radar visual y feed detallado
- Crear `SocialScreen` con cards agrupadas por obra y feed textual debajo
- Mantener `Buscar usuarios` dentro de la propia tab social
- Findings:
- El bloque visual y el feed textual necesitaban errores y loading separados para no tumbar toda la experiencia social
- La agrupacion por obra responde mejor a la necesidad de “que opina la gente de esta peli” que el feed puro
- Tests:
- `npx tsc --noEmit`
- Review notes:
- La card visual usa poster como ancla y metadatos compactos para seguir la intencion de `DESIGN.md`
- Status:
- completed

### Phase 5

- Detailed tasks:
- Reescribir `ProfileViewModel` para cargar stats, favoritas y recent watch
- Crear editor sencillo de favoritas por slot + buscador
- Reescribir `ProfileScreen` hacia identidad, favoritas y rastro reciente
- Findings:
- Un editor por slot con busqueda es suficiente para v1 y evita inventar drag-and-drop o modales complejos
- El carrusel reciente funciona mejor con backend enriquecido que replicando otra vez llamadas TMDB en pantalla
- Tests:
- `npx tsc --noEmit`
- Review notes:
- Se mantienen accesos secundarios a `Diario` y `Listas` por comodidad, pero ya no dominan la pantalla
- Status:
- completed

### Phase 6

- Detailed tasks:
- Ejecutar tests backend del slice nuevo
- Ejecutar TypeScript
- Revisar diff y actualizar docs
- Findings:
- `test_social.py` pasa con 18 tests verdes
- `test_watch_log.py` pasa con 9 tests verdes
- `npx tsc --noEmit` pasa
- Sigue pendiente validacion manual en Expo
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_watch_log.py -q`
- `npx tsc --noEmit`
- Review notes:
- El mayor riesgo residual es UX visual y coste de enrichment, no tipado ni shape de contratos
- Status:
- completed

## Review Findings

- fixed: el producto ya no obliga a entrar en `Perfil` para llegar a `Diario` y `Listas`
- fixed: `Inicio` deja de mezclar descubrimiento con social
- fixed: `Social` ahora ofrece una lectura visual por obra antes del feed detallado
- fixed: `Perfil` ya no depende de strings con `tmdb_id` para expresar gusto propio o visionados recientes
- fixed: favoritas, social visual y watchlog reciente comparten enrichment y fallback coherentes
- accepted risk: el enrichment sigue siendo best effort y puede implicar varias llamadas TMDB por carga
- accepted risk: la app sigue usando el sistema dark existente; la alineacion con `DESIGN.md` es de composicion/jerarquia mas que de paleta global

## Deferred Work

- Cache persistente o batching de metadata TMDB
- Reordenacion drag-and-drop de favoritas
- Version clara completa del design system si se decide alinear toda la app con `DESIGN.md`
- Mas densidad visual en radar social con avatar real renderizado y pequenas senales agregadas

## Final Confidence Check

- Confidence score:
- 8.8/10
- Likely code review callouts:
- El coste de enrichment TMDB podria requerir cache si el radar social o el perfil crecen
- El editor de favoritas resuelve v1 pero puede quedarse corto frente a reorder/curation mas rica
- Queda margen para empujar mas la coherencia visual con `DESIGN.md` si se aborda una fase de theming mayor
- Residual risks:
- No se ha ejecutado validacion manual en Expo en esta sesion

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
