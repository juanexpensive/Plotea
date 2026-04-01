# PRD: PlotSkip — Red social de reseñas de cine y series

## Problema

Los amantes del cine y las series no tienen una plataforma social que combine tres cosas a la vez: un diario personal de visionado, reseñas de calidad con contexto, y conexión real con gente con gustos similares.

Letterboxd es el referente, pero solo cubre películas (sin series), no tiene versión en español de calidad, y su UX post-actualización ha recibido críticas fuertes por esconder acciones básicas (ver capturas de usuarios en TFG.pdf). IMDb es demasiado impersonal. Trakt no tiene capa social. Ninguna cubre series y películas en la misma experiencia social.

El usuario llega a PlotSkip porque quiere dejar constancia de lo que ve, opinar, y saber qué están viendo y pensando sus amigos.

## Solución

PlotSkip es una app móvil (iOS + Android) donde los usuarios pueden:
- Buscar y explorar películas y series via TMDB
- Llevar un diario de visionado con fecha y puntuación
- Escribir reseñas detalladas (con o sin spoilers marcados)
- Seguir a otros usuarios y ver su actividad en un feed
- Gestionar listas personalizadas de películas/series
- Ver estadísticas de su propio consumo audiovisual

Stack técnico: React Native + Expo (móvil) · FastAPI + Python (backend) · PostgreSQL (datos) · JWT con refresh tokens (auth) · TMDB API (catálogo de películas y series)

---

## Análisis crítico de errores en el diseño original

> Esta sección documenta los problemas detectados antes de definir la solución.

### E1 — Discogs/música: integración con valor cuestionable
Discogs es una API orientada a coleccionistas de vinilos, no a consumo casual de música. La mayoría de usuarios no conoce su catálogo y la UX de buscar un álbum es radicalmente distinta a buscar una película. Mezclar ambos dominios en el feed y las listas añade complejidad sin un beneficio claro para el usuario típico.
**Decisión:** Se elimina por completo. Se sustituye por series de TV via TMDB, que sí es coherente con el dominio de películas y reutiliza el 90% de la infraestructura.

### E2 — Modelo Obra → Película/Álbum: herencia innecesaria en BBDD
La herencia de clases en una base de datos relacional requiere STI (columnas null) o Table per Type (JOINs). Al eliminar Álbum, la superclase Obra queda vacía. Solo hay un tipo de contenido (media: película o serie). Una tabla `media_cache` con un campo `media_type` ('movie' | 'tv') resuelve esto sin herencia.

### E3 — Guardar datos de TMDB localmente: error de sincronización
El diseño original propone copiar título, director, duración y póster en la BD propia. Estos datos cambian en TMDB (se corrigen metadatos), los ToS de TMDB requieren atribución explícita, y duplicar el catálogo completo no tiene sentido.
**Solución:** Almacenar solo `tmdb_id` + `media_type` como referencia. Tener una tabla `media_cache` con los datos básicos (título, póster, año) para búsquedas locales y el feed, con TTL de refresco.

### E4 — JWT sin refresh token: sesiones rotas en móvil
Un access token que expira en 15-30 min, si se usa solo, obliga al usuario a hacer login cada vez que expira. Inaceptable en móvil.
**Solución:** Par access_token (15 min) + refresh_token (30 días). El refresh es **totalmente transparente al usuario**: la app lo renueva en segundo plano sin que él lo note. El usuario solo hace login al instalar la app o al cerrar sesión explícitamente. Igual que Letterboxd. El refresh_token se guarda en BD para poder invalidarlo en logout.

### E5 — Relaciones N:M sin tablas intermedias
El modelo original describe `listas: List<Lista>`, `reseñas: List<Reseña>` como campos, sin definir cómo se almacenan. Esto es un problema de diseño del modelo, no de la base de datos. PostgreSQL es la elección correcta: los datos son relacionales por naturaleza (usuarios siguen a usuarios, reseñas pertenecen a usuarios y obras, comentarios pertenecen a reseñas). MongoDB no simplificaría esto; solo quitaría las garantías de integridad referencial.

