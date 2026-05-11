# Fase 6 - Social: usuarios, follows y feed Details

## Repository Context

- Relevant files:
- `backend/app/data/models/user.py`
- `backend/app/data/repositories/user_repository.py`
- `backend/app/domain/entities/user.py`
- `backend/app/domain/repositories/i_user_repository.py`
- `backend/app/domain/usecases/auth/register.py`
- `backend/app/domain/usecases/reviews/create_review.py`
- `backend/app/domain/usecases/watchlog/create_watch_log.py`
- `backend/app/presentation/routers/auth.py`
- `backend/app/presentation/routers/reviews.py`
- `backend/app/presentation/routers/watch_log.py`
- `backend/app/presentation/schemas/auth.py`
- `backend/app/main.py`
- `backend/alembic/versions`
- `mobile/src/domain/entities/auth.ts`
- `mobile/src/domain/entities/media.ts`
- `mobile/src/data/repositories/AuthRepository.ts`
- `mobile/src/presentation/features/profile/ProfileScreen.tsx`
- `mobile/src/presentation/features/profile/ProfileViewModel.ts`
- `mobile/src/presentation/features/home/HomeScreen.tsx`
- `mobile/src/presentation/features/home/HomeViewModel.ts`
- Existing patterns to follow:
- Clean Architecture con entidades, interfaces, repositorios concretos y use cases por vertical slice
- Routers FastAPI finos que delegan reglas de negocio a casos de uso
- Tests HTTP async con `AsyncClient` y helpers de login reutilizables
- Repositorios mobile HTTP simples con mapeo explicito hacia entidades de dominio
- Constraints:
- El feed social debe ser privado al usuario autenticado y contener solo actividad de usuarios seguidos
- La paginacion del feed debe ser por cursor estable, nunca por offset
- El perfil publico no puede exponer `email` ni otros datos internos
- La generacion de actividades debe centralizarse fuera de routers para evitar drift entre endpoints
- `list_created` se soporta en backend aunque su emision real pueda quedar diferida hasta la fase 7

## Decisions Locked

- `GET /users/search` requiere autenticacion y devuelve resultados ligeros para UI de descubrimiento
- `GET /users/{username}` expone un perfil publico con identidad visible, bio/avatar si existen y estado de follow respecto al usuario actual
- `POST /users/{id}/follow` y `DELETE /users/{id}/follow` son idempotentes desde el punto de vista del cliente; los duplicados no crean relaciones extra
- `GET /feed` devuelve items ordenados por `created_at DESC` con desempate estable por `id DESC`
- El cursor del feed sera opaco y derivado de `(created_at, id)` para evitar duplicados entre paginas
- Las actividades de `review`, `watch_log` y `follow` se crean desde casos de uso o un servicio de dominio/aplicacion reutilizable
- `list_created` queda modelado en el enum/tipo de actividad aunque la emision efectiva se active en la fase 7
- El perfil publico no reutiliza directamente `UserPublic` si el contrato actual sigue incluyendo `email`

## Phase Notes

### Phase 1

- Detailed tasks:
- Actualizar docs de implementacion para la fase 6
- Crear tests del contrato social antes de tocar persistencia
- Cubrir busqueda por username, perfil publico, follow/unfollow, self-follow prohibido y feed paginado por cursor
- Cubrir generacion de actividades al crear resena y watch log
- Findings:
- El repositorio de usuario actual solo cubre `get_by_*` y `create`; necesitara ampliarse para busqueda y lectura publica
- `tests/test_reviews.py` ya contiene helpers utiles; decidir si extraer `tests/test_social.py` para reducir acoplamiento
- Tests:
- `pytest tests/test_social.py`
- Review notes:
- Confirmar si follow duplicado responde `200/204` idempotente o `409`; recomendacion: `200/204` para simplificar mobile
- Status:
- pending

### Phase 2

