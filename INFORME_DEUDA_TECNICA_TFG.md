# Informe de Deuda Técnica, Refactorización y Plan de Mitigación

He auditado el repositorio completo `mobile` + `backend`. La foto general es defendible para un TFG si se presenta como prototipo funcional con decisiones de alcance, pero hay deuda técnica clara en consistencia UX, desacoplamiento de capas y endurecimiento del flujo de sesión.

No he podido ejecutar la suite automática en este entorno porque no están disponibles `pytest` ni el módulo instalado.

## 1. Inconsistencias de UX/UI y Reglas de Negocio

### 1.1 Escalas de puntuación mezcladas según pantalla

**Descripción del Fallo:** La app muestra la misma idea de "nota" con escalas distintas. En [HomeScreen.tsx](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/home/HomeScreen.tsx:24) y [ProfileScreen.tsx](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/profile/ProfileScreen.tsx:574) TMDB se presenta como `/ 5`, mientras que en [DetailScreen.tsx](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/detail/DetailScreen.tsx:138) se muestra el valor crudo de TMDB y además las reseñas del usuario se editan en estrellas `0.5-5` aunque la API trabaja `1-10` vía [media.ts](/C:/Users/Juan/Documents/PlotSkip/mobile/src/domain/entities/media.ts:109).

**Impacto de cara al Tribunal:** Rompe la consistencia heurística de Nielsen y debilita la trazabilidad de reglas de negocio porque el modelo mental del usuario cambia por pantalla.

**Solución Técnica (Refactorización):** Definir un `RatingFormatter` único y un `RatingScale` explícito. TMDB debería normalizarse siempre igual en frontend y las valoraciones del usuario deberían tener un único contrato visual y un único mapper centralizado.

**Justificación de Defensa (El "Salvavidas"):** "La API ya separa nota externa y nota del usuario; la deuda está en la capa de presentación, donde faltó consolidar un formateador único de métricas antes del cierre del prototipo."

### 1.2 Nomenclatura visual híbrida español/inglés

**Descripción del Fallo:** La interfaz mezcla etiquetas como `Watchlist`, `Favorites`, `Recent activity` y `Social` con `Perfil`, `Diario` y `Reseña` en [DetailScreen.tsx](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/detail/DetailScreen.tsx:134), [ProfileScreen.tsx](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/profile/ProfileScreen.tsx:142) y [SocialScreen.tsx](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/social/SocialScreen.tsx:33).

**Impacto de cara al Tribunal:** Debilita cohesión visual, localización y consistencia terminológica del dominio.

**Solución Técnica (Refactorización):** Extraer un catálogo de copies por idioma y un glosario de dominio. Elegir una sola convención: todo en español o todo en inglés.

**Justificación de Defensa (El "Salvavidas"):** "Priorizamos validar flujo y navegación; la internacionalización y unificación terminológica quedaron identificadas como deuda no funcional de presentación."

### 1.3 La métrica `watched_count` se rotula como "Películas" aunque cuenta todo

**Descripción del Fallo:** En [ProfileScreen.tsx](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/profile/ProfileScreen.tsx:351) se muestra `stats.watched_count` bajo la etiqueta `Peliculas`, pero en backend esa métrica se calcula como `len(watch_logs)` para cualquier medio en [user_stats_aggregator.py](/C:/Users/Juan/Documents/PlotSkip/backend/app/domain/services/user_stats_aggregator.py:37) y el contrato no distingue películas de series en [social.py](/C:/Users/Juan/Documents/PlotSkip/backend/app/domain/entities/social.py:31).

**Impacto de cara al Tribunal:** Es una inconsistencia semántica entre dato y etiqueta; te pueden señalar que la UI miente sobre la regla de negocio.

**Solución Técnica (Refactorización):** Renombrar el label a `Visionados` o ampliar el backend con `watched_movies_count` y `watched_tv_count`.

**Justificación de Defensa (El "Salvavidas"):** "El agregado backend es correcto; el fallo está en la rotulación del componente, no en la consistencia del dato persistido."

## 2. Arquitectura, Clean Architecture y Buenas Prácticas

### 2.1 El dominio depende directamente de infraestructura

