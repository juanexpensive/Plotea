# Fase 7 - Listas personalizadas

## Objetivo

- Implementar el slice completo de listas personalizadas sobre la base social ya cerrada en la Fase 6: listas propias y publicas, orden manual por intercambio de posicion, activacion real de `list_created` en backend y render real de `list_created` en mobile.

## Alcance

- En alcance:
- Modelos `lists` y `list_items` con ownership, visibilidad publica/privada y orden manual por `position`
- Endpoints `GET /lists/me`, `POST /lists`, `GET /lists/{id}`, `PUT /lists/{id}`, `DELETE /lists/{id}`, `GET /users/{username}/lists`, `POST /lists/{id}/items`, `DELETE /lists/{id}/items/{tmdb_id}/{media_type}`, `PATCH /lists/{id}/items/reorder`
- Publicacion de actividad `list_created` solo para listas publicas
- Contrato social ampliado para `list_created` con `list_id`, `list_name`, `items_count` e `is_public`
- Integracion mobile para listas propias, lista publica y navegacion desde perfil/feed social
- Reordenado mobile por dos toques con feedback visual simple
- Fuera de alcance:
- Slugs publicos de listas
- Listas colaborativas
- Likes, comentarios o follows sobre listas
- Drag and drop complejo con librerias de gestos
- Cache persistente de metadata TMDB

## Fases

### Fase 1: Contratos y tests backend de listas

- Goal: fijar desde tests el contrato de listas, permisos, duplicados, reorder y `list_created`
- Expected files or systems: `tests/test_lists.py`, `implementation.md`, `implementation_details.md`
- Validation: los tests describen privacidad `404`, duplicados `409`, borrado de item idempotente, swap de posiciones y feed con `list_created`
- Review gate: la politica de visibilidad y los payloads de reorder/feed quedan cerrados antes de tocar persistencia
- Estado: completada

### Fase 2: Dominio, persistencia y actividad backend

- Goal: implementar modelos, migracion, repositorios y casos de uso del slice de listas
- Expected files or systems: modelos, migracion `0007`, entidades, interfaces, repositorio `ListRepository`, use cases y `ActivityPublisher`
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py`
- Review gate: ownership, visibilidad publica/privada y swap atomico quedan resueltos en dominio, sin logica de negocio en routers
- Estado: completada

### Fase 3: Endpoints y ampliacion del contrato social

- Goal: exponer el API de listas y ampliar `list_created` dentro del feed social ya existente
- Expected files or systems: router `lists`, schemas `lists`, ajustes en `social` y wiring en `main.py`
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py`, `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py`
- Review gate: el feed mantiene cursor opaco y orden estable de Fase 6 sin romper `review`, `watch_log` ni `follow`
- Estado: completada

### Fase 4: Integracion mobile de listas

- Goal: conectar listas propias y publicas con la app mobile respetando la separacion ya fijada en Fase 6
- Expected files or systems: entidades/repo de listas, pantallas `my-lists` y `list-detail`, integracion en `Profile`, `PublicProfile` y `Home`
- Validation: `npx tsc --noEmit`
- Review gate: listas propias viven en perfil propio, listas publicas en perfil ajeno/feed, y el swap por dos toques funciona con feedback simple sin drag and drop
- Estado: completada

### Fase 5: QA, self-review y riesgos

- Goal: ejecutar checks, revisar diff y documentar riesgos residuales reales
- Expected files or systems: docs de implementacion, backend y mobile
- Validation: `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py`, `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py`, `backend\.venv\Scripts\python.exe -m pytest ..\tests -q`, `npx tsc --noEmit`
- Review gate: quedan reflejados los limites reales de metadata TMDB y la necesidad de validacion manual en Expo
- Estado: completada

## Cierre

- Backend con listas, items, reorder y `list_created` validados por tests
- Mobile con listas propias, listas publicas y tarjeta `list_created` integrada en el feed social existente
- Validaciones ejecutadas:
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_lists.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests\test_social.py -q`
- `backend\.venv\Scripts\python.exe -m pytest ..\tests -q`
- `npx tsc --noEmit`
- Riesgo residual aceptado: falta validacion manual en Expo para confirmar ritmo visual del swap, feedback de seleccion y navegacion real desde el feed social
