# Diagnóstico de versiones y conflictos

## Versiones actuales

| Herramienta | Versión | Estado |
|---|---|---|
| Node.js | 24.14.0 | ⚠️ Demasiado nueva |
| Expo SDK | 54.0.33 | ✅ |
| expo-router | 6.0.23 | ✅ |
| React Native | 0.81.5 | ✅ |
| @expo/ngrok | 4.1.3 (global) | ❌ Incompatible con Node 24 |
| ngrok MSIX | 3.36.1 | ✅ Funciona solo |

---

## Conflicto principal — Node 24 + @expo/ngrok

`@expo/ngrok@4.1.3` usa internamente una versión de ngrok que **no es compatible con Node 24**. El error `Cannot read properties of undefined (reading 'body')` es exactamente esto. Expo SDK 54 soporta oficialmente Node **18 y 20**. Node 24 es demasiado nuevo.

**Solución a futuro:** bajar a Node 20 LTS usando `nvm`:
```bash
# Instalar nvm-windows desde github.com/coreybutler/nvm-windows
nvm install 20
nvm use 20
```

---

## Conflicto secundario — dos instalaciones de ngrok

- **ngrok MSIX** (instalado como app de Windows) → funciona correctamente, tiene su propio config en `AppData/Local/Packages/ngrok.../ngrok.yml`
- **@expo/ngrok** (npm global) → lo usa Expo para `--tunnel`, tiene su config en `~/.expo/ngrok.yml`

Los dos tienen authtokens distintos y no se conocen entre sí. Expo siempre usa el suyo, que falla por Node 24.

---

## Por qué el emulador resuelve todo esto

Con el emulador Android no necesitas tunnel para nada:
- Expo se conecta por USB/local directamente
- El emulador accede al backend via `10.0.2.2:8000` (ya configurado en `api.ts`)
- Cero ngrok, cero tunnel, cero conflictos de versión