**Descripción del Fallo:** Casos de uso del dominio importan `auth` y `config` de infraestructura, por ejemplo [login.py](/C:/Users/Juan/Documents/PlotSkip/backend/app/domain/usecases/auth/login.py:8), [refresh.py](/C:/Users/Juan/Documents/PlotSkip/backend/app/domain/usecases/auth/refresh.py:7), [forgot_password.py](/C:/Users/Juan/Documents/PlotSkip/backend/app/domain/usecases/auth/forgot_password.py:6) y [reset_password.py](/C:/Users/Juan/Documents/PlotSkip/backend/app/domain/usecases/auth/reset_password.py:8).

**Impacto de cara al Tribunal:** Viola la Dependency Rule y el principio de inversión de dependencias de SOLID. La capa de negocio conoce detalles técnicos concretos.

**Solución Técnica (Refactorización):** Introducir interfaces como `ITokenService`, `IPasswordHasher`, `ITokenGenerator` y `IClock`, inyectadas desde un composition root.

**Justificación de Defensa (El "Salvavidas"):** "La separación por carpetas existe, pero la inversión de dependencias quedó incompleta; es una deuda consciente de ensamblado, no una ausencia de modelo de dominio."

### 2.2 Los routers actúan como composition root improvisado y acoplado

**Descripción del Fallo:** Los endpoints crean repositorios concretos y casos de uso en línea en [auth.py](/C:/Users/Juan/Documents/PlotSkip/backend/app/presentation/routers/auth.py:47), [auth.py](/C:/Users/Juan/Documents/PlotSkip/backend/app/presentation/routers/auth.py:67), [auth.py](/C:/Users/Juan/Documents/PlotSkip/backend/app/presentation/routers/auth.py:79) y [dependencies.py](/C:/Users/Juan/Documents/PlotSkip/backend/app/presentation/dependencies.py:38).

**Impacto de cara al Tribunal:** Rompe el desacoplamiento entre presentación y ensamblado; dificulta tests unitarios puros y cambia demasiados puntos cuando cambia una dependencia.

**Solución Técnica (Refactorización):** Crear providers o factories por caso de uso y mover el cableado a una capa de bootstrap o DI.

**Justificación de Defensa (El "Salvavidas"):** "Para un prototipo prioricé explicitud sobre un contenedor DI completo; la siguiente iteración separaría el ensamblado para reducir acoplamiento."

### 2.3 God files y mezcla de demasiadas responsabilidades

**Descripción del Fallo:** Hay pantallas y view models con tamaño y responsabilidad excesivos: [DetailScreen.tsx](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/detail/DetailScreen.tsx:1) tiene 1384 líneas, [HomeScreen.tsx](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/home/HomeScreen.tsx:1) 1006, [ProfileScreen.tsx](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/profile/ProfileScreen.tsx:1) 1023, y [ProfileViewModel.ts](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/profile/ProfileViewModel.ts:1) 588.

**Impacto de cara al Tribunal:** Huele a violación de SRP, alta carga cognitiva y mantenibilidad baja. Un cambio pequeño amplifica riesgo.

**Solución Técnica (Refactorización):** Extraer subcomponentes como `ReviewCard`, `FavoritePicker`, `StatsBar` y `ActivityCard`, y dividir hooks por caso de uso como `useProfileStats`, `useFavoritesEditor` y `useReviewThread`.

**Justificación de Defensa (El "Salvavidas"):** "El prototipo consolidó lógica para iterar rápido; precisamente por eso ya tengo localizadas las fronteras naturales de extracción para una versión de producción."

### 2.4 Duplicidad de UI y manejo de errores de sesión

**Descripción del Fallo:** El renderizado del feed social está prácticamente duplicado entre [HomeScreen.tsx](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/home/HomeScreen.tsx:140) y [SocialScreen.tsx](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/social/SocialScreen.tsx:164). Además, el patrón `router.replace('/login')` aparece repetido en muchos view models, por ejemplo [ProfileViewModel.ts](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/profile/ProfileViewModel.ts:140) y [PublicProfileViewModel.ts](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/social/PublicProfileViewModel.ts:84).

**Impacto de cara al Tribunal:** Viola DRY y aumenta el riesgo de comportamiento divergente entre pantallas y flujos de autenticación.

**Solución Técnica (Refactorización):** Crear un componente compartido `ActivityFeedCard` y un `useAuthGuard` o middleware de navegación centralizado para errores `401`.

