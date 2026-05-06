# Fase 5 - Comentarios y votos utiles

## Objetivo

- Implementar interaccion social basica sobre resenas existentes con un vertical slice completo: contratos y tests backend, persistencia y endpoints, integracion mobile en detalle, y cierre con review/QA.

## Alcance

- En alcance:
- Modelo `comments` con replies de un solo nivel y soft delete
- Modelo `review_votes` para marcar resenas como utiles
- Endpoints para listar/comentar/borrar comentario y votar/quitar voto
- Agregados sociales en `ReviewResponse`: `comment_count`, `helpful_votes`, `has_voted`
- Integracion mobile en pantalla de detalle con carga de comentarios bajo demanda
- Fuera de alcance:
- Edicion de comentarios
- Ordenar resenas por utilidad
- Notificaciones por comentarios o votos
- Pantalla separada de comentarios o tests frontend con Jest

## Fases

### Fase 1: Contratos y tests backend

- Goal: fijar el comportamiento esperado de comentarios y votos desde tests y docs
- Expected files or systems: `tests/test_reviews.py`, `implementation.md`, `implementation_details.md`
- Validation: los tests describen replies, soft delete, autovoto prohibido, voto unico y agregados sociales
- Review gate: el contrato backend queda cerrado antes de implementar persistencia
- Estado: completada

### Fase 2: Dominio, persistencia y endpoints

- Goal: implementar comentarios y votos en backend con Clean Architecture
- Expected files or systems: modelos, migracion, repositorios, casos de uso, schemas y router de resenas
- Validation: `pytest tests/test_reviews.py`
- Review gate: las reglas viven en casos de uso y los agregados sociales no se calculan en el router
- Estado: completada

### Fase 3: Integracion mobile en detalle

- Goal: permitir votar y gestionar comentarios desde detalle sin cargar todos los hilos de golpe
- Expected files or systems: entidades y repositorio mobile, `DetailViewModel`, `DetailScreen`
- Validation: `npx tsc --noEmit`
- Review gate: una sola caja de reply activa, own vote oculto y loading/error por resena
- Estado: completada

### Fase 4: QA, self-review y riesgos

- Goal: revisar diffs, ejecutar checks y registrar riesgos reales
- Expected files or systems: docs de implementacion, backend y mobile
- Validation: backend y mobile pasan checks previstos y los riesgos quedan anotados
- Review gate: confidence check y trabajo diferido documentado
- Estado: completada

## Cierre

- Backend validado con `pytest tests/`
- Mobile validado con `npx tsc --noEmit`
- Comentarios y votos integrados en detalle con carga bajo demanda por resena
