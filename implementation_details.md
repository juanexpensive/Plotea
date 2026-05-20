# Fase 19 - Mitigacion de deuda tecnica estructural Details

## Repository Context

- Relevant files:
- `backend/app/domain/usecases/auth/*.py`
- `backend/app/domain/services/i_auth_policy.py`
- `backend/app/domain/services/i_auth_token_service.py`
- `backend/app/domain/services/i_password_hasher.py`
- `backend/app/domain/services/i_clock.py`
- `backend/app/infrastructure/security.py`
- `backend/app/infrastructure/config.py`
- `backend/app/presentation/dependencies.py`
- `backend/app/presentation/routers/auth.py`
- `backend/app/presentation/routers/social.py`
- `backend/app/presentation/schemas/media.py`
- `mobile/src/infrastructure/storage/tokenStorage.ts`
- `mobile/src/infrastructure/auth/authRedirect.ts`
- `mobile/src/data/repositories/SocialRepository.ts`
- `mobile/src/presentation/features/social/PublicProfileViewModel.ts`
- `mobile/src/presentation/features/profile/ProfileWatchlistTab.tsx`
- `mobile/src/presentation/features/profile/WatchLogDiaryContent.tsx`
- `mobile/src/presentation/features/home/HomeScreen.tsx`
- `tests/test_app_config.py`
- `tests/test_social.py`
- `SETUP.md`
- `DEPLOY.md`
- Existing patterns to follow:
- composition root ligero en `presentation/dependencies.py`
- servicios de enrichment ya existentes como `MediaSummaryLoader`
- mobile con repositorios HTTP finos y viewmodels por pantalla
- Constraints:
- no romper contratos HTTP actuales de auth
- no introducir un contenedor DI de terceros
- mantener el repo validable con la suite existente

## Decisions Locked

- Los use cases de auth dependen de interfaces (`IAuthTokenService`, `IPasswordHasher`, `IAuthPolicy`, `IClock`)
- El composition root vive en `backend/app/presentation/dependencies.py`
- CORS usa allowlist desde settings y deja de aceptar comodines
- Si `SecureStore` no existe, los tokens viven solo en memoria y no se persisten
- El redirect auth se centraliza con un helper de navegacion compartido
- El N+1 del perfil publico se mitiga con endpoints enriquecidos aditivos:
- `GET /users/{username}/watchlist/enriched`
- `GET /users/{username}/watchlog/enriched`
- `MediaItem` se reutiliza como resumen compartido; no se crea un contrato paralelo innecesario

## Review Findings

- fixed: el dominio auth ya no importa helpers concretos de infraestructura
- fixed: los routers de auth dejan de actuar como composition root improvisado
- fixed: CORS deja de usar `allow_origins=["*"]`, `allow_methods=["*"]` y `allow_headers=["*"]`
- fixed: el warning de `pytest-asyncio` desaparece con `asyncio_default_fixture_loop_scope=function`
- fixed: mobile deja de persistir tokens en `AsyncStorage` cuando no hay secure storage
- fixed: el perfil publico ya no llama `getMediaDetail()` por cada item de watchlist/diario
- fixed: `HomeScreen` deja de arrastrar codigo social muerto que ya no formaba parte de la experiencia actual
- accepted risk: sigue pendiente una descomposicion mayor de `DetailScreen.tsx`, `ProfileScreen.tsx` y `ProfileViewModel.ts`
- accepted risk: el helper de redirect auth centraliza navegacion, pero no sustituye todavia una capa global de estado auth

## Validation

- `backend\.venv\Scripts\python.exe -m pytest ..\tests -q`
- `npm exec tsc -- --noEmit`

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

# Fase 10 - Edicion inline del perfil y subida real de avatar Details

## Repository Context

- Relevant files:
- `backend/app/main.py`
- `backend/app/infrastructure/storage_paths.py`
- `backend/app/presentation/routers/social.py`
- `backend/requirements.txt`
- `mobile/package.json`
- `mobile/src/data/repositories/SocialRepository.ts`
- `mobile/src/presentation/features/profile/ProfileViewModel.ts`
- `mobile/src/presentation/features/profile/ProfileScreen.tsx`
- `tests/test_social.py`
- Existing patterns to follow:
- Repositorios HTTP ligeros en mobile y coordinacion de estados en view model
- Routers FastAPI finos apoyados en use cases existentes
- `/static` ya montado como superficie publica para recursos servidos por backend
- Constraints:
- `avatar_url` sigue siendo una URL publica absoluta a nivel de contrato
- No existe storage externo configurado en el proyecto
- La pantalla de perfil no tiene tests UI automatizados

## Decisions Locked

- El boton de tres puntos abre un menu con una sola accion: `Cerrar sesion`
- El boton izquierdo de editar desaparece por completo
- `display_name` se edita inline con `TextInput` y guardado en blur o submit
- `bio` mantiene su edicion inline existente
- El avatar se selecciona desde galeria, con recorte cuadrado y sin usar camara
- El backend guarda los avatares dentro de `backend/app/presentation/static/uploads/avatars`
- El limite de avatar queda en 5 MB y los MIME admitidos son JPEG, PNG y WebP

## Phase Notes

### Phase 1

- Detailed tasks:
- Eliminar `isEditing` y el editor de perfil basado en URL
- Introducir estado explicito para menu de acciones, edicion de nombre y subida de avatar
- Hacer pulsable la foto y el nombre dentro de `ProfileScreen`
- Findings:
- El flujo anterior mezclaba varias responsabilidades en `savingProfile`
- La bio inline existente servia como patron natural para el nombre
- Tests:
- `npm exec tsc -- --noEmit`
- Review notes:
- Se mantiene `successMessage` compartido, pero ahora con textos especificos por accion
- Status:
- completed

### Phase 2

- Detailed tasks:
- Crear una ubicacion estable de storage local con `storage_paths.py`
- Asegurar la existencia del directorio de uploads al arrancar la app
- Anadir `POST /users/me/avatar` con validacion de tipo y tamano
- Persistir la `avatar_url` final reutilizando `UpdateMyProfileUseCase`
- Cubrir subida exitosa, rechazo de texto plano y rechazo por tamano
- Findings:
- Importar la ruta de uploads desde `main.py` creaba riesgo de ciclo; se extrajo a infraestructura comun
- `request.url_for("static", ...)` permite devolver una URL absoluta sin configuracion extra
- Tests:
- `backend\\.venv\\Scripts\\python.exe -m pytest tests/test_social.py`
- Review notes:
- La suite backend pasa completa; queda un warning existente de `pytest-asyncio` no introducido por este cambio
- Status:
- completed

### Phase 3

- Detailed tasks:
- Instalar `expo-image-picker`
- Anadir `uploadMyAvatar` en `SocialRepository`
- Pedir permiso de galeria, abrir picker y subir el asset elegido
- Refrescar resumen y stats tras actualizar avatar o nombre
- Findings:
- Expo SDK 54 usa `mediaTypes: ['images']`, no hace falta la API deprecated
- `FormData` en React Native necesita enviar `uri`, `name` y `type`
- Tests:
- `npm exec tsc -- --noEmit`
- Review notes:
- Falta validacion manual en un dispositivo/emulador para comprobar permisos y UX del picker
- Status:
- completed

## Review Findings

- fixed: el boton de tres puntos deja de cerrar sesion directamente
- fixed: el editor de perfil por `avatar_url` desaparece en favor de interacciones inline
- fixed: el backend admite subida real de avatar y devuelve `avatar_url` publica persistida
- accepted risk: no se elimina automaticamente el avatar anterior del disco cuando el usuario sube uno nuevo

# Fase 11 - Perfil publico con favoritas, actividad, watchlist y diario Details

## Repository Context

