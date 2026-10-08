// ============================================================
// GASTOS DEL VIAJE - Backend de Apps Script
// ============================================================
// Que hace: convierte esta planilla en la base de datos compartida de
// la app del viaje. La app le pide los datos (doGet) y le manda altas
// y bajas (doPost). Crea solas las hojas "Gastos" y "Config" la primera
// vez, con las categorias por defecto.
//
// Este archivo es una copia de respaldo: el que funciona de verdad es
// el que esta pegado dentro de la planilla. La direccion /exec NUNCA
// va en este repositorio.
//
// COMO INSTALARLO (una sola vez):
// 1. Crea una planilla de Google nueva (ej. "Gastos viaje").
// 2. Extensiones > Apps Script. Borra lo que haya en Code.gs y pega
//    este archivo completo. Guarda (icono de disquete).
// 3. Implementar > Nueva implementacion > tipo "Aplicacion web".
//      - Ejecutar como: Yo
//      - Quien tiene acceso: Cualquier usuario
//    Autoriza los permisos que pide Google.
// 4. Copia la URL que termina en /exec y pasasela a Claude para que
//    arme los links de instalacion (por chat, nunca en el repo).
//
// COMO ACTUALIZARLO (sin que cambie el link):
//    Pegar, guardar e Implementar > Gestionar implementaciones >
//    icono de lapiz > Version: "Nueva version" > Implementar.
//    (NO "Nueva implementacion": cambia el link.)
// ============================================================

const SHEET_GASTOS = "Gastos";
const SHEET_CONFIG = "Config";
// Version 3: la moneda base es el peso. Cambio = pesos por 1 real o por
// 1 dolar (1 si el gasto es en pesos; vacio si todavia no se sabe).
const VERSION = 3;
const HEADERS = ["ID","Fecha","Tipo","Descripcion","Categoria","Moneda","Monto","Cambio","MontoPesos","Pago","Participantes","Cargo"];
const CONFIG_HEADERS = ["Tipo","Valor"];
const DEFAULT_CATEGORIAS = ["Hospedaje","Movilidad","Comida","Supermercado","Salidas","Excursiones","Compras","Otros"];

function getConfigSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_CONFIG);
  if (!sh) {
    sh = ss.insertSheet(SHEET_CONFIG);
    sh.appendRow(CONFIG_HEADERS);
    DEFAULT_CATEGORIAS.forEach(function (c) { sh.appendRow(["categorias", c]); });
  }
  return sh;
}

function readCategorias_() {
  const rows = getConfigSheet_().getDataRange().getValues().slice(1);
  const out = rows.filter(function (r) { return r[0] === "categorias" && r[1] !== ""; })
    .map(function (r) { return String(r[1]); });
  return out.length ? out : DEFAULT_CATEGORIAS;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_GASTOS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_GASTOS);
    // ID y Fecha como texto plano para que la planilla no los transforme.
    sh.getRange("A:B").setNumberFormat("@");
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  } else if (String(sh.getRange(1, 9).getValue()) !== HEADERS[8]) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sh;
}

function formatDate_(v) {
  if (Object.prototype.toString.call(v) === "[object Date]") {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
  return String(v);
}

function readGastos_() {
  const rows = getSheet_().getDataRange().getValues().slice(1);
  return rows.filter(function (r) { return r[0] !== ""; }).map(function (r) {
    return {
      id: String(r[0]),
      fecha: formatDate_(r[1]),
      tipo: String(r[2] || "gasto"),
      descripcion: String(r[3] || ""),
      categoria: String(r[4] || ""),
      moneda: String(r[5] || "ARS"),
      monto: Number(r[6]) || 0,
      // Un gasto en reales o dolares puede quedar sin tipo de cambio (0)
      // hasta que se lo pongan desde la app.
      cambio: String(r[5] || "ARS") === "ARS" ? 1 : (Number(r[7]) || 0),
      pago: String(r[9] || ""),
      participantes: String(r[10] || "").split(",").map(function (s) { return s.trim(); }).filter(String),
      cargo: String(r[11] || "")
    };
  });
}

function gastoToRow_(g) {
  const monto = Number(g.monto) || 0;
  const cambio = g.moneda === "ARS" ? 1 : (Number(g.cambio) > 0 ? Number(g.cambio) : "");
  return [
    String(g.id), String(g.fecha || ""), String(g.tipo || "gasto"),
    String(g.descripcion || ""), String(g.categoria || ""), String(g.moneda || "ARS"),
    monto, cambio, cambio === "" ? "" : Math.round(monto * cambio * 100) / 100,
    String(g.pago || ""), (g.participantes || []).join(", "), String(g.cargo || "")
  ];
}

function findRowById_(sh, id) {
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "get_all";
  if (action === "get_all") return jsonOut_({ version: VERSION, gastos: readGastos_(), categorias: readCategorias_() });
  return jsonOut_({ error: "accion desconocida" });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, error: "body invalido" });
  }

  // Candado: si dos celulares mandan cambios a la vez, se procesan de a uno.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return jsonOut_({ ok: false, error: "planilla ocupada" });
  }

  try {
    const sh = getSheet_();
    // La app reintenta lo que no pudo confirmar (por ejemplo sin senal),
    // asi que cada accion tiene que poder repetirse sin duplicar.
    if (body.action === "add") {
      if (findRowById_(sh, body.gasto.id) < 0) sh.appendRow(gastoToRow_(body.gasto));
    } else if (body.action === "delete") {
      const r = findRowById_(sh, body.id);
      if (r > 0) sh.deleteRow(r);
    } else if (body.action === "config_add" || body.action === "config_remove") {
      const cs = getConfigSheet_();
      const data = cs.getDataRange().getValues();
      let found = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(body.list) && String(data[i][1]) === String(body.value)) { found = i + 1; break; }
      }
      if (body.action === "config_add" && found < 0) cs.appendRow([body.list, body.value]);
      if (body.action === "config_remove" && found > 0) cs.deleteRow(found);
    } else {
      return jsonOut_({ ok: false, error: "accion desconocida" });
    }
    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
