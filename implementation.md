# Fase 8 - Perfil, estadisticas y edicion de usuario

## Objetivo

- Convertir el perfil en una vista util de identidad y actividad con edicion del perfil propio, estadisticas publicas calculadas desde `watch_log` y consumo real en mobile para perfil propio y publico.

## Alcance

- En alcance:
- `PUT /users/me` para editar `display_name`, `bio` y `avatar_url`
- `GET /users/{username}/stats` con `watched_count`, `estimated_hours`, `top_genres` y `average_rating`
- Ampliacion de `GET /auth/me` para devolver `bio` y `avatar_url`
- Agregacion de stats desde `watch_log` con enriquecimiento TMDB best effort
- Mobile: modo simple de edicion en perfil propio
- Mobile: bloque de stats detalladas en perfil propio y publico
- Render de avatar remoto cuando `avatar_url` exista
- Fuera de alcance:
- Subida de binarios de avatar
- Cache persistente de metadata TMDB
- Cambios de username o email
- Recalculo offline o jobs en background para stats

## Fases

### Fase 1: Contratos y tests backend de perfil/stats

- Goal: fijar con tests el contrato de `PUT /users/me`, `GET /users/{username}/stats` y `GET /auth/me`
- Expected files or systems: `tests/test_social.py`, `tests/test_login.py`
- Validation: tests cubren trimming, URLs inseguras, perfil vacio, usuario inexistente y calculo de stats con degradacion controlada
- Review gate: el shape de los endpoints y la semantica exacta de las stats quedan cerrados antes de tocar produccion
- Estado: completada

### Fase 2: Dominio y persistencia backend

- Goal: encapsular actualizacion de perfil y agregacion de stats respetando Clean Architecture
- Expected files or systems: `IUserRepository`, `UserRepository`, entidades sociales, servicio `UserStatsAggregator`, use cases de `social`
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- Review gate: routers siguen finos y la dependencia de TMDB queda detras de un servicio reutilizable
- Estado: completada

### Fase 3: Endpoints y schemas backend

- Goal: exponer los nuevos contratos HTTP sin romper el perfil publico existente
- Expected files or systems: `backend/app/presentation/schemas/auth.py`, `backend/app/presentation/schemas/social.py`, `backend/app/presentation/routers/auth.py`, `backend/app/presentation/routers/social.py`
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_login.py -q`, `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- Review gate: `GET /users/{username}` mantiene su contrato y las stats viven en endpoint separado
- Estado: completada

### Fase 4: Mobile perfil propio

- Goal: permitir edicion simple del perfil propio y mostrar stats sin romper listas, diario ni logout
- Expected files or systems: entidades auth/social, `SocialRepository`, `ProfileViewModel`, `ProfileScreen`
- Validation: `npx tsc --noEmit`
- Review gate: guardar perfil es seguro, el no-op no borra datos y los errores de stats no bloquean la pantalla completa
- Estado: completada

### Fase 5: Mobile perfil publico y stats

- Goal: enriquecer el perfil publico con avatar remoto y stats detalladas manteniendo follow y listas
- Expected files or systems: `PublicProfileViewModel`, `PublicProfileScreen`, componente compartido `UserStatsSection`
- Validation: `npx tsc --noEmit`
- Review gate: el perfil publico sigue siendo de solo lectura salvo follow y el fallo de stats se aísla del resto
- Estado: completada

### Fase 6: QA, self-review y riesgos