- Relevant files:
- `backend/app/presentation/routers/social.py`
- `tests/test_social.py`
- `mobile/src/data/repositories/SocialRepository.ts`
- `mobile/src/presentation/features/social/PublicProfileViewModel.ts`
- `mobile/src/presentation/features/social/PublicProfileScreen.tsx`
- `mobile/src/presentation/features/profile/ProfileWatchlistTab.tsx`
- `mobile/src/presentation/features/profile/WatchLogDiaryContent.tsx`
- Existing patterns to follow:
- Endpoints publicos por `username` dentro del router social
- Reutilizacion de componentes del perfil propio cuando la interaccion de solo lectura lo permite
- Cargas parciales independientes para que un fallo no tumbe toda la pantalla
- Constraints:
- El backend no tenia estos endpoints publicos al inicio de la tarea
- `WatchLogDiaryContent` estaba acoplado a borrado y hubo que relajarlo a modo opcional

## Decisions Locked

- El perfil publico replica la estructura del perfil propio: pestana principal, watchlist y diario
- La pestana principal publica muestra hero, stats, boton follow, 4 favoritas y actividad reciente
- Se eliminan de esta vista las listas publicas previas para mantener la paridad con el perfil propio
- El follow es la unica accion mutable disponible en perfil ajeno
- Los endpoints publicos nuevos requieren autenticacion, igual que el resto del area social

## Phase Notes

### Phase 1

- Detailed tasks:
- Exponer `GET /users/{username}/favorites`
- Exponer `GET /users/{username}/watchlist`
- Exponer `GET /users/{username}/watchlog`
- Exponer `GET /users/{username}/watchlog/recent`
- Reutilizar repositorios y use cases existentes con resolucion del usuario objetivo por `username`
- Findings:
- No hizo falta tocar dominio ni persistencia; basto con orquestar los casos de uso ya existentes
- `watchlog/recent` podia reutilizar directamente el enriquecimiento TMDB existente del perfil propio
- Tests:
- `backend\\.venv\\Scripts\\python.exe -m pytest tests/test_social.py -q`
- Review notes:
- Se anadieron pruebas para favoritas publicas, watchlist publica y diario/actividad reciente publica
- Status:
- completed

### Phase 2

- Detailed tasks:
- Extender `SocialRepository` mobile con lecturas publicas de favoritas, watchlist y diario
- Rehacer `PublicProfileViewModel` con estados separados para `stats`, `favorites`, `recentWatch`, `watchlist` y `diary`
- Enriquecer localmente watchlist y diario con `getMediaDetail`
- Findings:
- El diario completo sigue devolviendose crudo desde backend y se enriquece en mobile para reutilizar la UI existente
- `recentWatch` ya viene enriquecido desde API y sirve para el rail de actividad
- Tests:
- `npm exec tsc -- --noEmit`
- Review notes:
- El tipado estructural permite reutilizar `ProfileWatchlistTab` y `WatchLogDiaryContent` sin crear modelos duplicados de UI
- Status:
- completed

### Phase 3

- Detailed tasks:
- Rehacer `PublicProfileScreen` con tabs reales
- Anadir boton visible `Seguir` / `Siguiendo`
- Renderizar favoritas y actividad reciente como en el perfil propio
- Reutilizar `ProfileWatchlistTab` y `WatchLogDiaryContent` en modo lectura
- Hacer navegables posters, favoritas y entradas del diario hacia `/detail`
- Findings:
- El perfil publico quedaba incompleto porque el trabajo previo solo habia igualado la estetica basica, no las fuentes de datos ni las secciones
- Se volvio necesario hacer `onDelete` opcional en `WatchLogDiaryContent` para uso readonly
- Tests:
- `npm exec tsc -- --noEmit`
- `backend\\.venv\\Scripts\\python.exe -m pytest tests/test_social.py -q`
- Review notes:
- Falta validacion manual en dispositivo/emulador para confirmar sensacion final y scroll de tabs
- Status:
- completed

## Review Findings

- fixed: el perfil publico ya muestra sus 4 favoritas
- fixed: el perfil publico ya muestra actividad reciente, watchlist y diario del usuario visitado
- fixed: el boton de follow queda visible y coherente con el estado `Seguir` / `Siguiendo`
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

# Fase 11 - DetailScreen editorial tipo Letterboxd Details

## Repository Context

- Relevant files:
- `DESIGN.md`
- `mobile/src/presentation/features/detail/DetailScreen.tsx`
- `mobile/src/presentation/features/detail/DetailViewModel.ts`
- `mobile/src/presentation/theme/darkDesign.ts`
- `mobile/src/presentation/theme/sharedStyles.ts`
- `mobile/src/domain/entities/media.ts`
- Existing patterns to follow:
- pantalla mobile autocontenida con logica en `DetailViewModel` y render en `DetailScreen`
- sistema visual dark ya implantado en mobile, con verde esmeralda como accent principal
- `DESIGN.md` marca disciplina tipografica, contraste controlado y uso escaso del accent
- Constraints:
- `MediaDetail` no trae director, trailer ni tagline reales
- la pantalla actual mezcla acciones, formularios y resenas demasiado arriba
- no existe suite automatizada de UI para esta pantalla

## Decisions Locked

- La referencia de Letterboxd se toma como inspiracion de composicion, no como clon de paleta
- `DESIGN.md` se aplicara en jerarquia, espaciado, tipografia compacta y uso escaso del verde
- Se mantiene el canvas dark actual de mobile para no romper coherencia con el resto de la app
- Las acciones principales deben tender a icono + etiqueta corta o icono solo cuando siga siendo claro
- El bloque de resenas pierde protagonismo inicial y baja en la pagina
- No se inventaran datos no disponibles como director real o CTA de trailer funcional

## Phase Notes

### Phase 1

- Detailed tasks:
- Revisar `DESIGN.md` para extraer reglas aplicables a una pantalla dark existente
- Inspeccionar `DetailScreen` y `DetailViewModel` para entender datos y restricciones reales
- Definir fases de trabajo y validacion
- Findings:
- La mejor traduccion es “estructura tipo Letterboxd + disciplina tipografica y de accent de PlotSkip”
- La ausencia de director/trailer/tagline obliga a componer con year, runtime, rating, genres y overview
- `@expo/vector-icons` ya esta disponible via Expo, asi que no hace falta introducir dependencia nueva para acciones iconicas
- Tests:
- `npx tsc --noEmit`
- Review notes:
- La mayor incertidumbre es de UX visual/manual, no de tipos o contratos
- Status:
- completed

### Phase 2

- Detailed tasks:
- Rehacer la cabecera con hero visual, poster flotante y metadata compacta
- Introducir una lectura editorial para title, eyebrow, lead y overview
- Mantener compatibilidad con los datos reales disponibles en `MediaDetail`
- Findings:
- Usar el poster existente como base del hero, con blur y overlay, da una presencia cinematografica sin exigir contrato nuevo de backdrop
- La combinacion de `DESIGN.md` y el tema dark actual funciona mejor como “disciplina de jerarquia” que como cambio de paleta total
- El render temprano se hizo mas robusto corrigiendo el guard clause para que errores posteriores no borren la pantalla si `detail` ya existe
- Tests:
- `npx tsc --noEmit`
- Review notes:
- La cabecera gana identidad sin introducir dependencias nuevas ni tocar el `ViewModel`
- Status:
- completed

### Phase 3

- Detailed tasks:
- Sustituir CTAs pesadas por una rail de acciones iconificada
- Reposicionar formularios de diario y reseña debajo de la sinopsis
- Compactar acciones sociales en reseñas con iconos de voto y comentarios
- Findings:
- Iconos con etiqueta micro ofrecen mejor equilibrio entre limpieza y descubribilidad que icon-only puro para esta v1
- Bajar las reseñas por debajo de la historia hace que la pantalla venda primero la obra y no la mecánica social
- Tests:
- `npx tsc --noEmit`
- Review notes:
- Se mantuvo toda la funcionalidad actual de estados, diario, reseñas y comentarios
- Status:
- completed

