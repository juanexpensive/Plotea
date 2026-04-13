# TMDB API — Referencia para PlotSkip

> Fecha: 2026-04-13  
> Versión API: v3  
> Docs oficiales: https://developer.themoviedb.org/reference/intro/getting-started

---

## Autenticación

Todas las requests requieren un Bearer token en el header:

```http
Authorization: Bearer <TMDB_API_KEY>
```

La `TMDB_API_KEY` ya está configurada en `backend/app/infrastructure/config.py` como variable de entorno. En el backend (FastAPI + httpx), el cliente debe incluir este header en cada request.

```python
# Ejemplo de cliente httpx reutilizable
import httpx
from app.infrastructure.config import settings

tmdb_client = httpx.AsyncClient(
    base_url="https://api.themoviedb.org/3",
    headers={"Authorization": f"Bearer {settings.TMDB_API_KEY}"},
)
```

---

## Base URL

```
https://api.themoviedb.org/3
```

---

## Imágenes

Las rutas de imagen que devuelve TMDB (ej. `/poster_path`) son relativas. Para construir la URL completa:

```
https://image.tmdb.org/t/p/{size}{file_path}
```

### Tamaños disponibles

| Uso           | Tamaño recomendado | Ejemplo                                          |
|---------------|--------------------|--------------------------------------------------|
| Poster (lista)| `w342`             | `https://image.tmdb.org/t/p/w342/abc.jpg`        |
| Poster (detalle)| `w500`           | `https://image.tmdb.org/t/p/w500/abc.jpg`        |
| Backdrop      | `w780`             | `https://image.tmdb.org/t/p/w780/abc.jpg`        |
| Backdrop HD   | `w1280`            | `https://image.tmdb.org/t/p/w1280/abc.jpg`       |
| Original      | `original`         | `https://image.tmdb.org/t/p/original/abc.jpg`    |

---

## Endpoints

### 1. Buscar película

```
GET /search/movie
```

| Parámetro            | Tipo    | Req. | Default | Descripción                        |
|----------------------|---------|------|---------|------------------------------------|
| `query`              | string  | ✅   | —       | Texto de búsqueda                  |
| `page`               | int     | ❌   | 1       | Página de resultados               |
| `language`           | string  | ❌   | en-US   | Idioma de respuesta                |
| `primary_release_year` | string | ❌  | —       | Filtrar por año de estreno         |
| `include_adult`      | boolean | ❌   | false   | Incluir contenido adulto           |
| `region`             | string  | ❌   | —       | Código ISO-3166-1 de región        |

**Respuesta:**
```json
{
  "page": 1,
  "results": [
    {
      "id": 9806,
      "title": "The Incredibles",
      "original_title": "The Incredibles",
      "overview": "Sinopsis...",
      "release_date": "2004-10-27",
      "poster_path": "/2LqaLgk4Z226KkgPJuiOQ58wvrm.jpg",
      "backdrop_path": "/abc.jpg",
      "genre_ids": [16, 28, 35],
      "popularity": 71.477,
      "vote_average": 7.702,
      "vote_count": 16162,
      "original_language": "en",
      "adult": false,
      "video": false
    }
  ],
  "total_pages": 4,
  "total_results": 80
}
```

---

### 2. Buscar serie de TV

```
GET /search/tv
```

| Parámetro            | Tipo    | Req. | Default | Descripción                        |
|----------------------|---------|------|---------|------------------------------------|
| `query`              | string  | ✅   | —       | Texto de búsqueda                  |
| `page`               | int     | ❌   | 1       | Página de resultados               |
| `language`           | string  | ❌   | en-US   | Idioma de respuesta                |
| `first_air_date_year`| int     | ❌   | —       | Filtrar por año de primera emisión |
| `include_adult`      | boolean | ❌   | false   | Incluir contenido adulto           |

**Respuesta:**
```json
{
  "page": 1,
  "results": [
    {
      "id": 1396,
      "name": "Breaking Bad",
      "original_name": "Breaking Bad",
      "overview": "Sinopsis...",
      "first_air_date": "2008-01-20",
      "poster_path": "/abc.jpg",
      "backdrop_path": "/abc.jpg",
      "genre_ids": [18, 80],
      "popularity": 250.5,
      "vote_average": 8.9,
      "vote_count": 13000,
      "original_language": "en",
      "origin_country": ["US"],
      "adult": false
    }
  ],
  "total_pages": 1,
  "total_results": 5
}
```