- Goal: ejecutar checks finales, revisar diff y dejar riesgos residuales documentados
- Expected files or systems: docs de implementacion, backend y mobile
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_login.py -q`, `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`, `backend\.venv\Scripts\python.exe -m pytest ..\tests -q`, `npx tsc --noEmit`
- Review gate: quedan explicitados los limites actuales de TMDB y la falta de validacion manual en Expo
- Estado: completada

## Cierre

- Backend con edicion de perfil propio, `auth/me` ampliado y stats publicas desde `watch_log`
- Mobile con edicion inline del perfil propio, avatar remoto y bloque compartido de stats en perfil propio/publico
- Validaciones ejecutadas:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_login.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `npx tsc --noEmit`
- Riesgo residual aceptado: las stats dependen de enriquecimiento TMDB best effort y no se ha hecho validacion manual en Expo en esta sesion

# Fase 9 - Confirmacion de contrasena y refresco del perfil

## Objetivo

- Mejorar dos puntos de UX mobile: pedir confirmacion de contrasena al registrarse y refrescar el perfil propio cada vez que la vista recupera foco para reflejar actividad reciente.

## Alcance

- En alcance:
- Mobile: segundo campo de contrasena en registro
- Validacion cliente para bloquear el alta si las contrasenas no coinciden
- Refactor de `ProfileViewModel` para recarga por foco usando `useFocusEffect`
- Recarga de `getMe`, listas, estados, diario y stats al volver a perfil
- Rehidratacion de drafts desde servidor cuando no hay edicion activa
- Fuera de alcance:
- Cambios en `POST /auth/register`
- Validacion de fortaleza de contrasena
- Cambios en perfil publico
- Nuevos tests E2E o infraestructura de testing frontend

# Fase 10 - Edicion inline del perfil y subida real de avatar

## Objetivo

- Sustituir el logout accidental del boton de tres puntos por un menu de acciones y mover la edicion del perfil propio a un flujo inline con cambio real de avatar desde galeria.

## Alcance

- En alcance:
- Mobile: menu contextual en perfil propio con accion de cerrar sesion
- Mobile: eliminacion del editor grande de perfil
- Mobile: edicion inline de `display_name` y `bio`
- Mobile: seleccion de imagen desde galeria con `expo-image-picker`
- Backend: `POST /users/me/avatar` con `multipart/form-data`
- Backend: almacenamiento local del avatar en `/static/uploads/avatars`
- Tests backend para subida valida, fichero invalido y limite de tamano
- Fuera de alcance:
- Camara nativa
- Storage externo tipo S3 o Supabase
- Edicion de email o username
- Suite E2E mobile

## Fases

### Fase 1: UX del perfil propio

- Goal: eliminar el editor modalizado y dejar nombre, bio y acciones de sesion en interacciones directas
- Expected files or systems: `ProfileScreen`, `ProfileViewModel`
- Validation: `npm exec tsc -- --noEmit`
- Review gate: el menu de tres puntos ya no hace logout inmediato y la pantalla mantiene el resto del comportamiento
- Estado: completada

### Fase 2: Subida backend de avatar

- Goal: aceptar una imagen de perfil real y publicarla en una URL servida por FastAPI
- Expected files or systems: `backend/app/main.py`, `backend/app/presentation/routers/social.py`, `backend/app/infrastructure/storage_paths.py`, `tests/test_social.py`
- Validation: `backend\\.venv\\Scripts\\python.exe -m pytest tests/test_social.py`
- Review gate: el endpoint persiste la URL, expone el archivo y rechaza entradas invalidas
- Estado: completada

### Fase 3: Integracion mobile con galeria

- Goal: conectar el tap en avatar con la seleccion de imagen y refrescar el perfil propio tras la subida
- Expected files or systems: `mobile/package.json`, `SocialRepository`, `ProfileViewModel`, `ProfileScreen`
- Validation: `npm exec tsc -- --noEmit`
- Review gate: cancelar el picker o negar permisos no rompe la pantalla y la nueva foto se refleja al guardar
- Estado: completada

# Fase 11 - Perfil publico con favoritas, actividad, watchlist y diario

## Objetivo

- Igualar el perfil publico al perfil propio en estructura y capacidades de lectura, manteniendo como unica diferencia la ausencia de edicion y la presencia del boton de follow.

## Alcance

- En alcance:
- Backend: endpoints publicos para favoritas, watchlist, diario y actividad reciente por `username`
- Mobile: perfil publico con tabs `Perfil`, `Watchlist` y `Diario`
- Mobile: bloque de 4 favoritas y actividad reciente en la pestana principal
- Reutilizacion de componentes de watchlist y diario en modo solo lectura
- Mobile: boton visible `Seguir` / `Siguiendo`
- Fuera de alcance:
- Edicion de datos en perfil publico
- Permisos de privacidad por seccion
- Nuevos endpoints para listas publicas dentro de esta vista

## Fases

### Fase 1: Datos publicos de perfil extendido

- Goal: exponer desde backend los mismos datos de lectura que usa el perfil propio
- Expected files or systems: `backend/app/presentation/routers/social.py`, `tests/test_social.py`
- Validation: `backend\\.venv\\Scripts\\python.exe -m pytest tests/test_social.py -q`
- Review gate: favoritos, watchlist y diario publico quedan consumibles por `username`
- Estado: completada

### Fase 2: ViewModel publico enriquecido

- Goal: cargar favoritos, actividad reciente, watchlist y diario con errores y cargas parciales separadas
- Expected files or systems: `SocialRepository`, `PublicProfileViewModel`
- Validation: `npm exec tsc -- --noEmit`
- Review gate: el follow sigue funcionando y los fallos parciales no bloquean toda la pantalla
- Estado: completada

### Fase 3: UI publica equivalente al perfil propio

- Goal: renderizar la misma estructura visual y funcional del perfil propio en modo lectura
- Expected files or systems: `PublicProfileScreen`, `WatchLogDiaryContent`
- Validation: `npm exec tsc -- --noEmit`
- Review gate: tabs, favoritas, actividad, watchlist y diario quedan navegables sin affordances de edicion
- Estado: completada

## Fases

### Fase 1: Registro con confirmacion de contrasena

- Goal: evitar altas accidentales por typo antes de enviar `POST /auth/register`
- Expected files or systems: `RegisterViewModel`, `RegisterScreen`
- Validation: `npx tsc --noEmit`
- Review gate: el formulario exige ambos campos y no llama al backend cuando las contrasenas divergen
- Estado: completada

### Fase 2: Refresco del perfil propio al recuperar foco

- Goal: sincronizar la pantalla de perfil con visionados, listas y estados creados desde otras rutas
- Expected files or systems: `ProfileViewModel`
- Validation: `npx tsc --noEmit`
- Review gate: la pantalla usa recarga por foco, preserva la tolerancia a fallos en stats y evita actualizar estado desmontado
- Estado: completada

### Fase 3: QA, self-review y documentacion

- Goal: verificar tipos, revisar diff y dejar documentadas decisiones y riesgos
- Expected files or systems: docs de implementacion y mobile
- Validation: `npx tsc --noEmit`
- Review gate: quedan explicitados los escenarios manuales pendientes y el comportamiento con drafts en edicion
- Estado: completada

## Cierre

- Registro mobile ahora exige repetir contrasena antes de crear la cuenta
- Perfil propio mobile se recarga al volver a foco y refleja actividad reciente sin tocar el contrato backend
- Validaciones ejecutadas:
- `npx tsc --noEmit`
- Riesgo residual aceptado: la validacion funcional visual del refresco de perfil sigue pendiente en Expo/dispositivo real

# Fase 10 - Navegacion de 5 tabs, Social visual y Perfil curado

## Objetivo

- Reorganizar mobile alrededor de `Inicio`, `Social`, `Diario`, `Listas` y `Perfil`, haciendo `Social` mas visual y `Perfil` mas representativo del gusto propio.

## Alcance

- En alcance:
- Backend para favoritas manuales del perfil propio
- Backend para feed social visual agrupado por obra
- Backend para visionados recientes enriquecidos con metadata de media
- Nueva barra inferior de 5 tabs en mobile
- `Inicio` centrado en descubrimiento y busqueda
- Nueva tab `Social` con cabecera visual + feed detallado
- `Perfil` con stats, 4 favoritas manuales y carrusel de visionados recientes
- Tabs dedicadas para `Diario` y `Listas`
- Fuera de alcance:
- Cache persistente TMDB
- Personalizacion avanzada del orden del bloque social
- Edicion drag-and-drop de favoritas
- Refactor completo del sistema visual global a una paleta clara

## Fases

### Fase 1: Contratos y tests backend

- Goal: fijar favoritos manuales, feed visual agrupado y watchlog reciente enriquecido antes de tocar mobile
- Expected files or systems: `tests/test_social.py`, `tests/test_watch_log.py`, routers y schemas de `social` y `watchlog`
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`, `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_watch_log.py -q`
- Review gate: los nuevos endpoints devuelven caratula/titulo y se degrada sin romper si TMDB falla
- Estado: completada