**Solución:** Tablas intermedias explícitas con FKs, restricciones UNIQUE donde aplique, e índices compuestos. El PRD define el modelo completo más abajo.

**Hosting:** PostgreSQL autogestionado (Docker local en desarrollo, VPS o Railway en producción).

### E6 — Ausencia de timestamps en todos los modelos
Sin `created_at` y `updated_at` en cada entidad, el feed, el diario y las estadísticas son imposibles de implementar correctamente.

### E7 — Feed sin diseño de paginación
El feed basado en actividad de seguidos necesita paginación por cursor (no por offset), porque los datos cambian constantemente. Un offset-based pagination salta registros cuando se añade contenido nuevo.

### E8 — Redis: fuera del stack
Redis no entra en el proyecto. Una cache en memoria con `TTLCache` de Python es suficiente para cachear respuestas de TMDB en esta escala. Añade complejidad operacional sin beneficio real para un TFG.

### E9 — Rate limiting ausente
El endpoint de login sin rate limiting es vulnerable a fuerza bruta. FastAPI + slowapi resuelve esto con tres líneas de código.

### E10 — Imágenes de perfil sin estrategia
Almacenar binarios en el filesystem del servidor es frágil (no persiste en deploy, no escala, path traversal). Se usará Cloudinary (tier gratuito) o se permitirá solo URL externa de avatar.

---

## Historias de usuario

### Autenticación
1. Como usuario nuevo, quiero registrarme con username, email y contraseña, para tener una cuenta en PlotSkip.
2. Como usuario registrado, quiero iniciar sesión y que la sesión persista semanas sin tener que volver a introducir mi contraseña, para no tener fricción al abrir la app.
3. Como usuario olvidadizo, quiero poder recuperar mi contraseña via email, para no perder acceso a mi cuenta.
4. Como usuario preocupado por la seguridad, quiero poder cerrar sesión y que mi refresh token quede invalidado, para que nadie más pueda acceder desde mi dispositivo.

### Descubrimiento de contenido
5. Como usuario, quiero buscar películas y series por título, para encontrar la obra que quiero reseñar o guardar.
6. Como usuario, quiero explorar una sección de contenido popular/tendencia, para descubrir obras que no conocía.
7. Como usuario, quiero ver la página de detalle de una película o serie (sinopsis, reparto, género, año, puntuación media en PlotSkip), para decidir si la veo o la añado a mi lista.
8. Como usuario, quiero filtrar búsquedas por tipo (películas / series) y por género, para encontrar contenido más relevante.

### Visionado y seguimiento
9. Como usuario, quiero marcar una obra como "vista", para que aparezca en mi historial y mis estadísticas.
10. Como usuario, quiero añadir una obra a mi watchlist, para recordar que quiero verla más adelante.
11. Como usuario, quiero registrar en mi diario el día exacto en que vi una obra, para llevar un historial temporal de mis visionados.
12. Como usuario, quiero poder registrar que he visto la misma obra varias veces en fechas distintas (re-watches), para que mi diario sea fiel a la realidad.

### Reseñas
13. Como usuario, quiero escribir una reseña de una obra con texto y puntuación (0.5 a 5 estrellas), para compartir mi opinión detallada.
14. Como usuario, quiero marcar mi reseña como "contiene spoilers", para que otros usuarios puedan elegir si la leen sin haber visto la obra.
15. Como usuario, quiero editar o eliminar una reseña que ya publiqué, para poder corregirla o retirarla.
16. Como usuario, quiero ver todas las reseñas de una obra ordenadas por utilidad o fecha, para leer opiniones sobre algo que estoy considerando ver.
17. Como usuario, quiero comentar en la reseña de otro usuario, para interactuar y debatir sobre la obra.
18. Como usuario, quiero marcar una reseña como "útil", para destacar las que me han aportado valor.

