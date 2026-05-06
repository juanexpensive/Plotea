# Roadmap de fases de PlotSkip

PRD: [prd-plotskip.md](prd-plotskip.md)

Ultima revision: 2026-05-06

## Proposito

Este documento es el mapa maestro de fases del proyecto. Sirve para saber que se ha construido, que toca despues y que criterios debe cumplir cada bloque antes de avanzar.

Los planes mas concretos viven en documentos separados, como `plan-db-usuarios.md` y `plan-media-status.md`. Cuando se empiece una fase nueva, `implementation.md` y `implementation_details.md` deben actualizarse con el alcance operativo de esa fase.

## Principios de trabajo

- Trabajar por fases pequenas, con un objetivo verificable y una puerta de revision al final.
- Empezar cada feature con tests de comportamiento: primero backend cuando haya contrato API, despues mobile cuando haya UI.
- Mantener Clean Architecture: `domain` define entidades, contratos y casos de uso; `data` implementa repositorios; `presentation` adapta HTTP/UI; `infrastructure` resuelve detalles externos.
- Aplicar SOLID sin sobrediseno: responsabilidades claras, dependencias hacia abstracciones, nombres del dominio y abstracciones solo cuando reduzcan complejidad real.
- Evitar atajos de producto: no logica de negocio en routers, no arrays JSON donde toca modelo relacional, no acoplar UI a detalles de BD o proveedores externos.
- Cerrar cada fase con self-review: diffs leidos, tests ejecutados, riesgos anotados y siguiente fase confirmada.

## Estado global

- Completado: base backend, autenticacion, recuperacion de password, busqueda/detalle de media, estado personal `watched/watchlist`, diario `watch_log`, resenas MVP, comentarios/votos utiles, pantallas principales de auth/home/detalle/perfil.
- Pendiente principal: social/feed, listas personalizadas, perfil publico/stats, notificaciones, hardening de release.
- Riesgo vivo: algunas notas antiguas del repo pueden estar desfasadas frente al estado real del codigo. Antes de iniciar una fase hay que contrastar PRD, planes y archivos existentes.

## Fase 0 - Fundacion tecnica del backend

Estado: completada.

Objetivo: tener FastAPI arrancando con configuracion, base de datos, Alembic, fixtures de test y ruta de salud.

Incluye:
- Estructura `backend/app` por capas.
- Configuracion `.env`, `Settings`, engine async y `get_db`.
- Alembic preparado para migraciones.
- `GET /health`.
- Tests base con SQLite en memoria.

Validacion:
- `pytest tests/` pasa.
- `uvicorn app.main:app` arranca desde `backend`.

Puerta de revision:
- No hay logica de negocio en infraestructura.
- La configuracion sensible queda fuera del repo.

## Fase 1 - Usuarios y autenticacion

Estado: completada.

Plan de detalle: [plan-db-usuarios.md](plan-db-usuarios.md)

Objetivo: permitir registro, login, refresh, logout y recuperacion de password de forma segura.

Incluye:
- Modelos `users`, `refresh_tokens`, `password_reset_tokens`.
- Repositorios y casos de uso de auth.
- Endpoints `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`.
- Rate limiting en registro/login.
- Flujo mobile de auth y reset.

Validacion:
- `pytest tests/test_register.py tests/test_login.py tests/test_refresh_logout.py tests/test_password_reset.py`.
- `npx tsc --noEmit` en `mobile`.

Puerta de revision:
- Nunca se expone `password_hash`.
- El refresh token se almacena hasheado y logout/reset invalidan sesiones como corresponde.
- Los routers delegan en casos de uso.

## Fase 2 - Descubrimiento de peliculas y series

Estado: completada.

Objetivo: buscar y ver detalle de peliculas/series usando TMDB como catalogo externo.

Incluye:
- Cliente TMDB con cache ligera.
- Endpoints de busqueda y detalle en `/media`.
- Tipos mobile para `MediaSearchResult` y `MediaDetail`.
- Home/search y pantalla de detalle.

Validacion:
- `pytest tests/test_media_search.py`.
- `npx tsc --noEmit`.
- Prueba manual en Expo: buscar una pelicula y abrir detalle.

Puerta de revision:
- El dominio usa `(tmdb_id, media_type)` como identidad.
- No se duplican datos completos de TMDB en tablas propias.
- Los errores de proveedor externo se traducen a respuestas/API states utiles.

## Fase 3 - Estado personal y diario de visionado

Estado: completada.

Plan de detalle: [plan-media-status.md](plan-media-status.md)