### Fase 2: Dominio y persistencia backend

- Goal: introducir favoritos manuales y enrichment reutilizable sin meter logica en routers
- Expected files or systems: modelo `user_favorite_media`, repositorio de favoritas, servicio `MediaSummaryLoader`, use cases de `social` y `watchlog`
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`, `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_watch_log.py -q`
- Review gate: favoritos, social visual y visionados recientes quedan desacoplados y reutilizan el mismo enrichment de media
- Estado: completada

### Fase 3: Navegacion mobile

- Goal: separar las 5 acciones base en tabs claras sin romper login ni rutas existentes
- Expected files or systems: `mobile/app/(tabs)/_layout.tsx`, nuevas tabs `social`, `diary`, `lists`, `home`
- Validation: `npx tsc --noEmit`
- Review gate: `Inicio` deja de mezclar social y las rutas tab siguen siendo validas desde `router.push`
- Estado: completada

### Fase 4: Pantalla Social

- Goal: crear una experiencia social con escaneo rapido por caratula y detalle debajo
- Expected files or systems: `SocialViewModel`, `SocialScreen`, repositorio mobile de `social`
- Validation: `npx tsc --noEmit`
- Review gate: la cabecera visual y el feed detallado tienen estados independientes y usan contratos separados
- Estado: completada

### Fase 5: Pantalla Perfil

- Goal: convertir `Perfil` en una pantalla de identidad y gusto, no un contenedor de accesos
- Expected files or systems: `ProfileViewModel`, `ProfileScreen`, repositorios mobile de `social` y `watchlog`
- Validation: `npx tsc --noEmit`
- Review gate: favoritas manuales, stats y visionados recientes conviven sin bloquear la edicion del perfil
- Estado: completada

### Fase 6: QA, self-review y documentacion

- Goal: verificar backend y TypeScript, revisar diff y dejar riesgos documentados
- Expected files or systems: docs de implementacion, backend y mobile
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`, `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_watch_log.py -q`, `npx tsc --noEmit`
- Review gate: quedan explicitos los limites actuales de TMDB y la validacion manual pendiente en Expo
- Estado: completada