### Phase 4

- Detailed tasks:
- Ejecutar TypeScript
- Revisar diff para detectar regresiones de flujo y coherencia visual
- Actualizar docs de implementacion
- Findings:
- `npx tsc --noEmit` pasa
- Sigue pendiente comprobacion manual del equilibrio del hero y del rail de acciones en movil real
- Tests:
- `npx tsc --noEmit`
- Review notes:
- El riesgo principal ya no es de tipos sino de tuning visual y tactilidad
- Status:
- completed

## Review Findings

- fixed: la pantalla deja de entrar con una jerarquia plana y ahora prioriza claramente imagen, titulo y sinopsis
- fixed: las acciones principales pasan a un rail iconico mucho mas ligero que los botones previos
- fixed: las reseñas comunitarias pierden protagonismo inicial sin perder funcionalidad
- fixed: errores posteriores a la carga inicial ya no tumban toda la vista si `detail` sigue disponible
- accepted risk: el hero usa `poster_path` ampliado y difuminado porque el contrato actual no expone backdrop real
- accepted risk: la rail de acciones aun puede necesitar ajuste fino de labeling tras prueba manual

## Deferred Work

- Soporte real para backdrop, tagline, director y trailer si el contrato backend/TMDB se amplía
- Validacion visual en Expo/dispositivo real y posible ajuste de alturas/espaciados
- Iteracion posterior para sustituir o reducir aun mas el bloque de reseñas si se decide priorizar acciones propias sobre señal social

## Final Confidence Check

- Confidence score:
- 8.6/10
- Likely code review callouts:
- Puede discutirse si las etiquetas micro bajo icono deberian quedarse o pasar a icon-only con tooltips/hints contextuales
- El hero basado en poster blur funciona bien como fallback visual, pero no sustituye a un backdrop real cuando llegue ese dato
- Residual risks:
- No se ha validado manualmente en Expo/dispositivo real en esta sesion

# Fase 12 - DetailScreen con 3 acciones y modal de reseña Details

## Repository Context

- Relevant files:
- `mobile/src/presentation/features/detail/DetailScreen.tsx`
- `mobile/src/presentation/features/detail/DetailViewModel.ts`
- `implementation.md`
- `implementation_details.md`
- Existing patterns to follow:
- estado y mutaciones ya centralizados en `DetailViewModel`
- `Ionicons` disponible en mobile
- tema dark actual + disciplina de `DESIGN.md`
- Constraints:
- el hook sigue exponiendo estado de watchlog aunque esta pantalla ya no deba priorizarlo visualmente
- no hay suite visual automatizada

## Decisions Locked

- La pantalla debe exponer solo 3 acciones visibles: `vista`, `watchlist` y `reseña`
- `vista` sirve para quien quiere marcar que ha visto la obra sin escribir reseña
- No se expone desde aquí ninguna acción para otras listas
- La reseña se edita en un modal centrado, no en un formulario dentro del scroll
- La puntuación usa 5 estrellas con soporte de medias estrellas

## Phase Notes

### Phase 1

- Detailed tasks:
- Reducir la rail de acciones a 3 botones
- Eliminar el bloque visible de formularios inline asociado al diario
- Mantener el comportamiento de `watched` y `watchlist`
- Findings:
- El affordance de diario confundía el foco principal de la pantalla respecto a la intención actual
- La lógica de watchlog puede seguir existiendo en el `ViewModel` aunque ya no se renderice en esta iteración
- Tests:
- `npx tsc --noEmit`
- Review notes:
- El cambio busca claridad de producto más que ampliar capacidad
- Status:
- completed

### Phase 2

- Detailed tasks:
- Mover la reseña a un modal centrado
- Sustituir la rejilla numérica por selector de 5 estrellas con soporte de media estrella
- Mantener guardar, editar y borrar reseña dentro del modal
- Findings:
- El modal hace que la reseña se sienta como una acción principal, no como un bloque secundario dentro del scroll
- El selector por mitades se resolvió sin dependencias nuevas usando dos hit areas por estrella sobre `Ionicons`
- Tests:
- `npx tsc --noEmit`
- Review notes:
- La interacción queda mucho más alineada con la intención del usuario que el formulario inline previo
- Status:
- completed

### Phase 3

- Detailed tasks:
- Ejecutar TypeScript
- Revisar el diff para detectar restos del flujo de diario inline
- Actualizar documentación
- Findings:
- `npx tsc --noEmit` pasa
- La lógica de watchlog sigue existiendo en el `ViewModel`, pero ya no se expone visualmente desde esta pantalla
- Tests:
- `npx tsc --noEmit`
- Review notes:
- El principal punto pendiente es de ergonomía táctil, no de tipos ni flujo base
- Status:
- completed

## Review Findings

- fixed: la pantalla queda reducida a las 3 acciones pedidas y elimina el cuarto botón de diario
- fixed: la reseña se escribe y edita en un modal centrado en vez de dentro del scroll
- fixed: la puntuación pasa a 5 estrellas con soporte de medias estrellas
- fixed: no se expone desde esta vista ningún affordance para otras listas
- accepted risk: el selector de medias estrellas necesita validación manual en dispositivo real para confirmar que las hit areas se sienten precisas
- accepted risk: con teclado abierto puede hacer falta ajustar altura o scroll interno del modal según el dispositivo

## Deferred Work

- Revisar si la reseña propia debe seguir mostrándose en el body o resumirse de forma más compacta
- Ajuste fino del modal con teclado y pantallas pequeñas
- Si se quiere, limpiar después el estado de watchlog no usado en `DetailViewModel`

## Final Confidence Check

- Confidence score:
- 9.0/10
- Likely code review callouts:
- Podrían pedir convertir el modal en `KeyboardAvoidingView` si en móviles pequeños el teclado tapa parte del textarea
- El `ViewModel` aún conserva estado de watchlog que esta pantalla ya no usa visualmente
- Residual risks:
- No se ha validado manualmente en Expo/dispositivo real en esta sesión

# Fase 13 - Listas conjuntas con colaboradores y autoria por item Details

## Repository Context

- Relevant files:
- `backend/app/data/models/list.py`
- `backend/app/data/models/list_item.py`
- `backend/app/data/repositories/list_repository.py`
- `backend/app/domain/entities/lists.py`
- `backend/app/domain/repositories/i_list_repository.py`
- `backend/app/domain/usecases/lists/create_list.py`
- `backend/app/domain/usecases/lists/get_list_detail.py`
- `backend/app/domain/usecases/lists/add_list_item.py`
- `backend/app/domain/usecases/lists/remove_list_item.py`
- `backend/app/domain/usecases/lists/update_list.py`
- `backend/app/domain/usecases/lists/delete_list.py`
- `backend/app/domain/usecases/lists/swap_list_items.py`
- `backend/app/presentation/schemas/lists.py`
- `backend/app/presentation/routers/lists.py`
- `mobile/src/domain/entities/lists.ts`
- `mobile/src/data/repositories/ListsRepository.ts`
- `mobile/src/presentation/features/lists/MyListsViewModel.ts`
- `mobile/src/presentation/features/lists/MyListsScreen.tsx`
- `mobile/src/presentation/features/lists/ListDetailViewModel.ts`
- `mobile/src/presentation/features/lists/ListDetailScreen.tsx`
- `tests/test_lists.py`
- Existing patterns to follow:
- Clean Architecture con entidades, repositorios y use cases por vertical slice
- Repositorios mobile finos apoyados en contratos HTTP simples
- `useFocusEffect` para refresco de pantallas al recuperar foco
- Constraints:
- La implementacion actual asume owner unico en `lists.user_id`
- El mobile actual decide si una lista es editable por query param, no por permisos del backend
- `list_items` no guarda quien anadio el item
- Los tests actuales de listas fijan que solo el owner puede editar o borrar