Objetivo: guardar si una obra esta vista o en watchlist, y registrar visionados con fecha, rating y notas.

Incluye:
- Modelo `user_media_status`.
- Modelo `watch_log`.
- Endpoints de estado personal en `/media/{media_type}/{tmdb_id}/status`.
- Endpoints de diario en `/watchlog`.
- UI mobile para marcar vista/watchlist, registrar visionado y ver listas desde perfil.

Validacion:
- `pytest tests/test_media_status.py tests/test_watch_log.py`.
- `npx tsc --noEmit`.
- Prueba manual: marcar una obra como vista, crear entrada de diario y verla en perfil.

Puerta de revision:
- `watch_log` permite re-watches.
- `user_media_status` mantiene un unico estado por usuario y obra.
- Crear un visionado marca la obra como `watched` sin duplicar reglas en la UI.

## Fase 4 - Resenas MVP

Estado: completada.

Objetivo: permitir escribir, editar, eliminar y leer resenas de una obra.

Incluye:
- Modelo `reviews` con `user_id`, `tmdb_id`, `media_type`, `rating`, `body`, `contains_spoilers`, `created_at`, `updated_at`.
- Constraint unica: un usuario solo puede tener una resena por obra.
- Entidad `Review`, repositorio `IReviewRepository` y casos de uso `CreateReview`, `UpdateReview`, `DeleteReview`, `ListMediaReviews`, `GetMyReviewForMedia`.
- Endpoints `POST /reviews`, `PUT /reviews/{id}`, `DELETE /reviews/{id}`, `GET /media/{media_type}/{tmdb_id}/reviews`, `GET /media/{media_type}/{tmdb_id}/reviews/me`.
- Mobile: formulario de resena desde detalle, visualizacion de resenas, spoilers colapsables y estado de "mi resena".

Validacion:
- Tests backend de crear, editar, borrar, listar, rechazar duplicados, rechazar no autor y validar rating 1-10.
- `npx tsc --noEmit`.
- Prueba manual: crear una resena con spoiler, verla en detalle, editarla y borrarla.

Puerta de revision:
- Rating sigue el contrato `SMALLINT` 1-10.
- La resena sigue el formato de producto esperado: rating + texto + spoilers, sin titulo separado.
- Las reglas de permisos viven en casos de uso, no en componentes ni routers.
- La pantalla de detalle no queda acoplada al DTO crudo del backend.

## Fase 5 - Comentarios y votos utiles

Estado: completada.

Objetivo: permitir interaccion basica sobre resenas.

Incluye:
- Modelos `comments` y `review_votes`.
- Casos de uso para comentar, borrar comentario propio, votar y quitar voto.
- Endpoints `GET /reviews/{id}/comments`, `POST /reviews/{id}/comments`, `POST /reviews/{id}/vote`, `DELETE /reviews/{id}/vote`.
- UI mobile para comentarios y contador de votos utiles.

Validacion:
- Tests backend de comentarios por resena, permisos de borrado, voto unico por usuario y contador correcto.
- `npx tsc --noEmit`.

Puerta de revision:
- No se permite votar dos veces la misma resena.
- La lectura de comentarios esta paginada o preparada para paginacion.
- Las notificaciones que dependan de comentarios/votos quedan diferidas explicitamente si no entran aqui.

## Fase 6 - Social: usuarios, follows y feed

Estado: pendiente.

Objetivo: conectar usuarios y mostrar actividad reciente de personas seguidas.

Incluye:
- Busqueda de usuarios por username.
- Perfil publico basico.
- Modelo `follows` con check `follower_id != followed_id`.
- Modelo `activities` para `review`, `watch_log`, `list_created` y `follow`.
- Endpoints `GET /users/search`, `GET /users/{username}`, `POST /users/{id}/follow`, `DELETE /users/{id}/follow`, `GET /feed`.
- Feed con paginacion por cursor.
- Mobile: busqueda de usuarios, perfil publico, seguir/dejar de seguir y feed.

Validacion:
- Tests backend de follow/unfollow, no seguirse a uno mismo, privacidad de feed y paginacion sin duplicados.
- Tests de generacion de actividades desde resenas/visionados.
- `npx tsc --noEmit`.

Puerta de revision:
- El feed no usa offset pagination.
- Las actividades se crean desde casos de uso o servicios de aplicacion, no desde routers.
- El perfil publico no filtra datos privados.

## Fase 7 - Listas personalizadas

Estado: pendiente.

Objetivo: crear y compartir listas de peliculas/series con orden manual.