### Social
19. Como usuario, quiero buscar a otros usuarios por nombre de usuario, para encontrar amigos en la plataforma.
20. Como usuario, quiero seguir a otros usuarios, para ver su actividad en mi feed.
21. Como usuario, quiero dejar de seguir a alguien, para limpiar mi feed si ya no me interesa su actividad.
22. Como usuario, quiero ver un feed con la actividad reciente de la gente que sigo (visionados, reseñas nuevas, listas creadas), para estar al día de lo que ven mis amigos.
23. Como usuario, quiero recibir notificaciones cuando alguien empieza a seguirme, comenta mi reseña o valora mi reseña como útil, para saber que hay interacción en mi contenido.

### Listas y perfil
24. Como usuario, quiero crear listas personalizadas de obras (ej. "Mejor cine de los 90", "Pendientes de octubre"), para organizar y compartir colecciones temáticas.
25. Como usuario, quiero añadir y eliminar obras de mis listas, y reordenarlas, para mantenerlas actualizadas.
26. Como usuario, quiero ver mi perfil con mis estadísticas: obras vistas, horas estimadas de visionado, géneros más vistos, directores más vistos, media de puntuaciones dadas.
27. Como usuario, quiero editar mi perfil (nombre de usuario, bio, foto de perfil), para personalizarlo.
28. Como usuario, quiero ver el perfil público de otro usuario (sus reseñas, sus listas, sus stats básicas), para conocer sus gustos.

---

## Decisiones de implementación

### Stack tecnológico definitivo

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React Native 0.76+ con Expo SDK 52 | Multiplataforma móvil (iOS + Android) |
| Lenguaje frontend | TypeScript | Tipado, mejor tooling |
| Backend | Python 3.12 + FastAPI | Stack conocido, tipado con Pydantic, async |
| BD | PostgreSQL 16 | Datos relacionales, ACID, probado en producción a escala |
| ORM | SQLAlchemy 2.0 async + Alembic | Migrations versionadas |
| Auth | JWT (python-jose) + bcrypt | Access (15 min) + Refresh (30 días) |
| Cache API | TTLCache en memoria (cachetools) | Sin Redis. Cachea respuestas TMDB en el proceso FastAPI |
| API externa | TMDB v3 (películas y series) | Catálogo completo, gratuito, bien documentado |
| Imágenes | Cloudinary (free tier) | Para avatares de usuario |
| Email | Resend (free tier, 100/día) | Para recuperación de contraseña |

### Explicación de tecnologías del stack

**SQLAlchemy 2.0 async**
ORM de Python. Mapea tablas de PostgreSQL a clases Python. La versión async permite hacer queries sin bloquear el servidor (importante en FastAPI que es async por naturaleza). En vez de escribir SQL a mano, escribes `session.execute(select(User).where(User.email == email))`.

**Alembic**
Herramienta de migraciones para SQLAlchemy. Cuando cambias un modelo (añades una columna, creas una tabla), Alembic genera un script Python que aplica ese cambio a la BD. Funciona como git pero para el schema — cada migración tiene un ID y puedes hacer `upgrade` y `downgrade`.

**python-jose**
Librería para crear y verificar JWT (JSON Web Tokens). Los JWT son los tokens de sesión: el servidor los firma con una clave secreta, el cliente los guarda y los envía en cada request. `python-jose` hace la parte de firmar (`create_access_token`) y verificar (`decode_token`).

**passlib[bcrypt]**
bcrypt es el algoritmo estándar para hashear contraseñas. No es cifrado reversible — es un hash lento a propósito para que la fuerza bruta sea impráctica. `passlib` es el wrapper de Python que lo usa. Se guarda el hash en BD, nunca la contraseña en claro.

**pydantic-settings**
Extensión de Pydantic para leer variables de entorno desde `.env`. Se define una clase `Settings` con los campos tipados (`DATABASE_URL: str`, `SECRET_KEY: str`) y los lee automáticamente. Centraliza toda la configuración en un sitio.

**asyncpg**
Driver de PostgreSQL para Python async. SQLAlchemy lo usa por debajo cuando el engine es async. No se usa directamente en el código de aplicación.

**aiosqlite**
Driver async para SQLite. Solo entra en tests — permite usar SQLite en memoria como base de datos de pruebas sin necesidad de tener PostgreSQL corriendo en CI.