## Decisions Locked

- V1 con dos roles: `owner` y `collaborator`
- El `owner` sigue siendo unico y conserva gestion de metadata, colaboradores y borrado de la lista
- Los colaboradores pueden anadir, quitar y reordenar items, pero no borrar la lista ni cambiar colaboradores
- Cada item guarda `added_by_user_id` y el detalle devuelve al menos `id`, `username`, `display_name` y `avatar_url` del autor
- `GET /lists/me` debe devolver tanto listas propias como listas compartidas conmigo
- La UI no debe confiar en `editable=1`; el backend debe devolver permisos efectivos como parte del contrato
- No se implementan invites ni estados pendientes en esta fase; el owner agrega o quita colaboradores directamente sobre usuarios existentes

## Phase Notes

### Phase 1

- Detailed tasks:
- Redefinir casos de uso de listas alrededor de `can_view`, `can_edit_metadata`, `can_manage_collaborators` y `can_edit_items`
- Escribir tests para owner, colaborador y tercero ajeno
- Fijar el comportamiento cuando una lista privada es compartida con otro usuario
- Fijar el comportamiento de `GET /lists/me` para no ocultar listas compartidas
- Findings:
- El contrato actual mezcla ownership y permisos; conviene separar ambos conceptos antes de tocar persistencia
- El punto mas sensible de regresion es `GET /lists/me`, porque hoy el mobile lo usa como "mis listas"
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- Review notes:
- Esta fase debe dejar cerrada la semantica exacta de permiso antes de escribir migraciones
- Status:
- planned

### Phase 2

- Detailed tasks:
- Crear tabla de membresia de colaboradores, por ejemplo `list_collaborators`
- Mantener `lists.user_id` como owner para compatibilidad y simplicidad de v1
- Anadir `added_by_user_id` en `list_items`
- Preparar migracion que no requiera backfill complejo para items historicos
- Findings:
- Mantener `user_id` como owner reduce amplitud del cambio respecto a mover todo a una tabla de miembros con roles
- Para items existentes hara falta una politica explicita de backfill; la opcion recomendada es asignarlos al owner historico
- Tests:
- migracion forward en entorno local + `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- Review notes:
- Conviene revisar indices unicos para evitar colaboradores duplicados por lista
- Status:
- planned

### Phase 3

- Detailed tasks:
- Ampliar entidades de listas con colaboradores, autor por item y permisos efectivos
- Sustituir `exists_owned_by_user` por verificaciones mas expresivas (`can_edit_items`, `can_manage_list`, etc.)
- Ajustar consultas de detalle y listados para traer owner, colaboradores y autorias
- Crear use cases dedicados para agregar y quitar colaboradores
- Findings:
- Hoy `ListRepository` concentra toda la logica y esta muy acoplado a owner unico; esta fase es la bisagra real del cambio
- Conviene que el repositorio componga un DTO de permisos para evitar que el router reconstruya reglas
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- Review notes:
- Si la interfaz del repositorio crece demasiado, puede merecer separar membresias de items para mantener SRP
- Status:
- planned

### Phase 4

- Detailed tasks:
- Anadir schemas para colaborador, autoria de item y permisos
- Exponer endpoints para alta/baja de colaboradores
- Ajustar `GET /lists/{id}` y `GET /lists/me`
- Mantener errores coherentes: `404` para no visible, `403/404` segun politica final cerrada en fase 1
- Findings:
- El contrato de detalle es la fuente de verdad para que mobile deje de inferir permisos desde la ruta
- `GET /users/{username}/lists` probablemente debe seguir mostrando solo listas publicas del owner, no listas donde colabora
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- Review notes:
- Merece revisar si el alta de colaboradores se hace por `user_id` o por `username`; para UX mobile, `username` encaja mejor con la busqueda social existente
- Status:
- planned

### Phase 5

- Detailed tasks:
- Ampliar tipos TS de listas con `collaborators`, `permissions` y `added_by`
- Rehacer `MyListsScreen` para separar al menos `propias` y `compartidas`, o marcar claramente el ownership
- Rehacer `ListDetailViewModel` para usar permisos del backend en vez de `editable`
- Mostrar en cada card de item quien lo anadio
- Permitir al owner agregar y quitar colaboradores desde la propia pantalla
- Findings:
- El query param `editable` hoy es una heuristica fragil; con listas compartidas pasa de incomodo a incorrecto
- La autoria por item tiene valor real solo si queda visible sin entrar en una vista secundaria
- Tests:
- `npx tsc --noEmit`
- Review notes:
- La UX minima viable puede resolver colaboradores con buscador + chips, sin inventar modales complejos
- Status:
- planned

### Phase 6

- Detailed tasks:
- Ejecutar suite de listas y checks amplios backend/mobile
- Revisar diff de migracion y contratos
- Documentar riesgos de concurrencia y casos manuales pendientes
- Findings:
- El mayor riesgo residual no es de modelo sino de condiciones de carrera si dos colaboradores editan a la vez
- La v1 puede aceptar last-write-wins mientras quede documentado
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests -q`
- `npx tsc --noEmit`
- Review notes:
- La QA manual debe cubrir owner y colaborador en dispositivos/sesiones separadas
- Status:
- planned

## Review Findings

- open: el contrato actual de listas no distingue ownership de permisos operativos
- open: `GET /lists/me` y la navegacion mobile asumen que toda lista abierta desde ahi es editable por owner
- open: falta persistencia de autoria por item, asi que hoy no es posible responder quien anadio una obra
- open: la migracion necesita una decision explicita para backfill de items existentes

## Deferred Work

- Sistema de invitaciones aceptadas/rechazadas
- Roles mas finos como `viewer` o `co-owner`
- Auditoria historica de altas, bajas y cambios de orden
- Resolucion avanzada de conflictos o refresco en tiempo real

## Final Confidence Check

- Confidence score:
- 9.3/10
- Likely code review callouts:
- Puede cuestionarse si `owner + collaborator` es suficiente o si conviene modelar roles mas finos desde el principio
- Tambien puede discutirse si el alta de colaboradores debe resolverse por `username` o por `user_id`
- Residual risks:
- Todavia no se ha fijado la politica exacta de respuesta entre `403` y `404` para usuarios sin permiso
- La concurrencia entre colaboradores queda planteada como `last write wins` salvo que decidamos endurecerla mas adelante

## Delivered Implementation Update

- Se amplio el alcance respecto al borrador inicial para incluir invitaciones pendientes con aceptacion/denegacion explicita.
- La regla finalmente implementada es: solo se puede invitar si existe follow mutuo en ese momento; tras aceptar, la colaboracion permanece aunque ese follow se rompa despues.
- Los colaboradores aceptados pueden editar metadata e items, pero no borrar la lista ni gestionar colaboradores.
- `GET /lists/me` se implemento como respuesta compuesta con `owned_lists`, `shared_lists` y `pending_invitations_received`.
- Se anadieron `list_collaborators`, `list_invitations` y `added_by_user_id` en `list_items`; el backfill historico asigna los items existentes al owner de la lista.
- El mobile elimino la dependencia del query param `editable` y ahora decide acciones desde `permissions`.
- Para la UX de invitacion se implemento `GET /lists/{list_id}/invitees/search`, que devuelve solo usuarios con follow mutuo y excluye colaboradores actuales o invitaciones pendientes.

## Delivered Validation

- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests -q`
- `npx tsc --noEmit`

## Delivered Residual Risks

- No se ha ejecutado validacion manual en Expo/dispositivo real para revisar jerarquia visual y tactilidad del nuevo flujo de listas.
- La migracion de Alembic se anadio al repo, pero no se ha validado en esta sesion contra una base PostgreSQL real.
- La concurrencia entre colaboradores mantiene semantica `last write wins`.
- Durante la verificacion en este PC aparecio inestabilidad de Expo Go/AVD que no queda respaldada por los checks del proyecto (`expo-doctor`, export Android y `tsc` pasan); huele mas a problema de entorno local/emulador que a regression funcional del codigo de listas.

# Fase 14 - Perfil social propio y vista de red Details

## Repository Context

- Relevant files:
- `backend/app/domain/entities/social.py`
- `backend/app/domain/repositories/i_user_repository.py`
- `backend/app/data/repositories/user_repository.py`
- `backend/app/domain/usecases/social`
- `backend/app/presentation/schemas/social.py`
- `backend/app/presentation/routers/social.py`
- `mobile/src/domain/entities/social.ts`
- `mobile/src/data/repositories/SocialRepository.ts`
- `mobile/src/presentation/features/profile/ProfileViewModel.ts`
- `mobile/src/presentation/features/profile/ProfileScreen.tsx`
- nueva ruta/screen/view model de red propia
- `tests/test_social.py`
- Existing patterns to follow:
- repositorios HTTP finos en mobile con view models por pantalla
- slice social backend ya separado por entidades, repositorio y use cases
- `useFocusEffect` para refresco al volver a foco
- Constraints:
- el perfil propio hoy usa `getMe` + `getUserStats(username)` y no dispone de lista de red
- `PublicUserSummary` actual no distingue el caso "me sigue pero yo no le sigo"
- la referencia visual pide densidad alta y CTA clara, pero hay que mantener coherencia con el sistema dark existente

## Decisions Locked

- Se anade `follows_me` al contrato de resumen social para evitar inferencias ambiguas en cliente
- La vista de red es una pantalla dedicada de stack, no modal
- La pantalla tiene solo dos tabs: `following` y `followers`
- El CTA de fila sigue esta regla:
- `is_following = true` -> mostrar check y permitir unfollow
- `is_following = false` -> mostrar plus y permitir follow, independientemente de si `follows_me` es `true` o `false`
- `follows_me` se expone igualmente para que la UI pueda distinguir reciprocidad y futuras variaciones sin recalcular nada
- `ProfileScreen` elimina todos los metadatos bajo posters en favoritos y actividad reciente
- Los posters de favoritos y actividad reciente usan el mismo ancho visual y `borderRadius: 0`

## Phase Notes

### Phase 1

- Detailed tasks:
- Actualizar `implementation.md` y `implementation_details.md`
- Revisar el slice social existente en backend y mobile
- Confirmar el hueco real de API para followers/following
- Findings:
- No existian endpoints cliente/backend para listar red propia
- La mejor extension minima del contrato es `follows_me` en `PublicUserSummary`
- Tests:
- por ejecutar en fases posteriores
- Review notes:
- La UI del mock pide una pantalla dedicada; mantenerlo en una sola screen complicaria demasiado `ProfileScreen`
- Status:
- completed

### Phase 2

- Detailed tasks:
- Extender entidades y schemas sociales con `follows_me`
- Anadir metodos de repositorio para `list_followers` y `list_following`
- Crear use cases especificos
- Exponer `GET /users/me/followers` y `GET /users/me/following`
- Cubrir con tests contrato y flags de reciprocidad
- Findings:
- Reutilizar el mismo resumen social evita abrir un DTO paralelo para la vista de red
- Centralizar `is_following` y `follows_me` en el repositorio reduce duplicacion entre busqueda y listas de red
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- Review notes:
- revisar orden estable y exclusion del propio usuario
- Status:
- completed

### Phase 3

- Detailed tasks:
- Ampliar entidades mobile y `SocialRepository`
- Crear `ProfileNetworkViewModel`
- Crear `ProfileNetworkScreen` y ruta stack
- Hacer follow/unfollow optimista por fila sin duplicar logica innecesaria
- Findings:
- La ruta dedicada permite mantener `ProfileScreen` ligera y evita meter tabs/modales extra en la pantalla principal
- La actualizacion optimista necesitaba tocar ambas colecciones (`followers` y `following`) para que las tabs no quedasen inconsistentes
- Tests:
- `npx tsc --noEmit`
- Review notes:
- usar el tab inicial de la ruta para abrir en `Seguidores` o `Siguiendo`
- Status:
- completed

### Phase 4

- Detailed tasks:
- Anadir contadores pulsables a `ProfileScreen`
- Ajustar favoritos y recent activity a posters rectos y mismo tamano
- Eliminar textos inferiores de ambas galerias
- Recargar el perfil al volver desde la pantalla de red aprovechando el refresh por foco existente
- Findings:
- Recargar `getPublicProfile(username)` dentro del perfil propio fue suficiente para reutilizar contadores existentes sin crear endpoint nuevo para `/users/me`
- Mover la accion de quitar favorita a un overlay mantiene la limpieza visual sin perder la capacidad de editar slots
- Tests:
- `npx tsc --noEmit`
- Review notes:
- el riesgo principal es mantener el perfil legible al meter mas stats sin romper la composicion central
- Status:
- completed

### Phase 5

- Detailed tasks:
- Ejecutar tests backend del slice social
- Ejecutar TypeScript en mobile
- Revisar diff con checklist de funcionalidad, completitud, claridad y testing
- Actualizar hallazgos y riesgos reales
- Findings:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q` pasa con 20 tests verdes
- `npx tsc --noEmit` pasa
- Sigue pendiente validacion manual en Expo/dispositivo real
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `npx tsc --noEmit`
- Review notes:
- dejar explicitado si quedo pendiente validacion manual en Expo
- Status:
- completed

## Review Findings

- fixed: el backend ya expone listas de followers/following y devuelve `follows_me`
- fixed: `ProfileScreen` alinea favoritos y recent activity con posters del mismo ancho y sin metadatos inferiores
- fixed: existe una ruta dedicada de red propia con CTA de follow/unfollow por fila
- accepted risk: no se ha validado visualmente en Expo/dispositivo real el feeling final de la pantalla `profile-network`
- accepted risk: la vista de red actual no incluye busqueda, filtros ni paginacion; para la escala actual se asume suficiente

## Deferred Work

- Vista de red equivalente para perfiles publicos
- Busqueda, filtros o paginacion en la pantalla de red
- Ajustes visuales mas amplios del hero de perfil fuera de esta fase

## Final Confidence Check

- Confidence score:
- 8.9/10
- Likely code review callouts:
- Puede salir la conversacion de si `follows_me` debia anadirse al resumen social general o limitarse a los endpoints de red
- Tambien puede pedirse validacion manual del layout de `profile-network` en distintos tamanos de pantalla
- Residual risks:
- No se ha hecho prueba manual en Expo/dispositivo real en esta sesion

# Fase 15 - Tabs internas de Perfil con Watchlist y Diario Details

## Repository Context

- Relevant files:
- `mobile/app/(tabs)/_layout.tsx`
- `mobile/app/(tabs)/diary.tsx`
- nueva ruta placeholder `mobile/app/(tabs)/wip.tsx`
- `mobile/src/presentation/features/profile/ProfileScreen.tsx`
- `mobile/src/presentation/features/profile/ProfileViewModel.ts`
- `mobile/src/presentation/features/profile/MediaStatusListViewModel.ts`
- `mobile/src/presentation/features/profile/WatchLogListViewModel.ts`
- nuevo componente compartido de diario
- nuevo componente/presentacion de watchlist embebida
- Existing patterns to follow:
- tabs principales con `expo-router`
- view models finos con fetch en cliente y navegacion mediante `router.push`
- `ListDetailScreen` como referencia visual para grid denso de posters
- `WatchLogListScreen` como referencia funcional para el diario completo
- Constraints:
- no hay cambios backend previstos
- la estrella central debe ser visible pero no interactiva
- `Diario` deja de ser una tab visible principal y pasa a vivir dentro de `ProfileScreen`
- la watchlist personal no debe heredar affordances de colaboracion

