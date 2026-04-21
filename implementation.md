# Password Reset Test Views

## Objective

- Probar end-to-end el flujo de recuperacion de contrasena con Resend y una UI minima.

## Scope

- In scope:
- Vistas HTML minimas para solicitar reset y establecer nueva contrasena
- CSS simple para hacerlas legibles
- Integracion con los endpoints backend ya creados
- Tests de las vistas y del flujo principal
- Out of scope:
- Diseno final mobile
- Navegacion Expo
- Maquetacion avanzada o componentes reutilizables complejos

## Phases

### Phase 1: Discovery and design

- Goal: fijar el flujo minimo de prueba y sus rutas
- Expected files or systems: backend auth router, config, docs
- Validation: rutas y enlace de email definidos
- Review gate: el flujo completo es claro antes de editar

### Phase 2: Core implementation

- Goal: crear vistas HTML y CSS minimos
- Expected files or systems: backend presentation views/static, auth router, main app
- Validation: paginas renderizan y pueden enviar formularios
- Review gate: las vistas cubren forgot y reset sin dependencia externa

### Phase 3: Integration and cleanup

- Goal: enlazar el email con la vista de reset y dejar mensajes claros
- Expected files or systems: email sender, config, tests
- Validation: el flujo manual de prueba queda documentado
- Review gate: el correo y la UI usan la misma URL base

### Phase 4: Verification and handoff

- Goal: ejecutar tests y resumir setup real para probar con Resend
- Expected files or systems: tests, docs
- Validation: pytest pasa y el setup manual queda claro
- Review gate: riesgos residuales explicitados

### Phase 5: Native mobile recovery

- Goal: mover forgot/reset a screens nativas de Expo Router
- Expected files or systems: mobile auth screens, backend email link config
- Validation: login navega a forgot nativo y el correo apunta al reset mobile
- Review gate: TypeScript sin errores y flujo backend intacto
