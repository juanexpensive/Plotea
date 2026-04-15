# Diagnóstico de versiones y conflictos

## Versiones actuales (resuelto ✅)

| Herramienta | Versión | Estado |
|---|---|---|
| Node.js | 20.20.2 (via nvm-windows) | ✅ |
| Expo SDK | 54.0.33 | ✅ |
| expo-router | 6.0.23 | ✅ |
| React Native | 0.81.5 | ✅ |
| @expo/ngrok | 4.1.3 (global) | ✅ Con Node 20 |
| ngrok MSIX | 3.36.1 | ✅ Funciona solo |

---

## Conflicto 1 — Node 24 + @expo/ngrok (RESUELTO)

**Error:** `Cannot read properties of undefined (reading 'body')`

**Causa:** `@expo/ngrok@4.1.3` no es compatible con Node 24. Expo SDK 54 soporta oficialmente Node 18 y 20.

**Solución aplicada:** instalar nvm-windows y bajar a Node 20 LTS.

```bash
# 1. Descargar nvm-setup.exe desde github.com/coreybutler/nvm-windows/releases
# 2. Cerrar VSCode y todas las terminales antes de instalar
# 3. El instalador desinstala el Node.js existente automáticamente
nvm install 20
nvm use 20
node -v  # v20.x.x

# Reinstalar @expo/ngrok global:
npm install -g @expo/ngrok@4.1.3

# Reinstalar dependencias del proyecto móvil:
cd mobile && rm -rf node_modules && npm install
```

---

## Conflicto 2 — authtoken de @expo/ngrok vacío (RESUELTO)

**Error:** `CommandError: ngrok tunnel took too long to connect.`

**Causa:** `@expo/ngrok` y el ngrok MSIX son dos instalaciones separadas con configs independientes.
- **ngrok MSIX** → config en `AppData/Local/Packages/ngrok.../ngrok.yml`
- **@expo/ngrok** → config en `~/.expo/ngrok.yml`

Aunque el ngrok MSIX tenga authtoken, `@expo/ngrok` necesita el suyo propio.

**Solución aplicada:** configurar el authtoken para `@expo/ngrok`:

```bash
npx ngrok authtoken TU_TOKEN
```

> Token disponible en: dashboard.ngrok.com/get-started/your-authtoken

---

## Pasos completos para tunnel desde cero en un PC nuevo

1. Instalar nvm-windows → `nvm install 20` → `nvm use 20`
2. `npm install -g @expo/ngrok@4.1.3`
3. `npx ngrok authtoken TU_TOKEN`
4. `cd mobile && npm install`
5. `npx expo start --tunnel --clear`

---

## Por qué el emulador evita todo esto

Con el emulador Android no necesitas tunnel:
- Expo se conecta por USB/local directamente
- El emulador accede al backend via `10.0.2.2:8000` (ya configurado en `api.ts`)
- Cero ngrok, cero tunnel, cero conflictos de versión
