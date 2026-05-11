# Fase 6 - Social: usuarios, follows y feed

## Objetivo

- Implementar el slice social base para descubrir usuarios, seguir cuentas y consumir un feed cronologico de actividad reciente de personas seguidas, manteniendo la logica en dominio y preparando el terreno para futuras listas y notificaciones.

## Alcance

- En alcance:
- Busqueda de usuarios por `username` con resultados ligeros
- Perfil publico basico sin exponer datos privados
- Modelo `follows` con restricciones para evitar self-follow y duplicados
- Modelo `activities` con soporte para `review`, `watch_log`, `list_created` y `follow`
- Endpoints `GET /users/search`, `GET /users/{username}`, `POST /users/{id}/follow`, `DELETE /users/{id}/follow`, `GET /feed`
- Feed con cursor pagination estable
- Integracion mobile para buscar usuarios, abrir perfil publico, seguir/dejar de seguir y ver feed
- Fuera de alcance:
- Recomendaciones algoritimicas de usuarios
- Notificaciones push o inbox social
- Likes/comentarios sobre actividades del feed
- Perfil editable o ajustes de privacidad avanzados
- Actividad `list_created` visible en UI antes de existir la fase de listas

## Fases

### Fase 1: Contratos y tests backend

- Goal: fijar desde tests el contrato social de busqueda, perfil publico, follow/unfollow y feed con cursor
- Expected files or systems: `tests/test_social.py` o extension de `tests/test_reviews.py`, `implementation.md`, `implementation_details.md`
- Validation: los tests describen self-follow prohibido, follow unico, perfil publico sin email y paginacion del feed sin duplicados
- Review gate: el contrato backend queda cerrado antes de tocar modelos y persistencia
- Estado: pendiente

### Fase 2: Dominio, persistencia y actividades backend

- Goal: implementar `follows` y `activities` con casos de uso y persistencia alineados con Clean Architecture
- Expected files or systems: modelos, migraciones, entidades, repositorios, casos de uso y servicios de aplicacion para publicar actividad
- Validation: `pytest tests/test_social.py`
- Review gate: las actividades nacen en casos de uso o servicios de aplicacion; el feed usa cursor y no offset
- Estado: pendiente

### Fase 3: Endpoints y contratos de presentacion

- Goal: exponer busqueda, perfil publico, follow/unfollow y feed con schemas estables para mobile
- Expected files or systems: routers y schemas de `users` y `feed`, wiring en `main.py`
- Validation: `pytest tests/test_social.py`
- Review gate: el perfil publico no devuelve email ni campos sensibles; los cursores son opacos y estables
- Estado: pendiente

### Fase 4: Integracion mobile social

- Goal: conectar el backend social con una UX minima viable en mobile
- Expected files or systems: entidades y repositorios mobile, pantalla/feed social, perfil publico y busqueda
- Validation: `npx tsc --noEmit`
- Review gate: follow/unfollow actualiza contador/estado sin inconsistencias y el feed pagina sin repetir items
- Estado: pendiente

### Fase 5: QA, self-review y riesgos

- Goal: ejecutar checks, revisar diffs y registrar riesgos reales antes de cerrar la fase
- Expected files or systems: docs de implementacion, backend y mobile
- Validation: `pytest tests/test_social.py`, `pytest tests/`, `npx tsc --noEmit`
- Review gate: quedan documentados riesgos residuales, supuestos y trabajo diferido
- Estado: pendiente

## Cierre esperado

- Backend con follows, actividades y feed social validados por tests
- Mobile con feed, busqueda y perfil publico funcionales sobre los contratos nuevos
- Riesgos de privacidad, paginacion y generacion de actividades documentados antes de pasar a la siguiente fase