**slowapi**
Rate limiting para FastAPI. Con tres líneas limita `/auth/login` a N requests/min por IP. Previene fuerza bruta en los endpoints de autenticación.

**Resend**
Servicio de envío de emails. Tier gratuito: 100 emails/día. Se usa únicamente para el reset de contraseña. En tests se mockea para no mandar emails reales.

**httpx + pytest-asyncio**
`httpx` es el cliente HTTP recomendado por FastAPI para tests — permite hacer requests a la app sin levantar un servidor real. `pytest-asyncio` permite que los tests sean funciones `async def`, necesario porque toda la app es async.

**cachetools (TTLCache)**
Cache en memoria con expiración automática por tiempo (TTL). Se usa para cachear respuestas de TMDB en el proceso FastAPI durante 5 minutos. Evita llamadas repetidas a la API externa sin necesitar Redis.

**Cloudinary**
Servicio de almacenamiento y transformación de imágenes. Se usa para los avatares de usuario. El tier gratuito cubre las necesidades del proyecto. Evita guardar binarios en el filesystem del servidor (frágil en deploys).

### Arquitectura backend (Clean Architecture)

```
backend/
  app/
    domain/
      entities/         # Pydantic models puros (User, Review, WatchLog, etc.)
      repositories/     # Interfaces abstractas (IUserRepository, IReviewRepository)
      usecases/         # Un UseCase por operación de negocio
    data/
      repositories/     # Implementaciones SQLAlchemy de los repositorios
      models/           # SQLAlchemy ORM models
      tmdb/             # Cliente TMDB + cache en memoria
    presentation/
      routers/          # FastAPI routers (auth, movies, reviews, social, lists, users)
      schemas/          # Pydantic request/response schemas (distintos de las entities)
    infrastructure/
      database.py       # Engine + session factory
      config.py         # pydantic-settings (lee .env)
      auth.py           # JWT helpers, bcrypt
      email.py          # Cliente Resend
    main.py             # FastAPI app, CORS, rate limiting, lifespan
```

### Arquitectura frontend (Clean Architecture)

Las mismas cuatro capas que el backend, adaptadas a React Native:

- **Domain:** entidades TypeScript puras + interfaces de repositorio. Sin dependencias de React ni de la API.
- **Data:** implementaciones de los repositorios (llamadas HTTP via Axios). Sin dependencias de React.
- **Presentation:** ViewModels como custom hooks (`useReviewViewModel`, `useFeedViewModel`) + componentes React Native. Los ViewModels orquestan UseCases y exponen estado listo para renderizar.
- **Infrastructure:** configuración de Axios (interceptores para refresh token), AsyncStorage, navegación.

```
mobile/
  src/
    domain/
      entities/         # Tipos TypeScript puros (User, Review, WatchLog, Media, etc.)
      repositories/     # Interfaces (IAuthRepository, IReviewRepository, IMediaRepository, etc.)
      usecases/         # Un UseCase por operación (LoginUseCase, CreateReviewUseCase, etc.)
    data/
      repositories/     # Implementaciones HTTP de los repositorios (AuthRepository, etc.)
      api/              # Cliente Axios base + endpoints tipados
      mappers/          # Transformación de DTOs de red → entities del dominio
    presentation/
      features/
        auth/           # Screens + ViewModels de autenticación
        home/           # Feed
        search/         # Búsqueda de contenido y usuarios
        media/          # Detalle de película/serie
        review/         # Crear/editar reseña
        watchlog/       # Diario de visionado
        profile/        # Perfil propio y ajeno
        lists/          # Listas personalizadas
        notifications/  # Centro de notificaciones
      shared/
        components/     # UI components reutilizables (Button, Card, StarRating, SpoilerOverlay, etc.)
        navigation/     # React Navigation stack/tab config
    infrastructure/
      http/             # Axios instance, interceptores, refresh token logic
      storage/          # AsyncStorage wrappers (tokens, preferencias)
      config.ts         # Variables de entorno (Expo Constants)
    assets/
```

**Flujo de dependencias:** `Infrastructure → Data → Domain ← Presentation`. El dominio no conoce a nadie. Los UseCases orquestan repositorios a través de sus interfaces (inyectadas en el punto de entrada de cada feature).