- Detailed tasks:
- Crear modelos `follows` y `activities` con migraciones y constraints
- Introducir entidades de dominio para follow, activity y cursor de feed si aporta claridad
- Extender interfaces/repositorios para busqueda de usuarios, lectura de perfil publico, follow graph y feed
- Crear casos de uso para search users, get public profile, follow user, unfollow user y list feed
- Crear servicio de publicacion de actividad para desacoplar `create_review` y `create_watch_log` de la persistencia concreta del feed
- Findings:
- `create_review` y `create_watch_log` son los primeros puntos reales de emision de actividad
- Hay riesgo de duplicar logica si follow y emision de actividad se hacen desde routers; debe evitarse
- Tests:
- `pytest tests/test_social.py`
- Review notes:
- Verificar comportamiento de unicidad compuesta y self-reference en SQLite de tests y en la BD real
- Status:
- pending

### Phase 3

- Detailed tasks:
- Crear schemas de presentacion para resultados de busqueda, perfil publico, follow state, feed item y pagina con cursor
- Anadir router `users` y posiblemente router `feed` o endpoint agrupado segun el estilo actual del proyecto
- Registrar nuevos routers en `backend/app/main.py`
- Mapear entidades a respuestas sin filtrar accidentalmente campos privados
- Findings:
- El tipo `UserPublic` actual incluye `email`, lo que entra en conflicto con la puerta de revision del roadmap
- El contrato del feed debe ser suficientemente generico para soportar `list_created` mas adelante sin redisenar el endpoint
- Tests:
- `pytest tests/test_social.py`
- Review notes:
- Revisar con lupa la forma del cursor y la estabilidad del orden cuando varios items comparten timestamp
- Status:
- pending

### Phase 4

- Detailed tasks:
- Crear entidades mobile para public profile, user search result, follow state y feed item
- Anadir repositorio HTTP social y wiring de autenticacion
- Implementar pantalla o seccion de feed social y flujo de busqueda de usuarios
- Implementar perfil publico con CTA de seguir/dejar de seguir
- Resolver actualizacion optimista o refetch minimal para follow/unfollow y paginacion del feed
- Findings:
- `ProfileScreen` actual es solo para el usuario autenticado; conviene no forzarlo a cubrir tambien perfil publico si eso complica estados
- `HomeScreen` ya consume un feed de descubrimiento de media; hay que decidir si el feed social vive ahi o en una surface separada para no mezclar conceptos
- Tests:
- `npx tsc --noEmit`
- Review notes:
- Evitar estados globales nuevos si el slice puede resolverse con view models locales y repositorios existentes
- Status:
- pending

### Phase 5

- Detailed tasks:
- Ejecutar checks completos
- Revisar diff con enfoque en privacidad, paginacion y side effects de actividad
- Registrar findings, accepted risks y trabajo diferido
- Findings:
- Haran falta pruebas manuales de navegacion mobile para validar empty states, cursores y transiciones de follow
- Tests:
- `pytest tests/test_social.py`
- `pytest tests/`
- `npx tsc --noEmit`
- Review notes:
- Confirmar si la ausencia de una prueba visual/manual en Expo queda como riesgo aceptado o requiere cierre previo
- Status:
- pending

## Review Findings

- open: `backend/app/domain/entities/user.py` define `UserPublic` con `email`; si se reutiliza tal cual, el perfil publico filtrara datos privados
- open: el proyecto aun no tiene infraestructura de feed o cursor reusable; conviene fijar una forma simple y estable antes de implementar mobile
- open: `create_review` y `create_watch_log` necesitaran un punto comun para publicar actividad sin acoplar los routers

## Deferred Work

- Recomendaciones de cuentas
- Notificaciones por follow o actividad nueva
- Reacciones/comentarios sobre items del feed
- Exposicion UI de `list_created` antes de la fase 7
- Privacidad avanzada de perfil o feed

## Final Confidence Check

- Confidence score:
- 8/10
- Likely code review callouts:
- Si no se redefine el contrato publico de usuario, se podria exponer `email` por accidente
- Si el cursor se basa solo en timestamp, apareceran duplicados o saltos entre paginas
- Si la emision de actividades se reparte entre varios use cases sin abstraccion comun, crecera el coste de mantenimiento al entrar listas/notificaciones
- Residual risks:
- Aun falta decidir la superficie mobile exacta del feed social frente al feed de descubrimiento actual
- La validacion de UX real en Expo seguira siendo necesaria aunque `npx tsc --noEmit` pase
