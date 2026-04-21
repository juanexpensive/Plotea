# Problema raíz del tunnel — diagnóstico definitivo

## TL;DR

`@expo/ngrok` usa el binario ngrok **v2.3.41** internamente. Ngrok ya no permite cuentas gratuitas con agentes v2 — exige v3.20.0 mínimo. Esto no tiene arreglo sin cambiar el mecanismo de tunnel.

---

## Cadena de dependencias

```
npx expo start --tunnel
  └─ @expo/ngrok@4.1.3 (global)
       └─ @expo/ngrok-bin@2.3.42
            └─ ngrok binary v2.3.41  ← AQUÍ ESTÁ EL PROBLEMA
```

El binario v2.3.41 intenta autenticarse en los servidores de ngrok y recibe:

```
ERR_NGROK_121: Your ngrok-agent version "2.3.41" is too old.
The minimum supported agent version for your account is "3.20.0".
```

---

## Por qué el error dice "Cannot read properties of undefined (reading 'body')"

El proceso ngrok v2 muere antes de emitir la línea de startup. `@expo/ngrok` espera esa línea para saber en qué puerto está la API interna. Como el proceso muere, lanza un error sin `response.body`. El código de `@expo/ngrok/src/client.js` asume que siempre hay `response.body` y explota con ese mensaje confuso.

El error real es `ERR_NGROK_121` — versión obsoleta.

---

## Por qué `npx ngrok http 8000` sí funciona

Porque el ngrok MSIX (instalado como app de Windows) es v3.36.1 — versión compatible. `@expo/ngrok` usa su propio binario v2 interno, que es distinto.

---

## Por qué el authtoken en `~/.ngrok2/ngrok.yml` no ayuda

El token sí llega al binario v2, pero ngrok rechaza la conexión porque la **versión del agente** es demasiado antigua, independientemente del token.

---

## Opciones reales

### Opción A — Cloudflare Tunnel (elegida)
`cloudflared` es el cliente de Cloudflare Tunnel. Completamente gratis, sin cuenta obligatoria, sin límites de versión. Crea un tunnel HTTP temporal con un comando. Funciona en todos los PCs.

```bash
# Instalar cloudflared (Windows, una vez)
winget install Cloudflare.cloudflared

# Usar (cada sesión)
cloudflared tunnel --url http://localhost:8000
# Devuelve una URL https://xxx.trycloudflare.com
```

**Para Expo tunnel:** Expo usa `@expo/ngrok` para tunnelizar el bundler Metro. Cloudflare no reemplaza eso directamente. Solución: usar `--lan` para Metro (Expo) y cloudflared solo para el backend.

**Alternativa completa:** usar `@expo/ngrok-bin` v3 o un paquete compatible.

### Opción B — @ngrok/ngrok SDK v3
El SDK oficial de ngrok v3 en Node. Compatible con cuentas gratuitas actuales. Se puede integrar como script de arranque que crea el tunnel antes de lanzar Expo.

---

## Solución recomendada para este proyecto

**Para el backend:** usar `cloudflared tunnel --url http://localhost:8000` — da una URL HTTPS estable para la sesión.

**Para Expo Metro bundler:** investigar si Expo SDK 54 soporta un plugin de tunnel alternativo, o usar `--lan` si móvil y PC están en la misma red, o usar emulador Android (sin tunnel).

La solución más robusta cross-PC a largo plazo es el emulador Android: cero dependencia de tunnel para Metro, y `cloudflared` solo para el backend.