## Cierre

- Mobile ahora expone 5 tabs base: `Inicio`, `Social`, `Diario`, `Listas` y `Perfil`
- `Social` combina un radar visual por obra con el feed social detallado existente
- `Perfil` muestra favoritas manuales y visionados recientes enriquecidos con caratula y nota
- Validaciones ejecutadas:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_watch_log.py -q`
- `npx tsc --noEmit`
- Riesgo residual aceptado: la composicion sigue usando el sistema visual dark actual aunque la estructura y la jerarquia se alinean con `DESIGN.md`

# Fase 11 - DetailScreen editorial tipo Letterboxd

## Objetivo

- Replantear la pantalla de detalle de media para que se sienta mas editorial, limpia y cinematografica, tomando la composicion de Letterboxd como referencia y usando `DESIGN.md` para jerarquia, tipografia y uso disciplinado del verde.

## Alcance

- En alcance:
- Rehacer la composicion principal de `DetailScreen`
- Hero visual con backdrop/poster y metadata mas compacta
- Jerarquia editorial para titulo, meta, tagline y overview
- Acciones primarias mas compactas y guiadas por iconos
- Reducir protagonismo inicial del bloque de resenas manteniendo su funcionalidad
- Fuera de alcance:
- Cambios de contrato backend para directores, trailers o tagline real
- Rediseño global del resto de pantallas
- Nueva infraestructura de tests visuales/E2E

## Fases

### Fase 1: Plan visual y restricciones

- Goal: fijar la composicion objetivo y como se traduce la referencia de Letterboxd al sistema actual de PlotSkip
- Expected files or systems: `DESIGN.md`, `mobile/src/presentation/features/detail/DetailScreen.tsx`, docs de implementacion
- Validation: decisiones visuales y limitaciones de datos documentadas antes de editar
- Review gate: quedan claras la jerarquia de bloques y las concesiones por falta de datos como director/trailer/tagline real
- Estado: completada

### Fase 2: Hero y metadata editorial

- Goal: convertir el arranque de la pantalla en una cabecera mas limpia con imagen dominante, poster flotante y meta compacta
- Expected files or systems: `mobile/src/presentation/features/detail/DetailScreen.tsx`
- Validation: `npx tsc --noEmit`
- Review gate: la pantalla gana identidad visual sin perder legibilidad ni estados de carga/error
- Estado: completada

### Fase 3: Acciones compactas con iconos y reseñas reposicionadas

- Goal: sustituir CTA pesadas por acciones compactas y dejar las reseñas como bloque secundario
- Expected files or systems: `mobile/src/presentation/features/detail/DetailScreen.tsx`
- Validation: `npx tsc --noEmit`
- Review gate: registrar visionado, estado y escritura de reseña siguen funcionando con menos ruido visual
- Estado: completada

### Fase 4: QA, self-review y riesgos

- Goal: revisar diff, validar TypeScript y documentar riesgos visuales/funcionales residuales
- Expected files or systems: docs de implementacion y mobile
- Validation: `npx tsc --noEmit`
- Review gate: quedan explicitados los puntos que todavia requieren validacion manual en Expo/dispositivo real
- Estado: completada

## Cierre

- `DetailScreen` ahora abre con una composicion mas editorial: hero visual, poster flotante y metadata compacta
- Las acciones principales pasan a una rail iconica con menos peso textual y las reseñas bajan en la jerarquia inicial
- La pantalla mantiene el sistema dark actual, pero aplica mejor la disciplina de `DESIGN.md` en espaciado, jerarquia y uso contenido del verde
- Validaciones ejecutadas:
- `npx tsc --noEmit`
- Riesgo residual aceptado: falta validacion manual en Expo/dispositivo real para afinar feeling, scroll y equilibrio visual del hero

# Fase 12 - DetailScreen con 3 acciones y modal de reseña

## Objetivo

- Simplificar la interacción principal de detalle a `vista`, `watchlist` y `reseña`, y mover la escritura de reseña a un modal centrado con rating por estrellas de media unidad.

## Alcance

- En alcance:
- Reducir la rail a 3 botones
- Eliminar la entrada visible de diario/visionado inline de esta pantalla
- Modal centrado para crear/editar reseña
- Selector de 5 estrellas con soporte de media estrella
- Fuera de alcance:
- Cambios backend de contrato
- Replantear comentarios o reseñas de comunidad fuera de su posición actual

## Fases

### Fase 1: Simplificación de acciones

- Goal: dejar solo las 3 acciones que definen el flujo principal de detalle
- Expected files or systems: `mobile/src/presentation/features/detail/DetailScreen.tsx`
- Validation: `npx tsc --noEmit`
- Review gate: no queda affordance visible para diario u otras listas
- Estado: completada

### Fase 2: Modal de reseña y rating por estrellas

- Goal: reemplazar el formulario inline por un modal centrado más natural para escribir y puntuar
- Expected files or systems: `mobile/src/presentation/features/detail/DetailScreen.tsx`
- Validation: `npx tsc --noEmit`
- Review gate: editar/publicar reseña sigue funcionando y la puntuación admite medias estrellas
- Estado: completada

### Fase 3: QA y documentación

- Goal: revisar el diff, validar TypeScript y dejar los riesgos residuales anotados
- Expected files or systems: docs de implementacion y mobile
- Validation: `npx tsc --noEmit`
- Review gate: quedan explicitados los puntos a validar manualmente en móvil real
- Estado: completada

## Cierre

- `DetailScreen` queda con 3 acciones visibles: `vista`, `watchlist` y `reseña`
- La reseña ya no se escribe en el scroll: se abre en un modal centrado con puntuación por 5 estrellas y medias estrellas
- La pantalla deja fuera el affordance visible de diario desde esta vista para que el detalle sea más claro y directo
- Validaciones ejecutadas:
- `npx tsc --noEmit`
- Riesgo residual aceptado: falta validar en móvil real el tacto del selector de medias estrellas y el tamaño final del modal con teclado abierto

# Fase 13 - Listas conjuntas con colaboradores y autoria por item

## Objetivo

- Permitir listas colaborativas donde un numero indefinido de usuarios pueda participar en la misma lista, anadir o quitar obras segun permisos, y ver claramente quien anadio cada item.

## Alcance

- En alcance:
- Backend para colaboradores de lista con permisos de edicion
- Persistencia de autoria por item para mostrar `quien anadio esta obra`
- Inclusion de listas propias y compartidas en `GET /lists/me`
- Detalle de lista con owner, colaboradores y autoria por item
- Alta y baja de colaboradores desde mobile
- Mobile para distinguir listas propias vs compartidas y mostrar autoria en cada obra
- Sustitucion del flag `editable` por permisos reales devueltos por backend
- Tests backend de permisos, visibilidad y autoria
- Fuera de alcance:
- Invitaciones asincronas, notificaciones push o email
- Roles avanzados mas alla de owner + colaborador editor
- Historial completo de auditoria
- Edicion en tiempo real con sockets

## Fases

### Fase 1: Contratos y reglas de negocio

- Goal: cerrar el contrato funcional de colaboracion antes de tocar esquema o UI
- Expected files or systems: `implementation.md`, `implementation_details.md`, `tests/test_lists.py`
- Validation: tests definidos para owner, colaborador, tercero sin acceso, autoria por item y listas compartidas en `GET /lists/me`
- Review gate: queda decidida la semantica exacta de `owner`, `collaborator`, visibilidad y permisos de borrado/edicion
- Estado: completada

### Fase 2: Modelo de datos y migracion

- Goal: modelar colaboradores y autoria por item sin romper listas existentes
- Expected files or systems: nueva migracion Alembic, `backend/app/data/models/list.py`, `backend/app/data/models/list_item.py`, nuevo modelo de membresia de lista
- Validation: migracion forward sobre base actual y tests backend verdes
- Review gate: la migracion conserva al owner actual, permite colaboradores ilimitados y registra `added_by_user_id` en cada item
- Estado: completada

### Fase 3: Dominio, repositorios y casos de uso

- Goal: mover permisos y colaboracion al dominio con contratos claros y reutilizables
- Expected files or systems: `backend/app/domain/entities/lists.py`, `backend/app/domain/repositories/i_list_repository.py`, `backend/app/data/repositories/list_repository.py`, nuevos use cases de colaboradores
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- Review gate: la app deja de asumir `list.user_id == editor actual` y los permisos viven en repositorio/use cases, no en routers
- Estado: completada

### Fase 4: Endpoints y schemas backend

- Goal: exponer colaboracion y autoria con un contrato consistente para mobile
- Expected files or systems: `backend/app/presentation/schemas/lists.py`, `backend/app/presentation/routers/lists.py`
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- Review gate: `GET /lists/me` devuelve listas propias y compartidas, el detalle incluye colaboradores y cada item indica su autor
- Estado: completada

### Fase 5: Mobile listas compartidas

- Goal: adaptar la experiencia actual de listas para ownership compartido sin perder simplicidad
- Expected files or systems: `mobile/src/domain/entities/lists.ts`, `mobile/src/data/repositories/ListsRepository.ts`, `mobile/src/presentation/features/lists/MyListsViewModel.ts`, `mobile/src/presentation/features/lists/MyListsScreen.tsx`, `mobile/src/presentation/features/lists/ListDetailViewModel.ts`, `mobile/src/presentation/features/lists/ListDetailScreen.tsx`
- Validation: `npx tsc --noEmit`
- Review gate: la UI decide si se puede editar a partir del backend, muestra quien anadio cada obra y permite gestionar colaboradores desde el owner
- Estado: completada

### Fase 6: QA, self-review y riesgos

- Goal: validar permisos, migracion y UX base antes de cerrar la funcionalidad
- Expected files or systems: docs de implementacion, backend y mobile
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`, `backend\.venv\Scripts\python.exe -m pytest ..\tests -q`, `npx tsc --noEmit`
- Review gate: quedan documentados los limites de concurrencia, la ausencia de invites y los escenarios manuales pendientes
- Estado: completada

