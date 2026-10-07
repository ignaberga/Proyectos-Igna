# CLAUDE.md — Proyectos de Ignacio

Repositorio personal de Ignacio. Cada proyecto va en su propia carpeta.

## Cómo trabajar con Ignacio

- Ignacio es contador y **no programa**: Claude hace los cambios y él los
  prueba en el celular. Explicaciones en castellano rioplatense, simple y sin
  jerga técnica.
- Preguntar antes de hacer cambios grandes. Si algo puede perder datos
  cargados, avisarlo primero.
- Probar los cambios en Chromium (Playwright) antes de subirlos, simulando la
  planilla, incluido el caso sin señal.

## `viaje/` — Gastos del viaje (octubre 2026)

App de gastos compartidos para un viaje de Gastón, David e Ignacio. Basada en
la app de La Emilia (repo `ignaberga/LA-EMILIA-SAS`): mismo esquema de un solo
`index.html` sin dependencias, planilla de Google como base de datos vía
Apps Script, cola de pendientes para cargar sin señal y link de instalación
`#vincular=<exec>&quien=<persona>`.

- Personas fijas: `Gastón`, `David`, `Ignacio` (constante `PEOPLE`). En el
  link de instalación `quien` va sin tilde (`Gaston`).
- Cada movimiento: `id, fecha, tipo ("gasto" | "pago"), descripcion,
  categoria, moneda ("BRL" | "USD"), monto, cambio (reales por 1 dólar; 1 si
  es BRL), pago (quién pagó), participantes (array), cargo`.
- Un gasto se divide en partes iguales entre `participantes`. Un `pago` es una
  transferencia entre dos: `pago` le paga a `participantes[0]`.
- Saldos y estado de cuenta siempre en reales. El tipo de cambio va en cada
  gasto en dólares y se precarga el último usado.
- Acciones al Apps Script: `GET ?action=get_all` → `{gastos:[...]}`;
  `POST add` y `delete` (repetibles sin duplicar). Editar = `delete` + `add`
  con el mismo ID.
- Claves de `localStorage` con prefijo `viaje_`.

## Reglas firmes

- **La dirección `/exec` del Apps Script nunca va en el repositorio** (ni
  código, ni commits). El repo se publica en GitHub Pages.
- Una respuesta vacía o incompleta de la planilla nunca pisa los datos del
  celular.
- Textos de la app en castellano rioplatense y con tildes.
