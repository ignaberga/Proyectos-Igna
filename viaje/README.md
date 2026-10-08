# Gastos del viaje

App para que Gastón, David e Ignacio carguen los gastos del viaje desde el
celular y vean quién le debe a quién. Es un solo archivo, `index.html`, sin
instalación ni servidor.

## Cómo funciona

- **Cargar gasto:** monto (en reales, dólares o pesos; viene elegido reales),
  descripción, categoría (de una lista que se arma en Config), quién pagó y
  quiénes se suman. El gasto se divide en partes iguales entre los que se suman.
- **Todo se pasa a pesos.** El tipo de cambio es opcional (1 R$ = X AR$ o
  1 US$ = X AR$). Si no se pone, el gasto queda en su moneda y aparece aparte,
  en un estado de cuenta en esa moneda. Cuando se le pone el cambio (lápiz →
  Editar), pasa a sumarse en pesos.
- **Estado de cuenta (en pesos):** cuánto puso cada uno, cuánto consumió y el
  saldo. "Para quedar a mano" dice quién le paga a quién con la menor cantidad
  de pagos. Cuando alguien paga, se toca "Ya pagó" y queda registrado.
- **Lápiz** en cada movimiento para editar o eliminar (eliminar pide confirmación).

## Dónde viven los datos

En una planilla de Google compartida. Los tres celulares leen y escriben ahí.
Cada celular guarda una copia para abrir al instante y seguir cargando sin
señal: lo cargado sin señal se manda solo cuando vuelve la conexión.

La conexión es la dirección de la aplicación web de Apps Script (la que
termina en `/exec`). **Esa dirección nunca va en este repositorio**: se
comparte solo por mensaje directo.

## Preparar la planilla (una sola vez, Ignacio)

Seguir los pasos que están al principio de
[`apps-script/Code.gs`](apps-script/Code.gs).

## Instalar en el celular

1. Cada uno recibe por WhatsApp su **link de instalación**:
   `https://ignaberga.github.io/Proyectos-Igna/viaje/#vincular=<dirección /exec>&quien=Gaston`
   (al final `Gaston`, `David` o `Ignacio`).
2. Abrir el link y, desde esa misma página, agregarlo a la pantalla de inicio:
   - **iPhone:** en Safari, Compartir → Agregar a inicio. Si se abrió dentro
     de WhatsApp, primero abrirlo en Safari.
   - **Android:** en Chrome, menú de tres puntos → Agregar a pantalla principal.