---

### 3. Detalle de película

```
GET /movie/{movie_id}
```

| Parámetro            | Tipo   | Req. | Default | Descripción                                        |
|----------------------|--------|------|---------|----------------------------------------------------|
| `movie_id`           | int    | ✅   | —       | ID de la película en TMDB                          |
| `language`           | string | ❌   | en-US   | Idioma de respuesta                                |
| `append_to_response` | string | ❌   | —       | Endpoints adicionales separados por coma (max 20)  |

**Campos de `append_to_response` más útiles:** `credits`, `videos`, `images`, `recommendations`, `similar`

**Respuesta (campos clave):**
```json
{
  "id": 9806,
  "title": "The Incredibles",
  "original_title": "The Incredibles",
  "overview": "Sinopsis...",
  "release_date": "2004-10-27",
  "runtime": 115,
  "status": "Released",
  "poster_path": "/abc.jpg",
  "backdrop_path": "/abc.jpg",
  "genre_ids": [16, 28, 35],
  "genres": [{"id": 16, "name": "Animation"}],
  "popularity": 71.477,
  "vote_average": 7.702,
  "vote_count": 16162,
  "original_language": "en",
  "budget": 92000000,
  "revenue": 631442092,
  "adult": false
}
```

---

### 4. Detalle de serie de TV

```
GET /tv/{series_id}
```

| Parámetro            | Tipo   | Req. | Default | Descripción                                        |
|----------------------|--------|------|---------|----------------------------------------------------|
| `series_id`          | int    | ✅   | —       | ID de la serie en TMDB                             |
| `language`           | string | ❌   | en-US   | Idioma de respuesta                                |
| `append_to_response` | string | ❌   | —       | Endpoints adicionales separados por coma (max 20)  |

**Respuesta (campos clave):**
```json
{
  "id": 1396,
  "name": "Breaking Bad",
  "original_name": "Breaking Bad",
  "overview": "Sinopsis...",
  "first_air_date": "2008-01-20",
  "status": "Ended",
  "poster_path": "/abc.jpg",
  "backdrop_path": "/abc.jpg",
  "genres": [{"id": 18, "name": "Drama"}],
  "popularity": 250.5,
  "vote_average": 8.9,
  "vote_count": 13000,
  "original_language": "en",
  "origin_country": ["US"],
  "adult": false
}
```

---

### 5. Créditos de película

```
GET /movie/{movie_id}/credits
```

| Parámetro  | Tipo   | Req. | Descripción            |
|------------|--------|------|------------------------|
| `movie_id` | int    | ✅   | ID de la película      |
| `language` | string | ❌   | Idioma de respuesta    |

**Respuesta:**
```json
{
  "id": 9806,
  "cast": [
    {
      "id": 123,
      "name": "Craig T. Nelson",
      "character": "Bob Parr / Mr. Incredible",
      "order": 0,
      "profile_path": "/abc.jpg"
    }
  ],
  "crew": [
    {
      "id": 456,
      "name": "Brad Bird",
      "job": "Director",
      "department": "Directing",
      "profile_path": "/abc.jpg"
    }
  ]
}
```

---

### 6. Créditos de serie de TV

```
GET /tv/{series_id}/credits
```

| Parámetro   | Tipo   | Req. | Descripción         |
|-------------|--------|------|---------------------|
| `series_id` | int    | ✅   | ID de la serie      |
| `language`  | string | ❌   | Idioma de respuesta |

**Respuesta:** misma estructura que créditos de película.

---

### 7. Trending (películas + series)

```
GET /trending/all/{time_window}
```

| Parámetro     | Tipo   | Req. | Valores        | Default |
|---------------|--------|------|----------------|---------|
| `time_window` | string | ✅   | `day`, `week`  | `day`   |
| `language`    | string | ❌   | ISO 639-1      | en-US   |