## Cierre

- Backend con invitaciones pendientes, follow mutuo obligatorio para invitar, colaboradores activos y autoria por item
- `GET /lists/me` ahora devuelve listas propias, compartidas e invitaciones pendientes en una sola respuesta
- Mobile de listas rehecho con secciones para invitaciones, listas propias y compartidas, y detalle guiado por permisos reales del backend
- El detalle de lista permite invitar colaboradores desde busqueda filtrada por follow mutuo, quitar colaboradores y ver quien anadio cada obra
- Validaciones ejecutadas:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests -q`
- `npx tsc --noEmit`
- Riesgo residual aceptado: la concurrencia entre colaboradores sigue siendo `last write wins` y falta validacion manual en Expo/dispositivo real

# Fase 14 - Perfil social propio y vista de red

## Objetivo

- Refinar visualmente `ProfileScreen` para que favoritos y actividad reciente se lean como una galeria mas limpia, y anadir una vista propia de red con `Seguidores` y `Siguiendo`.

## Alcance

- En alcance:
- Endpoints backend para listar `followers` y `following` del usuario autenticado
- Contrato social ampliado con `follows_me` para distinguir reciprocidad
- Nueva ruta mobile dedicada para la red del perfil propio
- Acciones follow/unfollow desde la lista de red
- Ajustes visuales en `ProfileScreen` para posters rectos, tamano unificado y sin metadatos debajo
- Contadores pulsables de `Seguidores` y `Siguiendo` en el perfil propio
- Fuera de alcance:
- Tab `Blocked`
- Vista de red para perfiles publicos
- Busqueda o filtros dentro de la nueva pantalla
- Nuevos tests E2E visuales mobile

## Fases

### Fase 1: Documentacion y contrato

- Goal: fijar el alcance tecnico, el contrato `follows_me` y la secuencia de trabajo antes de editar
- Expected files or systems: `implementation.md`, `implementation_details.md`, slice social backend/mobile
- Validation: docs actualizadas y checklist QA aplicada al cambio
- Review gate: el flujo follower/following y la UX de CTA quedan cerrados antes de tocar produccion
- Estado: completada

### Fase 2: Backend followers/following

- Goal: exponer listas de seguidores y seguidos del usuario autenticado con informacion suficiente para la UI
- Expected files or systems: entidades sociales, `IUserRepository`, `UserRepository`, use cases de `social`, schemas/routers, `tests/test_social.py`
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- Review gate: el backend distingue `is_following` y `follows_me` sin ambiguedad y mantiene el estilo del slice social
- Estado: completada

### Fase 3: Cliente mobile y nueva ruta

- Goal: conectar la nueva API con una pantalla dedicada `profile-network`
- Expected files or systems: `mobile/src/domain/entities/social.ts`, `mobile/src/data/repositories/SocialRepository.ts`, nueva ruta stack, view model y screen de red
- Validation: `npx tsc --noEmit`
- Review gate: la pantalla abre en la tab correcta y soporta follow/unfollow optimista por fila
- Estado: completada

### Fase 4: Ajustes del perfil propio

- Goal: alinear visualmente favoritos y recent activity y anadir accesos a red desde stats
- Expected files or systems: `ProfileViewModel`, `ProfileScreen`
- Validation: `npx tsc --noEmit`
- Review gate: favoritos y recent activity comparten tamano visual y ya no muestran titulos debajo
- Estado: completada

### Fase 5: QA, self-review y riesgos

- Goal: ejecutar checks, revisar diff y dejar documentadas las incertidumbres reales
- Expected files or systems: backend, mobile y docs de implementacion
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`, `npx tsc --noEmit`
- Review gate: quedan documentados los riesgos de validacion visual manual y de sincronizacion de contadores
- Estado: completada