Incluye:
- Modelos `lists` y `list_items`.
- Casos de uso para crear, editar, borrar, anadir item, eliminar item y reordenar.
- Endpoints `/lists` y `/lists/{id}/items`.
- UI mobile de listas propias, detalle de lista y lista publica.
- Actividad `list_created` para feed.

Validacion:
- Tests backend de permisos, orden, duplicados y visibilidad publica/privada.
- `npx tsc --noEmit`.
- Prueba manual: crear una lista, anadir dos obras, reordenarlas y abrirla desde perfil.

Puerta de revision:
- `list_items` usa PK/unique por lista y obra.
- La posicion se mantiene consistente tras reordenar.
- La UI no asume que todos los items tienen datos frescos de TMDB.

## Fase 8 - Perfil, estadisticas y edicion de usuario

Estado: pendiente.

Objetivo: convertir el perfil en una vista util de identidad y actividad.

Incluye:
- `PUT /users/me` para editar display name, bio y avatar_url.
- `GET /users/{username}/stats`.
- Estadisticas de obras vistas, horas estimadas, generos mas vistos y media de puntuaciones.
- Mobile: editar perfil, perfil publico completo y stats.

Validacion:
- Tests backend de permisos de edicion, validacion de campos y calculo de stats.
- `npx tsc --noEmit`.

Puerta de revision:
- Las stats se calculan desde datos propios y cache TMDB controlada.
- Avatar no acepta binarios locales ni rutas inseguras.
- Los calculos caros quedan acotados o preparados para cache.

## Fase 9 - Notificaciones in-app

Estado: pendiente.

Objetivo: avisar dentro de la app de nuevos seguidores, comentarios y votos utiles.

Incluye:
- Modelo `notifications`.
- Generacion de notificaciones desde follow, comentario y voto.
- Endpoints `GET /notifications` y `PUT /notifications/{id}/read`.
- UI mobile de centro de notificaciones y badge basico.

Validacion:
- Tests backend de creacion, lectura, permisos y marcado como leida.
- `npx tsc --noEmit`.

Puerta de revision:
- No se implementan push notifications nativas en esta fase.
- Las notificaciones no se crean para acciones propias cuando no aporten valor.
- La generacion queda desacoplada del router.

## Fase 10 - Hardening, documentacion y release TFG

Estado: pendiente.

Objetivo: estabilizar el producto para demo, entrega y mantenimiento.

Incluye:
- Revision completa de tests backend y typecheck mobile.
- Limpieza de docs de setup y troubleshooting.
- Atribucion TMDB en ajustes/creditos.
- Revision de errores, loading states y estados vacios.
- Semillas o datos de demo si ayudan a la presentacion.
- Checklist de seguridad: secretos, CORS, rate limits, permisos y errores.

Validacion:
- `pytest tests/`.
- `npx tsc --noEmit`.
- Prueba manual de flujo completo: registro, login, busqueda, detalle, watchlist, diario, resena, follow/feed si ya esta disponible.

Puerta de revision:
- Riesgos residuales documentados.
- No quedan promesas de features fuera de alcance como push nativo, offline u OAuth.
- La demo puede reproducirse desde `SETUP.md`.

## Orden recomendado

1. Cerrar cualquier deuda de documentacion/setup que bloquee trabajar comodo.
2. Fase 6 - Social: usuarios, follows y feed.
3. Fase 7 - Listas personalizadas.
4. Fase 8 - Perfil, estadisticas y edicion de usuario.
5. Fase 9 - Notificaciones in-app.
6. Fase 10 - Hardening, documentacion y release TFG.

## Plantilla para iniciar una fase

Antes de escribir codigo de una fase pendiente:

- Actualizar `implementation.md` con objetivo, alcance, fases internas y puerta de revision.
- Actualizar `implementation_details.md` con inventario de archivos, supuestos, tests previstos, edge cases y riesgos.
- Escribir primero el test que describe el comportamiento principal.
- Implementar el minimo vertical slice que haga pasar ese test.
- Refactorizar solo despues de tener la conducta cubierta.
- Parar al final de la fase para review y registrar hallazgos.

## Checklist de review por fase

- La feature cumple el comportamiento prometido y no solo compila.
- Los tests cubren exito, permisos, validaciones y al menos un borde relevante.
- Las dependencias respetan Clean Architecture.
- Los nombres usan lenguaje del dominio: usuario, resena, visionado, lista, follow, actividad.
- No se introdujo abstraccion especulativa.
- No hay duplicacion que ya haya llegado a tres apariciones claras.
- La UI mobile tiene loading, error y empty states cuando aplica.
- La documentacion de fase refleja la realidad del codigo.