**Respuesta:** igual al formato de búsqueda. Puede mezclar películas y series; diferenciados por el campo `media_type: "movie"` o `"tv"`.

---

### 8. Películas populares

```
GET /movie/popular
```

| Parámetro  | Tipo   | Req. | Default | Descripción           |
|------------|--------|------|---------|-----------------------|
| `page`     | int    | ❌   | 1       | Página                |
| `language` | string | ❌   | en-US   | Idioma de respuesta   |
| `region`   | string | ❌   | —       | Código ISO-3166-1     |

**Respuesta:** mismo formato que `/search/movie`.

---

### 9. Series populares de TV

```
GET /tv/popular
```

| Parámetro  | Tipo   | Req. | Default |
|------------|--------|------|---------|
| `page`     | int    | ❌   | 1       |
| `language` | string | ❌   | en-US   |

**Respuesta:** mismo formato que `/search/tv`.

---

### 10. Discover — películas por filtros

```
GET /discover/movie
```

Parámetros más útiles para PlotSkip:

| Parámetro          | Tipo   | Descripción                                              |
|--------------------|--------|----------------------------------------------------------|
| `sort_by`          | string | `popularity.desc`, `vote_average.desc`, `release_date.desc`, etc. |
| `with_genres`      | string | IDs de géneros separados por `,` (AND) o `\|` (OR)      |
| `without_genres`   | string | IDs de géneros a excluir                                 |
| `vote_average.gte` | float  | Rating mínimo                                            |
| `vote_average.lte` | float  | Rating máximo                                            |
| `vote_count.gte`   | int    | Mínimo de votos (para evitar resultados poco conocidos)  |
| `primary_release_year` | int | Año de estreno exacto                                 |
| `with_cast`        | string | IDs de actores (AND con `,`, OR con `\|`)                |
| `page`             | int    | Página (default 1)                                       |
| `language`         | string | Idioma (default en-US)                                   |

---

### 11. Lista de géneros (películas)

```
GET /genre/movie/list
```

| Parámetro  | Tipo   | Default |
|------------|--------|---------|
| `language` | string | en      |

**Respuesta:**
```json
{
  "genres": [
    {"id": 28, "name": "Action"},
    {"id": 12, "name": "Adventure"},
    {"id": 16, "name": "Animation"},
    {"id": 35, "name": "Comedy"},
    {"id": 80, "name": "Crime"},
    {"id": 18, "name": "Drama"},
    {"id": 27, "name": "Horror"},
    {"id": 10749, "name": "Romance"},
    {"id": 878, "name": "Science Fiction"},
    {"id": 53, "name": "Thriller"}
  ]
}
```

### Lista de géneros (series)

```
GET /genre/tv/list
```

Misma estructura de respuesta.

---

## Estrategia de caché para PlotSkip

Según el PRD, el backend debe guardar solo `tmdb_id` + `media_type` en la BD y cachear datos básicos con TTL. Esquema recomendado:

```
media_cache table:
  tmdb_id       INTEGER
  media_type    ENUM('movie', 'tv')
  title         TEXT
  poster_path   TEXT
  overview      TEXT
  release_date  TEXT
  vote_average  FLOAT
  cached_at     TIMESTAMP
  PRIMARY KEY (tmdb_id, media_type)
```

El backend hace la request a TMDB solo si `cached_at` es nulo o ha expirado (TTL sugerido: 24h para detalles, 1h para trending/popular).

---

## Resumen de endpoints por feature de PlotSkip

| Feature                       | Endpoint TMDB                          |
|-------------------------------|----------------------------------------|
| Buscar película/serie         | `/search/movie`, `/search/tv`          |
| Ver detalle de película       | `/movie/{id}?append_to_response=credits` |
| Ver detalle de serie          | `/tv/{id}?append_to_response=credits`  |
| Feed de trending              | `/trending/all/week`                   |
| Descubrir por género          | `/discover/movie` con `with_genres`    |
| Populares (home screen)       | `/movie/popular`, `/tv/popular`        |
| Géneros para filtros          | `/genre/movie/list`, `/genre/tv/list`  |
| Construir imagen de poster    | `https://image.tmdb.org/t/p/w342{poster_path}` |