## Cierre

- Backend social ahora expone `GET /users/me/followers` y `GET /users/me/following`
- El contrato de resumen social incluye `follows_me` para distinguir reciprocidad sin logica frágil en mobile
- `ProfileScreen` ahora muestra `Seguidores` y `Siguiendo`, unifica el tamano de posters y elimina metadatos debajo de favoritos y actividad reciente
- Mobile anade la nueva pantalla dedicada `profile-network` con tabs `Following` y `Followers`, y CTA de follow/unfollow por fila
- Validaciones ejecutadas:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `npx tsc --noEmit`
- Riesgo residual aceptado: falta validacion manual en Expo/dispositivo real para afinar tactilidad, espaciado y percepcion visual del nuevo screen de red

# Fase 15 - Tabs internas de Perfil con Watchlist y Diario

## Objetivo

- Reubicar `Watchlist` y `Diario` dentro de `ProfileScreen`, dejando la tab bar principal con una estrella central `WIP` y sin acceso directo a `Diario`.

## Alcance

- En alcance:
- Quitar `Diario` de la tab bar visible
- Anadir una entrada central `WIP` con icono de estrella y sin navegacion
- Crear tabs superiores `Perfil`, `Watchlist` y `Diario` dentro de `ProfileScreen`
- Embutir `Watchlist` del usuario autenticado con grid de 4 columnas y lenguaje visual cercano a `ListDetailScreen`
- Reutilizar la logica y presentacion del diario para la tab interna y la pantalla standalone existente
- Fuera de alcance:
- Nueva funcionalidad para la estrella central
- Cambios backend o nuevos contratos HTTP
- Rehacer la ruta standalone `watchlog-list`
- Edicion colaborativa de la watchlist personal

