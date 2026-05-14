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