### Modelo de datos

**Tablas principales:**

```sql
users (id BIGSERIAL, email TEXT UNIQUE, username TEXT UNIQUE, password_hash TEXT, display_name TEXT, bio TEXT, avatar_url TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
refresh_tokens (id, user_id FK, token_hash UNIQUE, expires_at, created_at)
password_reset_tokens (id, user_id FK, token_hash UNIQUE, expires_at, used BOOL)
follows (follower_id FK, followed_id FK, created_at) -- PK compuesta, CHECK follower != followed
media_cache (tmdb_id INT, media_type TEXT CHECK ('movie','tv'), title, poster_path, release_year SMALLINT, fetched_at) -- PK compuesta
user_media_status (id, user_id FK, tmdb_id, media_type, status TEXT CHECK ('watched','watchlist'), created_at) -- UNIQUE(user_id, tmdb_id, media_type)
watch_log (id, user_id FK, tmdb_id, media_type, watched_at DATE, rating SMALLINT 1-10, notes TEXT, created_at) -- sin UNIQUE, permite re-watches
reviews (id, user_id FK, tmdb_id, media_type, rating SMALLINT 1-10 NOT NULL, title TEXT, body TEXT NOT NULL, contains_spoilers BOOL DEFAULT FALSE, created_at, updated_at) -- UNIQUE(user_id, tmdb_id, media_type)
comments (id, review_id FK, user_id FK, body TEXT, created_at)
review_votes (user_id FK, review_id FK, created_at) -- PK compuesta
lists (id, user_id FK, name TEXT, description TEXT, is_public BOOL DEFAULT TRUE, created_at, updated_at)
list_items (list_id FK, tmdb_id, media_type, position INT, added_at) -- PK compuesta
activities (id, user_id FK, activity_type TEXT CHECK ('review','watch_log','list_created','follow'), reference_id, tmdb_id, media_type, created_at)
notifications (id, user_id FK, type TEXT CHECK ('new_follower','new_comment','review_voted'), actor_id FK, reference_id, read BOOL DEFAULT FALSE, created_at)
```

**Índices críticos:**
```sql
CREATE INDEX idx_follows_followed ON follows(followed_id);
CREATE INDEX idx_user_media_status_user ON user_media_status(user_id, status);
CREATE INDEX idx_watch_log_user_date ON watch_log(user_id, watched_at DESC);
CREATE INDEX idx_reviews_media ON reviews(tmdb_id, media_type);
CREATE INDEX idx_reviews_user ON reviews(user_id, created_at DESC);
CREATE INDEX idx_activities_feed ON activities(user_id, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_comments_review ON comments(review_id, created_at);
```

### Contratos de API

```
Auth
  POST /auth/register
  POST /auth/login          → { access_token, refresh_token }
  POST /auth/refresh        → { access_token }
  POST /auth/logout         → invalida refresh_token en BD
  POST /auth/forgot-password
  POST /auth/reset-password

Usuarios
  GET  /users/search?q=     → lista de usuarios
  GET  /users/{username}    → perfil público
  PUT  /users/me            → editar perfil propio

Social
  POST   /users/{id}/follow
  DELETE /users/{id}/follow
  GET    /feed              → actividad de seguidos (cursor pagination)
  GET    /notifications
  PUT    /notifications/{id}/read

Películas y series
  GET /media/search?q=&type=movie|tv&genre=
  GET /media/{type}/{tmdb_id}   → detalle con stats PlotSkip
  GET /media/{type}/{tmdb_id}/reviews

Visionado
  POST   /watchlog
  DELETE /watchlog/{id}
  GET    /users/{username}/watchlog
  PUT    /media/{type}/{tmdb_id}/status  → watched | watchlist | null

Reseñas
  POST   /reviews
  PUT    /reviews/{id}
  DELETE /reviews/{id}
  GET    /reviews/{id}/comments
  POST   /reviews/{id}/comments
  POST   /reviews/{id}/vote
  DELETE /reviews/{id}/vote

Listas
  POST   /lists
  PUT    /lists/{id}
  DELETE /lists/{id}
  POST   /lists/{id}/items
  DELETE /lists/{id}/items/{tmdb_id}/{media_type}
  PATCH  /lists/{id}/items/{tmdb_id}/{media_type}/position

Estadísticas
  GET /users/{username}/stats
```