## Fases

### Fase 1: Shell de navegacion y documentacion

- Goal: actualizar tabs principales y fijar la nueva estructura interna del perfil antes de tocar vistas de datos
- Expected files or systems: `implementation.md`, `implementation_details.md`, `mobile/app/(tabs)/_layout.tsx`, ruta placeholder `wip`
- Validation: `npx tsc --noEmit`
- Review gate: la tab bar ya no expone `Diario`, la estrella ocupa el centro y no navega
- Estado: completada

### Fase 2: Watchlist embebida en perfil

- Goal: mostrar la watchlist como una coleccion personal densa dentro de `ProfileScreen`
- Expected files or systems: `MediaStatusListViewModel`, nuevo componente/presentacion de watchlist, `ProfileScreen`
- Validation: `npx tsc --noEmit`
- Review gate: la watchlist carga, abre detalle, mantiene 4 columnas y no muestra affordances sociales de listas colaborativas
- Estado: completada

### Fase 3: Diario embebido y reutilizacion de UI

- Goal: reutilizar la UI del diario para la tab interna de perfil y la pantalla standalone
- Expected files or systems: `WatchLogListScreen`, nuevo componente compartido de diario, `ProfileScreen`, `ProfileViewModel`
- Validation: `npx tsc --noEmit`
- Review gate: la tab `Diario` conserva secciones por mes, apertura de detalle y borrado de entradas
- Estado: completada

### Fase 4: QA, self-review y pulido

- Goal: cerrar el cambio con chequeo de tipado, diff y riesgos residuales
- Expected files or systems: mobile y docs de implementacion
- Validation: `npx tsc --noEmit`
- Review gate: quedan documentadas las decisiones sobre la estrella `WIP`, el diario interno y la watchlist personal
- Estado: completada

## Cierre

- `ProfileScreen` ahora organiza la experiencia en tabs internas `Perfil`, `Watchlist` y `Diario`
- La tab bar principal deja `Diario` oculto y muestra una estrella central `WIP` sin accion
- `Watchlist` se renderiza como coleccion personal densa de 4 columnas con apertura a detalle
- El diario se reutiliza desde un componente compartido para evitar drift entre la tab interna y la pantalla standalone `watchlog-list`
- Validaciones ejecutadas:
- `npx tsc --noEmit`
- Riesgo residual aceptado: sigue pendiente validacion manual en Expo/dispositivo real para ajustar tactilidad de tabs y percepcion final de la tab bar `WIP`

# Fase 16 - Sugerencia random desde la estrella de tab bar

## Objetivo

- Convertir la estrella central de la tab bar en una entrada util que sugiera una pelicula o serie aleatoria ya guardada en la `watchlist` del usuario.

## Alcance

