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
