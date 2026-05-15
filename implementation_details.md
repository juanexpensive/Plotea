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