- En alcance:
- Reemplazar el placeholder `WIP` por una interaccion real
- Al pulsar la estrella, abrir un modal centrado
- Cargar un item aleatorio de la `watchlist` del usuario autenticado
- Mostrar poster, titulo, descripcion y nota media
- Permitir volver a tirar otra sugerencia desde el propio modal
- Fuera de alcance:
- Nuevos endpoints backend
- Persistencia de historial de picks
- Algoritmos de recomendacion mas alla de random simple

## Fases

### Fase 1: View model y contrato local

- Goal: encapsular la logica de seleccionar una sugerencia random fuera del shell de tabs
- Expected files or systems: repositorios `MediaRepository`, nuevo view model/componente para random pick
- Validation: `npx tsc --noEmit`
- Review gate: el shell de tabs no contiene logica de negocio ni manejo de errores detallado
- Estado: completada

### Fase 2: Modal e integracion con tab bar

- Goal: conectar la estrella central con un modal centrado que soporte carga, vacio, error y reroll
- Expected files or systems: `mobile/app/(tabs)/_layout.tsx`, nuevo modal/componente random watchlist
- Validation: `npx tsc --noEmit`
- Review gate: la estrella abre el modal sin navegar y la UI comunica claramente el estado
- Estado: completada

### Fase 3: QA y cierre

- Goal: revisar tipado y documentar riesgos residuales
- Expected files or systems: mobile y docs de implementacion
- Validation: `npx tsc --noEmit`
- Review gate: queda claro el comportamiento cuando la watchlist esta vacia y cuando falla la carga
- Estado: completada

## Cierre

- La estrella central de la tab bar ahora abre un modal con una sugerencia random de la watchlist
- La seleccion prioriza peliculas guardadas y cae a series solo si no hay peliculas disponibles
- El modal soporta carga, watchlist vacia, error, reroll y acceso a la ficha completa del titulo sugerido
- Validaciones ejecutadas:
- `npx tsc --noEmit`
- Riesgo residual aceptado: sigue pendiente validacion manual en Expo/dispositivo real para ajustar sensacion del modal, altura del contenido y feedback de la estrella en la tab bar

# Fase 17 - Random Pick con filtro de fuente

## Objetivo

- Ampliar el modal `random` para que pueda sugerir desde la watchlist propia, desde una lista propia/compartida o desde la mezcla entre tu watchlist y la de alguien a quien sigues.

## Alcance

- En alcance:
- Anadir un filtro arriba a la izquierda en el modal random
- Permitir elegir `Mi watchlist`, `Una de tus listas` y `2 watchlists`
- Reutilizar solo APIs ya existentes para listas, following y watchlists publicas
- Mantener `Otra random`, `Ver ficha completa`, estados vacios, errores y redirect por `401`
- Fuera de alcance:
- Cambios backend
- Busqueda global de usuario
- Deduplicacion de titulos repetidos entre watchlists
- Persistencia del ultimo filtro entre sesiones

## Fases

### Fase 1: Tipos y resolucion de fuentes

- Goal: extraer la composicion de candidatos y fallbacks a un helper testeable y tipado
- Expected files or systems: modal random, helper local de fuentes random
- Validation: `npx tsc --noEmit`
- Review gate: la UI deja de mezclar seleccion de fuente, fallback y pick random en el mismo bloque
- Estado: completada

### Fase 2: Selector de fuente y datos asociados

- Goal: abrir una experiencia secundaria para elegir lista o usuario seguido sin tocar backend
- Expected files or systems: modal random, repositorios `ListsRepository` y `SocialRepository`
- Validation: `npx tsc --noEmit`
- Review gate: la fuente puede cambiar entre watchlist propia, listas propias/compartidas y watchlist conjunta
- Estado: completada

### Fase 3: QA y cierre

- Goal: revisar tipado, fallbacks y documentar riesgos residuales reales
- Expected files or systems: mobile y docs de implementacion
- Validation: `npx tsc --noEmit`
- Review gate: quedan explicitados fallback a `Mi watchlist`, limites de `following` y riesgos pendientes de validacion manual
- Estado: completada

## Cierre

- El modal random ahora muestra un filtro en cabecera y deja elegir la fuente de la sugerencia
- `Una de tus listas` usa listas propias y compartidas como pool alternativo
- `2 watchlists` mezcla tu watchlist con la de una cuenta que sigues
- Si la fuente elegida deja de ser valida, el flujo vuelve a `Tu watchlist` y lo comunica en UI
- Validaciones ejecutadas:
- `npx tsc --noEmit`
- Riesgo residual aceptado: sigue pendiente validacion manual en Expo/dispositivo real para ajustar altura del modal secundario, scroll y tactilidad del cambio de fuente