## Decisions Locked

- La estrella central se implementa como placeholder visual dentro de la tab bar con ruta dedicada pero sin accion de navegacion desde el boton
- `ProfileScreen` controla sus tabs internas con estado local, no con subrutas
- La tab `Watchlist` usa el username sin `@` en el titulo y una grid de 4 columnas sin metadatos inferiores
- La tab `Diario` reutiliza un componente compartido para evitar drift con `WatchLogListScreen`
- La CTA de actividad reciente dentro de `Perfil` cambia de navegar a `/(tabs)/diary` a seleccionar la tab interna `Diario`

## Phase Notes

### Phase 1

- Detailed tasks:
- actualizar `implementation.md` y `implementation_details.md`
- quitar `Diario` de la tab bar visible
- anadir placeholder `WIP` central y su ruta vacia
- Findings:
- mantener la ruta `diary` oculta evita una refactorizacion innecesaria de archivos bajo `(tabs)` mientras se retira del shell visible
- una ruta placeholder `wip` permite colocar la estrella en el centro sin introducir comportamiento funcional
- Tests:
- `npx tsc --noEmit`
- Review notes:
- comprobar que Expo Router no vuelva a mostrar `diary` por auto-registro del archivo
- Status:
- completed

### Phase 2

- Detailed tasks:
- montar tabs internas dentro de `ProfileScreen`
- consumir `useMediaStatusListViewModel('watchlist')` de forma embebida
- crear layout de watchlist tipo coleccion personal con 4 columnas y apertura a detalle
- Findings:
- la watchlist personal funciona mejor como presentational component dedicado que como reuse literal de `MediaStatusListScreen`, porque necesita otra jerarquia visual y ningun metadato inferior
- mantener los hooks de watchlist y diario montados en `ProfileScreen` evita recargas al cambiar de tab interna
- Tests:
- `npx tsc --noEmit`
- Review notes:
- evitar que los controles de edicion del perfil interfieran visualmente cuando la tab activa no sea `Perfil`
- Status:
- completed

### Phase 3

- Detailed tasks:
- extraer un componente compartido del diario
- reutilizarlo en `WatchLogListScreen` y en la tab interna de perfil
- eliminar la dependencia de `openDiary` hacia `/(tabs)/diary`
- Findings:
- `WatchLogDiaryContent` permite conservar el mismo comportamiento de secciones, detalle y borrado tanto en la ruta standalone como en la tab de perfil
- la CTA de `Recent activity` pasa a seleccionar la tab interna `Diario`, evitando una navegacion que ya no existe en la tab bar
- Tests:
- `npx tsc --noEmit`
- Review notes:
- mantener borrado y apertura de detalle exactamente igual que antes
- Status:
- completed

### Phase 4

- Detailed tasks:
- revisar espaciados, estados vacios y affordances de tab
- ejecutar TypeScript
- actualizar hallazgos finales y riesgos residuales
- Findings:
- `npx tsc --noEmit` pasa
- no fue necesario tocar contratos backend ni repositorios HTTP
- Tests:
- `npx tsc --noEmit`
- Review notes:
- documentar si queda pendiente validacion manual en Expo
- Status:
- completed

## Review Findings

- fixed: `Diario` deja de aparecer en la tab bar principal y la estrella `WIP` ocupa el slot central sin navegacion
- fixed: `ProfileScreen` ya contiene tabs superiores `Perfil`, `Watchlist` y `Diario`
- fixed: la watchlist personal se presenta sin `@username`, sin colaboradores y con grid de 4 columnas
- fixed: el diario interno reutiliza la misma UI y comportamiento que la pantalla standalone existente
- accepted risk: la ruta `mobile/app/(tabs)/diary.tsx` sigue existiendo pero queda oculta del shell visible para minimizar el cambio estructural
- accepted risk: falta validacion manual en Expo/dispositivo real para confirmar el tacto del top-tab switcher y el balance visual de la estrella `WIP`

## Deferred Work

- decidir si la ruta oculta `diary` debe eliminarse del todo en una limpieza posterior
- dar funcionalidad real a la estrella central cuando exista producto para ello
- tests automatizados de UI mobile para tabs internas del perfil

## Final Confidence Check

- Confidence score:
- 9.2/10
- Likely code review callouts:
- puede discutirse si conviene eliminar por completo la ruta `(tabs)/diary` en vez de dejarla oculta
- puede pedirse una validacion visual manual del balance entre hero de perfil y top tabs en distintos tamanos de pantalla
- Residual risks:
- no se ha hecho prueba manual en Expo/dispositivo real en esta sesion

# Fase 16 - Sugerencia random desde la estrella de tab bar Details

## Repository Context

- Relevant files:
- `mobile/app/(tabs)/_layout.tsx`
- `mobile/app/(tabs)/wip.tsx`
- `mobile/src/data/repositories/MediaRepository.ts`
- nuevo view model/componente para random pick de watchlist
- Existing patterns to follow:
- `expo-router` tabs con botones custom
- view models mobile con manejo de `loading`, `error` y redirects por `unauthorized`
- `darkDesign` y modales similares a los usados en detail/profile
- Constraints:
- la estrella no debe navegar de tab
- no hay endpoint dedicado para "random watchlist", asi que hay que componer `getMyMediaStatuses` + `getMediaDetail`
- el flujo debe soportar watchlist vacia sin romper la tab bar

## Decisions Locked

- La sugerencia random se resuelve en cliente usando `watchlist[Math.floor(Math.random() * n)]`
- El shell de tabs solo dispara la apertura; la logica de carga vive en un view model/componente dedicado
- El modal muestra poster, titulo, overview y `vote_average` como nota media
- Se anade una accion de "Otra random" para reroll dentro del modal

## Phase Notes

### Phase 1

- Detailed tasks:
- documentar la nueva fase
- crear view model/componente dedicado para random pick
- reutilizar `getMyMediaStatuses` y `getMediaDetail`
- Findings:
- encapsular el flujo en un componente/view model dedicado mantiene `TabsLayout` limpio y deja el comportamiento listo para futuras iteraciones
- no hizo falta tocar backend: componer `getMyMediaStatuses` con `getMediaDetail` cubre el caso
- Tests:
- `npx tsc --noEmit`
- Review notes:
- asegurar que los errores y el estado vacio no queden mezclados en `TabsLayout`
- Status:
- completed

### Phase 2

- Detailed tasks:
- sustituir el placeholder `WIP` por un boton activo
- abrir modal centrado desde la estrella
- renderizar loading, empty, error e item sugerido
- Findings:
- la estrella ya no navega y funciona como trigger puro del modal
- se priorizan peliculas de la watchlist y solo se usan series como fallback cuando no hay peliculas disponibles
- anadir `Otra random` dentro del modal evita tener que cerrarlo y volver a pulsar la estrella
- Tests:
- `npx tsc --noEmit`
- Review notes:
- comprobar que el boton no navega ni altera la tab activa
- Status:
- completed

### Phase 3

- Detailed tasks:
- ejecutar TypeScript
- actualizar hallazgos y riesgos reales
- Findings:
- `npx tsc --noEmit` pasa
- no aparecieron cambios de contrato ni conflictos con la navegacion de tabs existente
- Tests:
- `npx tsc --noEmit`
- Review notes:
- dejar explicitado si sigue pendiente validacion manual
- Status:
- completed

## Review Findings

- fixed: la estrella central ya no es placeholder y abre un modal de sugerencia random
- fixed: el modal muestra poster, titulo, descripcion y nota media del titulo elegido
- fixed: el flujo maneja watchlist vacia, error de carga y reroll sin navegar
- accepted risk: el pick se calcula enteramente en cliente y puede repetir titulos entre intentos consecutivos
- accepted risk: falta validacion manual en Expo/dispositivo real para afinar scroll y altura del modal con descripciones largas

## Deferred Work

