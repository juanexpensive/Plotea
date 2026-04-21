# Password Reset Test Views Details

## Repository Context

- Relevant files:
- `backend/app/presentation/routers/auth.py`
- `backend/app/infrastructure/email.py`
- `backend/app/main.py`
- `tests/test_password_reset.py`
- Existing patterns to follow:
- Router-driven backend with JSON endpoints
- Minimal infrastructure wrappers behind interfaces
- Constraints:
- Evitar meter un frontend nuevo solo para probar reset
- Mantener el cambio pequeno y testeable

## Assumptions To Verify

- `PASSWORD_RESET_BASE_URL` apuntara a la vista HTML de reset para pruebas manuales
- Las vistas de prueba pueden servirse desde FastAPI sin introducir Jinja

## Phase Notes

### Phase 1

- Detailed tasks:
- Definir rutas HTML separadas de los endpoints JSON
- Mantener JS inline para evitar tooling extra
- Findings:
- El backend actual no sirve vistas ni estaticos
- Tests:
- N/A
- Review notes:
- Una pagina forgot y otra reset son suficientes
- Status:
- completed

### Phase 2

- Detailed tasks:
- Crear helper para render HTML
- Crear CSS minimo compartido
- Montar estaticos en FastAPI
- Findings:
- La opcion mas simple es HTMLResponse + StaticFiles
- No ha hecho falta introducir Jinja ni formularios server-side
- Tests:
- Verificar GET de vistas
- Review notes:
- Evitar templates y dependencias nuevas
- Status:
- completed

### Phase 3

- Detailed tasks:
- Ajustar copy y enlaces para usar la misma base URL
- Mantener `PASSWORD_RESET_BASE_URL` como configuracion de la vista de reset
- Findings:
- La vista de reset queda preparada para recibir `?token=...`
- La vista de forgot permite probar el endpoint manualmente desde navegador
- Tests:
- Flujo principal cubierto por tests JSON
- Render de vistas cubierto por tests GET
- Review notes:
- Confirmar instrucciones de `.env`
- Status:
- completed

### Phase 4

- Detailed tasks:
- Ejecutar pytest relevante
- Revisar claridad y complejidad
- Findings:
- `21` tests de auth pasando
- La solucion sigue siendo de prueba y no sustituye las pantallas reales mobile
- Tests:
- `python -m pytest ..\\tests\\test_register.py ..\\tests\\test_login.py ..\\tests\\test_refresh_logout.py ..\\tests\\test_password_reset.py -q`
- Review notes:
- Sin findings mayores en la pasada de QA interna
- Status:
- completed

### Phase 5

- Detailed tasks:
- Crear screens `forgot-password` y `reset-password` en Expo Router
- Mover el acceso desde login a navegacion nativa
- Hacer que el email use `plotskip://reset-password`
- Findings:
- El `scheme` `plotskip` ya existia en `app.json`, asi que no ha hecho falta tocar configuracion de Expo
- Mantener el token editable en la screen de reset da fallback si el deep link falla
- Tests:
- `npm exec tsc -- --noEmit`
- `python -m pytest ..\\tests\\test_password_reset.py -q`
- Review notes:
- Reiniciar backend para que relea `PASSWORD_RESET_BASE_URL`
- Status:
- completed

## Deferred Work

- Integrar el flujo final en mobile
- Reemplazar la UI de prueba por pantallas reales de producto

## Final Confidence Check

- Confidence score:
- 8/10
- Likely code review callouts:
- Las vistas HTML son deliberadamente temporales y convendria etiquetarlas como flujo de prueba
- El enlace real del email depende de configurar bien `PASSWORD_RESET_BASE_URL`
- En Expo Go, el comportamiento del deep link puede variar mas que en una build nativa
- Residual risks:
- No se ha hecho una llamada real a Resend en esta sesion
- El flujo visual final en mobile ya existe, pero falta pulir la UX