### Puntuación interna
Almacenada como `SMALLINT` 1-10 (1 = 0.5★, 2 = 1★, ..., 10 = 5★). La media se devuelve como `AVG(rating) / 2.0` en escala 0.5-5.

### Estrategia de cache TMDB
- Los IDs en todas las tablas son `(tmdb_id, media_type)` — nunca se copian datos completos de TMDB en la BD
- `media_cache` guarda solo title, poster_path y release_year para el feed y actividades (sin llamar TMDB en cada item del feed)
- Para la página de detalle: se llama TMDB directamente si `fetched_at > 24h`, o se sirve desde cache si es reciente
- Cache en memoria (TTLCache, TTL 5 min) para búsquedas repetidas en la misma sesión del servidor

---

## Decisiones de testing

**Principio:** Tests de comportamiento externo, no de implementación interna.

**Backend (pytest + httpx AsyncClient contra BD real en SQLite):**
- Auth: registro con email duplicado devuelve 409, login con contraseña incorrecta devuelve 401, refresh de token devuelve nuevo access_token, logout invalida el refresh_token
- Reviews: dos reseñas del mismo usuario para la misma obra devuelven 409, edición por no-autor devuelve 403
- Social: feed vacío antes de seguir a alguien, feed con actividad tras seguir, `CHECK follower != followed` se cumple
- Feed: paginación por cursor devuelve resultados sin saltos ni duplicados
- TMDB service: mock del cliente HTTP externo (solo este)

**Frontend (Jest + RNTL):**
- Flujo de login completo (campos, submit, navegación al feed)
- Reseña con spoilers muestra overlay antes de revelar texto
- Feed renderiza items y paginación

---

## Fuera de alcance

- **Web**: solo móvil en esta versión
- **Push notifications nativas** (APNs/FCM): polling in-app suficiente por ahora
- **Sistema de recomendaciones ML**: "popular entre amigos" es una query SQL, no ML
- **Logros/badges**: gamificación superficial descartada
- **Soporte offline**: requiere conexión para todo
- **Panel de administración**: sin moderación en esta versión
- **OAuth (Google/Apple login)**: solo email/contraseña
- **Redis**: fuera del stack
- **Seguimiento por episodio/temporada**: las series se reseñan como unidad completa
- **Exportación de datos**

---

## Principios de desarrollo transversales

Aplican a todo el código, sin excepciones:

1. **Extensibilidad.** Se añadirán features no planificadas. Cada módulo tiene una responsabilidad clara y no asume que "solo habrá este caso". Sin hardcodes ni lógica acoplada a un único tipo de entidad.

2. **Componentes reutilizables.** En frontend, cualquier componente que pueda aparecer en más de una pantalla va a `shared/components/`. En backend, lógica transversal (paginación, error handling, cache) va en utilidades compartidas.

3. **Separación de capas.** Presentación no conoce la BD. Datos no conocen la UI. Los contratos entre capas (schemas Pydantic, tipos TypeScript) son explícitos.

4. **Sin atajos de diseño.** No arrays JSON donde debe haber tablas relacionales. No lógica de negocio en routers. No estado global donde basta estado local.

---

## Notas

### Lecciones del mercado (Letterboxd)
Problemas de UX del competidor que PlotSkip debe evitar:
- Acciones básicas (puntuar, reseñar) no deben estar ocultas → visibles desde la pantalla de detalle
- La interfaz no debe cambiar radicalmente entre versiones → estabilidad como valor
- Sin localización al español → PlotSkip en español de España desde el día 0

### Atribución TMDB
Los ToS de TMDB requieren: "This product uses the TMDB API but is not endorsed or certified by TMDB". Debe aparecer en ajustes/créditos de la app.

### API key TMDB
Ya disponible (ver documento TFG.pdf). Almacenar en `.env`, nunca en el repositorio.