- evitar repeticiones inmediatas entre rerolls consecutivos si producto lo pide
- abrir una experiencia mas rica desde `Ver ficha completa` o permitir marcar como vista directamente desde el modal
- tests automatizados de UI para el flujo de la estrella random

## Final Confidence Check

- Confidence score:
- 9.4/10
- Likely code review callouts:
- puede salir la conversacion de si la sugerencia random deberia excluir repeticiones recientes
- tambien pueden pedir una decision mas explicita sobre si el feature debe ser solo peliculas o peliculas+series
- Residual risks:
- no se ha hecho prueba manual en Expo/dispositivo real en esta sesion

# Fase 17 - Random Pick con filtro de fuente Details

## Repository Context

- Relevant files:
- `mobile/src/presentation/features/profile/RandomWatchlistPickModal.tsx`
- `mobile/src/presentation/features/profile/randomPickSources.ts`
- `mobile/src/data/repositories/ListsRepository.ts`
- `mobile/src/data/repositories/SocialRepository.ts`
- Existing patterns to follow:
- modales fullscreen de seleccion ya usados en listas
- resolucion mobile con `loading`, `error`, `unauthorized` y `requestIdRef`
- `darkDesign` y `sharedStyles` para mantener el look del resto de la app
- Constraints:
- sin cambios backend
- la otra persona se elige solo entre `following`
- la fuente invalida debe caer a `Mi watchlist`

## Decisions Locked

- La configuracion de fuente se modela con tipos discriminados:
- `watchlist:mine`
- `list:owned-or-shared`
- `watchlist:paired`
- La composicion de candidatos se extrae a `randomPickSources.ts`
- Las listas se obtienen desde `getMyLists()` y los items desde `getListDetail(listId)`
- La watchlist conjunta mezcla ambas watchlists y luego prioriza peliculas sobre series
- No se deduplican items repetidos entre pools en esta version

## Phase Notes

### Phase 1

- Detailed tasks:
- crear helper con tipos, resolucion de fuente y pick random reutilizable
- sacar de JSX la logica de `watchlist`/`fallback`/`paired watchlist`
- Findings:
- separar la resolucion de fuente reduce mucho la complejidad ciclomativa del modal
- el helper centraliza tanto el fallback a `Mi watchlist` como los copies de empty state por fuente
- Tests:
- `npx tsc --noEmit`
- Review notes:
- mantener ASCII en los textos del helper para evitar problemas de encoding
- Status:
- completed

### Phase 2

- Detailed tasks:
- anadir boton de filtro en cabecera del modal
- montar modal fullscreen secundario para elegir entre watchlist propia, listas y usuarios seguidos
- conectar `getMyLists`, `getListDetail`, `getMyFollowing` y `getUserWatchlist`
- Findings:
- el selector secundario evita recargar el modal principal con demasiada UI
- reutilizar `getMyFollowing` cumple la restriccion de no meter busqueda global de usuario
- al recargar opciones cada vez que se abre el filtro reducimos riesgo de datos stale en listas/seguidos
- Tests:
- `npx tsc --noEmit`
- Review notes:
- comprobar manualmente si conviene cachear opciones si el coste percibido es alto
- Status:
- completed

### Phase 3

- Detailed tasks:
- revisar diff, copys, fallbacks y estados vacios
- ejecutar TypeScript y actualizar documentacion final
- Findings:
- `npx tsc --noEmit` pasa
- el reroll conserva la fuente activa porque la carga se rehace con el `source` actual
- el flujo comunica en UI cuando una lista o un usuario seguido dejan de ser validos y cae a `Tu watchlist`
- Tests:
- `npx tsc --noEmit`
- Review notes:
- queda pendiente la validacion manual en Expo para el alto del modal y la sensacion del selector de fuente
- Status:
- completed

## Review Findings

- fixed: el modal random ya no depende solo de `watchlist` propia
- fixed: se puede elegir una lista propia o compartida como fuente alternativa
- fixed: se puede mezclar la watchlist propia con la de alguien seguido
- fixed: las fuentes invalidas vuelven a `Tu watchlist` con aviso visible
- accepted risk: el filtro se mantiene solo en memoria del modal y no persiste entre reinicios de app
- accepted risk: no hay deduplicacion entre watchlists combinadas y puede repetirse un titulo si ambas listas lo contienen
- accepted risk: no se ha hecho prueba manual en Expo/dispositivo real en esta sesion

## Deferred Work

- decidir si interesa persistir la ultima fuente random elegida entre aperturas o sesiones
- valorar deduplicacion entre watchlists combinadas si producto detecta picks repetidos
- cubrir el flujo con tests UI o tests unitarios cuando el repo incorpore runner frontend

## Final Confidence Check

- Confidence score:
- 9.1/10
- Likely code review callouts:
- puede pedirse cachear `getMyLists()` y `getMyFollowing()` mientras el modal siga montado
- puede salir la duda de si la lista combinada deberia deduplicar titulos repetidos
- Residual risks:
- no se ha validado manualmente la experiencia en dispositivo real en esta sesion

# Fase 18 - Hardening de sesion y social Details

## Repository Context

- Relevant files:
- `backend/app/data/repositories/user_repository.py`
- `tests/test_social.py`
- `mobile/src/infrastructure/auth/AuthSessionManager.ts`
- `mobile/src/infrastructure/http/api.ts`
- `mobile/src/infrastructure/http/apiErrors.ts`
- `mobile/src/data/repositories/AuthRepository.ts`
- `mobile/src/presentation/features/social/UserSearchViewModel.ts`
- `mobile/src/presentation/features/social/PublicProfileViewModel.ts`
- `mobile/src/presentation/features/profile/ProfileViewModel.ts`
- `mobile/src/presentation/features/profile/ProfileNetworkViewModel.ts`
- `mobile/src/presentation/features/social/SocialViewModel.ts`
- Existing patterns to follow:
- manejo de `401` con redirect a `/login`
- view models con `loading`, errores por seccion y `useFocusEffect`
- skill `phased-dev-review` para dejar trazabilidad de fases, validacion y riesgos
- Constraints:
- no romper el contrato actual de `/auth/refresh`
- convivir con worktree sucio sin revertir cambios previos del usuario
- sin runner frontend dedicado en el repo

## Decisions Locked

- `AuthSessionManager` solo limpia sesion al faltar refresh token o al recibir `401` real del refresh
- el interceptor devuelve el error del refresh y no el `401` original cuando el refresh falla por red, para no disparar logout falso
- `hasValidSession()` trata errores de red como sesion recuperable y no como logout
- backend y mobile aplican ambos la exclusion del usuario propio en busqueda social
- las pantallas ya cargadas mantienen datos previos si una recarga parcial falla
- los fallbacks de copy pasan a ser neutros y orientados a reintento

## Phase Notes

### Phase 1

- Detailed tasks:
- excluir `UserModel.id == current_user_id` en `search_public()`
- anadir test de contrato para `/users/search`
- endurecer refresh session, restore session e interceptor axios
- Findings:
- el bug principal de logout no estaba en `SecureStore`, sino en que el interceptor reenviaba un `401` original aunque el refresh hubiera fallado por timeout o red
- la busqueda backend no reutilizaba la exclusion ya presente en followers/following
- Tests:
- `backend\.venv\Scripts\python.exe -m pytest tests/test_social.py -q`
- `backend\.venv\Scripts\python.exe -m pytest tests/test_refresh_logout.py -q`
- `backend\.venv\Scripts\python.exe -m pytest tests/test_login.py -q`
- Review notes:
- el arranque con solo refresh token y sin access token sigue dependiendo de poder refrescar; es un caso menos comun porque ambos tokens se guardan juntos
- Status:
- completed

### Phase 2

