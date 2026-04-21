from fastapi.responses import HTMLResponse


def render_forgot_password_page() -> HTMLResponse:
    return HTMLResponse(
        """<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PlotSkip | Recuperar contrasena</title>
    <link rel="stylesheet" href="/static/auth.css" />
  </head>
  <body>
    <main class="card">
      <h1>Recuperar contrasena</h1>
      <p class="muted">Introduce tu email y te enviaremos un enlace de prueba para cambiar la contrasena.</p>
      <form id="forgot-password-form" class="stack">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required />
        <button type="submit">Enviar enlace</button>
      </form>
      <p id="forgot-password-message" class="message" aria-live="polite"></p>
    </main>
    <script>
      const form = document.getElementById("forgot-password-form");
      const message = document.getElementById("forgot-password-message");

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        message.textContent = "Enviando...";
        message.className = "message";

        const email = document.getElementById("email").value;
        try {
          const response = await fetch("/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          const responseText = await response.text();
          let data = {};

          try {
            data = JSON.parse(responseText);
          } catch {
            data = {};
          }

          if (!response.ok) {
            const detail = data.detail || data.message || responseText || "No se pudo completar la solicitud.";
            message.textContent = detail;
            message.className = "message error";
            return;
          }

          message.textContent = data.message || "Solicitud completada.";
          message.className = "message success";
        } catch (error) {
          message.textContent = "Error de red o backend no disponible.";
          message.className = "message error";
        }
      });
    </script>
  </body>
</html>"""
    )


def render_reset_password_page(token: str) -> HTMLResponse:
    return HTMLResponse(
        f"""<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PlotSkip | Nueva contrasena</title>
    <link rel="stylesheet" href="/static/auth.css" />
  </head>
  <body>
    <main class="card">
      <h1>Nueva contrasena</h1>
      <p class="muted">Usa esta pantalla minima para confirmar que el token del email funciona.</p>
      <form id="reset-password-form" class="stack">
        <input id="token" name="token" type="hidden" value="{token}" />
        <label for="new-password">Nueva contrasena</label>
        <input id="new-password" name="new-password" type="password" autocomplete="new-password" required />
        <button type="submit">Cambiar contrasena</button>
      </form>
      <p id="reset-password-message" class="message" aria-live="polite"></p>
    </main>
    <script>
      const form = document.getElementById("reset-password-form");
      const message = document.getElementById("reset-password-message");
      const token = document.getElementById("token").value;

      form.addEventListener("submit", async (event) => {{
        event.preventDefault();
        message.textContent = "Actualizando...";
        message.className = "message";

        const newPassword = document.getElementById("new-password").value;

        try {{
          const response = await fetch("/auth/reset-password", {{
            method: "POST",
            headers: {{ "Content-Type": "application/json" }},
            body: JSON.stringify({{ token, new_password: newPassword }}),
          }});

          const responseText = await response.text();
          let data = {{}};

          try {{
            data = JSON.parse(responseText);
          }} catch {{
            data = {{}};
          }}

          if (!response.ok) {{
            const detail = data.detail || data.message || responseText || "No se pudo cambiar la contrasena.";
            message.textContent = detail;
            message.className = "message error";
            return;
          }}

          message.textContent = data.message || "Contrasena actualizada.";
          message.className = "message success";
        }} catch (error) {{
          message.textContent = "Error de red o backend no disponible.";
          message.className = "message error";
        }}
      }});
    </script>
  </body>
</html>"""
    )