**Justificación de Defensa (El "Salvavidas"):** "La duplicación responde a iteración funcional rápida; ya está lo bastante madura como para consolidarse sin riesgo de rediseño conceptual."

### 2.5 Tipos de composición y enriquecimiento definidos dentro de lógica de pantalla

**Descripción del Fallo:** En [PublicProfileViewModel.ts](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/social/PublicProfileViewModel.ts:13) se declaran `PublicWatchlistItem` y `PublicDiaryItem` dentro del propio view model, y además se enriquecen con llamadas `getMediaDetail` una a una en [PublicProfileViewModel.ts](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/social/PublicProfileViewModel.ts:126) y [PublicProfileViewModel.ts](/C:/Users/Juan/Documents/PlotSkip/mobile/src/presentation/features/social/PublicProfileViewModel.ts:154).

**Impacto de cara al Tribunal:** Es un ejemplo claro de DTOs "flotantes" y de lógica de composición incrustada en presentación. También introduce un patrón N+1 en cliente.

**Solución Técnica (Refactorización):** Mover estos contratos a `domain/entities` o `data/dto`, y exponer desde backend endpoints ya enriquecidos para watchlist y diario público.

**Justificación de Defensa (El "Salvavidas"):** "El enriquecimiento en cliente me permitió validar rápido la UX social; para producción lo movería al backend para reducir latencia y limpiar la capa de presentación."

## 3. Seguridad y Gestión de Estado (Tokens)

### 3.1 CORS completamente abierto en backend

**Descripción del Fallo:** El backend permite `allow_origins=["*"]`, `allow_methods=["*"]` y `allow_headers=["*"]` en [main.py](/C:/Users/Juan/Documents/PlotSkip/backend/app/main.py:56).

**Impacto de cara al Tribunal:** Te pueden criticar endurecimiento insuficiente para despliegue real y falta de principio de mínimo privilegio.

**Solución Técnica (Refactorización):** Configurar whitelist por entorno, restringir métodos y cabeceras, y parametrizar orígenes desde settings.

**Justificación de Defensa (El "Salvavidas"):** "Es una configuración de desarrollo para facilitar pruebas cruzadas durante el prototipo; en producción se cerraría por entorno con allowlist explícita."

### 3.2 Almacenamiento de tokens con fallback inseguro

**Descripción del Fallo:** Si `SecureStore` no está disponible, los tokens caen a `AsyncStorage` en [tokenStorage.ts](/C:/Users/Juan/Documents/PlotSkip/mobile/src/infrastructure/storage/tokenStorage.ts:7). Eso deja credenciales persistidas sin garantías fuertes de protección en reposo.

**Impacto de cara al Tribunal:** Debilita la confidencialidad del refresh token y expone una crítica clásica de mobile security.

**Solución Técnica (Refactorización):** Fallar en modo seguro cuando no exista almacén cifrado, o encapsular una estrategia que exija almacenamiento respaldado por keystore o secure enclave.

**Justificación de Defensa (El "Salvavidas"):** "Priorizamos compatibilidad del prototipo; la mitigación obvia para producción es exigir almacenamiento seguro y deshabilitar sesión persistente en dispositivos no compatibles."

### 3.3 La sesión se borra ante cualquier fallo de refresh, incluso transitorio

**Descripción del Fallo:** `AuthSessionManager` limpia tokens en cualquier excepción durante refresh en [AuthSessionManager.ts](/C:/Users/Juan/Documents/PlotSkip/mobile/src/infrastructure/auth/AuthSessionManager.ts:96), y el interceptor reintenta automáticamente en [api.ts](/C:/Users/Juan/Documents/PlotSkip/mobile/src/infrastructure/http/api.ts:28). Un timeout o un `500` puede terminar en logout efectivo.

**Impacto de cara al Tribunal:** No rompe seguridad, pero sí robustez del estado de sesión. Es un fallo de resiliencia que puede degradar gravemente la UX.

**Solución Técnica (Refactorización):** Distinguir entre `401/403` y errores de red o `5xx`; solo invalidar sesión cuando el refresh token sea realmente inválido o expirado, y usar retry o backoff para transitorios.

**Justificación de Defensa (El "Salvavidas"):** "La rotación y persistencia ya están resueltas; lo pendiente es afinar la política de recuperación ante fallos transitorios para no penalizar la experiencia."