- Detailed tasks:
- cachear el usuario actual en `AuthRepository` para reutilizar identidad en social/profile
- filtrar el propio usuario en `UserSearchViewModel`
- redirigir al perfil propio si se intenta abrir el perfil publico propio
- conservar datos previos en `ProfileViewModel`, `PublicProfileViewModel`, `ProfileNetworkViewModel` y `SocialViewModel`
- cambiar `ProfileScreen` y `PublicProfileScreen` para bloquear solo en primera carga, no ante errores posteriores
- Findings:
- `ProfileScreen` y `PublicProfileScreen` estaban usando `error || !user/profile` como condicion global, lo que convertia un error puntual en pantalla vacia
- mantener datos previos exige no resetear colecciones en `catch`, incluso aunque siga habiendo copy de error
- Tests:
- `npx tsc --noEmit`
- Review notes:
- el CTA de follow propio queda doblemente blindado: redireccion por VM y boton deshabilitado si llegara a renderizarse un instante
- Status:
- completed

## Review Findings

- fixed: la sesion ya no se borra por fallos transitorios durante refresh
- fixed: la busqueda social ya no devuelve al usuario autenticado
- fixed: mobile evita navegar al perfil publico propio aunque el backend volviera a romper ese contrato
- fixed: perfil propio, perfil publico y feed social conservan datos previos ante fallos parciales de recarga
- fixed: el fallback de errores ya no afirma que el backend este caido cuando no hay evidencia de ello
- accepted risk: no hay tests automatizados frontend para simular timeouts o foco/reentrada de pantallas
- accepted risk: queda pendiente validacion manual en Expo/dispositivo real para confirmar la sensacion exacta del flujo con backend intermitente

## Deferred Work

- incorporar tests frontend o e2e para refresh fallido por red y recargas parciales por foco
- evaluar un store global de identidad/autenticacion si el slice social sigue creciendo
- revisar si interesa mostrar CTA explicito de reintento en mas secciones, no solo copy de error

## Final Confidence Check

- Confidence score:
- 8.8/10
- Likely code review callouts:
- puede salir la conversacion de si `getCurrentUser()` merece una capa global mas formal que una cache de modulo
- tambien pueden pedir una estrategia mas uniforme de `retry` visible entre todas las secciones de perfil/social
- Residual risks:
- no se ha validado manualmente en Expo/dispositivo real el caso de access token expirado con backend intermitente en esta sesion
# Fase 20 - Social: spoilers, reseñas de amigos y privacidad de listas Details

## Repository Context

- Relevant files:
- `backend/app/domain/entities/social.py`
- `backend/app/domain/usecases/social/list_visual_feed.py`
- `backend/app/presentation/schemas/social.py`
- `backend/app/presentation/routers/social.py`
- `mobile/src/domain/entities/social.ts`
- `mobile/src/presentation/features/social/SocialScreen.tsx`
- `mobile/src/presentation/features/detail/DetailViewModel.ts`
- `mobile/src/presentation/features/detail/DetailScreen.tsx`
- `tests/test_social.py`
- `tests/test_lists.py`
- Existing patterns to follow:
- enrichment de feed social en backend y repositorios HTTP finos en mobile
- revelación de spoilers ya existente dentro de la ficha de detalle
- filtros de visibilidad de listas ya presentes en creación y lectura del feed
- Constraints:
- sin endpoint nuevo de backend para `friend reviews`
- el truncado de previews debe seguir saliendo del backend
- sin runner frontend dedicado en el repo

## Decisions Locked

- `Reseñas de amigos` significa reseñas de usuarios seguidos por el usuario actual
- el preview de reseña en Social se sigue truncando a 160 caracteres en backend
- si una reseña tiene spoilers, Social muestra solo un aviso y dirige a la ficha para revelarla allí
- la ficha reutiliza el listado de reseñas existente y clasifica localmente con `getMyFollowing()`
- la reseña propia no debe duplicarse dentro de `Comunidad`

## Phase Notes

### Phase 1

- Detailed tasks:
- ampliar `VisualFeedParticipant` con `review_id`, `review_body_preview` y `review_contains_spoilers`
- rellenar esos campos desde `ListVisualFeedUseCase`
- exponerlos en schema/router social
- cubrir con tests el preview truncado + spoiler flag y la ocultación de `list_created` al privatizar la lista
- Findings:
- el backend ya reutiliza `ReviewActivity.body_preview`, así que no hace falta una segunda regla de truncado
- la privacidad de listas ya estaba parcialmente blindada: faltaba fijar la regresión de pública -> privada con test
- Status:
- completed

### Phase 2

- Detailed tasks:
- actualizar tipos mobile para participantes del feed visual
- mostrar texto de reseña o aviso de spoiler debajo de cada persona en Social
- navegar a detalle al pulsar preview/aviso
- pedir `getMyFollowing()` en la ficha y separar `friendReviews` vs `communityReviews`
- Findings:
- conviene conservar la navegación al perfil desde el nombre de la persona y reservar el tap del preview para abrir la obra
- la ficha actual duplicaba implícitamente la reseña propia dentro de comunidad; el nuevo filtrado la corrige
- Status:
- completed

## Review Findings

- fixed: el feed visual ya entrega preview truncado y flag de spoiler por participante de reseña
- fixed: Social ya oculta el texto de spoilers y deriva a la ficha para revelarlos allí
- fixed: la ficha separa reseñas de amigos y comunidad sin duplicar la reseña propia
- fixed: el feed deja de mostrar la actividad `list_created` cuando una lista pública pasa a privada

## Validation

- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- `npm exec tsc -- --noEmit`
# Fase 21 - Validacion tecnica de Expo Notifications Details

## Repository Context

- Relevant files:
- `mobile/app.json`
- `mobile/eas.json`
- `mobile/app/_layout.tsx`
- `mobile/app/notifications-lab.tsx`
- `mobile/src/infrastructure/notifications/expoNotifications.ts`
- `mobile/src/presentation/features/notifications/NotificationsRuntime.tsx`
- `mobile/src/presentation/features/notifications/NotificationsLabScreen.tsx`
- `mobile/src/presentation/features/profile/ProfileScreen.tsx`
- `mobile/EXPO_NOTIFICATIONS_TESTING.md`
- Existing patterns to follow:
- Expo Router con `Stack` global y rutas puente finas en `mobile/app`
- servicios de infraestructura en `src/infrastructure/*`
- view/screens encapsulados por feature y acceso tecnico desde Perfil mientras no exista un caso de uso de negocio
- Constraints:
- no acoplar todavia almacenamiento de token a backend
- no usar Expo Go como criterio de validacion para push remota
- la push remota real sigue requiriendo dispositivos fisicos Android e iPhone

## Decisions Locked

- Se usa Expo Push Service y no FCM directo
- La build objetivo para pruebas es `development` con `expo-dev-client`
- El registro del `ExpoPushToken` es manual desde una pantalla tecnica para evitar prompts inesperados al abrir la app
- La navegacion al tocar una notificacion se resuelve por `data.url` o `data.pathname`
- La primera prueba remota se hace con la herramienta oficial de Expo, no con backend propio
- Se asume `ios.bundleIdentifier = com.juanexpensive.plotea` para alinear iOS con el package Android ya existente

## Review Findings

- fixed: el runtime de notificaciones queda centralizado en un provider con listeners globales y estado observable
- fixed: el laboratorio push permite validar permisos, token, notificacion local y tap sin acoplar la feature a un flujo de negocio real
- fixed: EAS ya tiene un perfil `development` explicito para salir de Expo Go y probar con development build
- fixed: el repo documenta la secuencia para build y validacion manual con la herramienta oficial de Expo
- accepted risk: la entrega remota real depende de credenciales push configuradas correctamente en EAS/Apple/FCM y no puede validarse solo con typecheck
- accepted risk: el `ExpoPushToken` no se persiste todavia en backend porque el caso de uso final aun no esta decidido

## Validation

- `npm exec tsc -- --noEmit`
