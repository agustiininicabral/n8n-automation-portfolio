import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
const failures = [];

function readWorkflow(filename) {
  return JSON.parse(
    readFileSync(path.join(root, "workflows", filename), "utf8"),
  );
}

function getCodeNode(filename, nodeName) {
  const workflow = readWorkflow(filename);
  const node = workflow.nodes.find((candidate) => candidate.name === nodeName);
  assert.ok(node, `${filename}: missing Code node ${nodeName}`);
  assert.equal(node.type, "n8n-nodes-base.code");
  assert.equal(typeof node.parameters.jsCode, "string");
  return { workflow, node };
}

function executeCodeNode(filename, nodeName, input = {}) {
  const { node } = getCodeNode(filename, nodeName);
  // These are repository-owned exports. Inputs are mocked and no network calls run here.
  return new Function("$json", node.parameters.jsCode)(input);
}

function check(name, callback) {
  try {
    callback();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

check("01 webhook accepts and trims a non-empty consultation", () => {
  const output = executeCodeNode("01-n8n-webhook-api.json", "Validar consulta", {
    body: { consulta: "  estado del pedido  " },
  });
  assert.equal(output.json.ok, true);
  assert.equal(output.json.consulta, "estado del pedido");
  assert.equal(output.json.error, null);
});

check("01 webhook rejects a missing consultation", () => {
  const output = executeCodeNode("01-n8n-webhook-api.json", "Validar consulta", {
    body: {},
  });
  assert.equal(output.json.ok, false);
  assert.equal(output.json.error, "El campo consulta es obligatorio");
});

check("02 API integration normalizes a mocked response", () => {
  const output = executeCodeNode(
    "02-n8n-api-integration.json",
    "Normalizar respuesta",
    { id: 1, title: "Título de prueba", body: "una\nrespuesta   de prueba" },
  );
  assert.equal(output.json.fuente, "JSONPlaceholder");
  assert.equal(output.json.id, 1);
  assert.equal(output.json.titulo, "Título de prueba");
  assert.equal(output.json.resumen, "una respuesta de prueba");
  assert.ok(Number.isFinite(Date.parse(output.json.procesadoEn)));
});

check("03 lead management normalizes a valid contact", () => {
  const output = executeCodeNode(
    "03-n8n-lead-management.json",
    "Validar contacto",
    { body: { nombre: " Ada Ejemplo ", email: " ADA@EXAMPLE.COM ", empresa: " Demo " } },
  );
  assert.equal(output.json.valido, true);
  assert.equal(output.json.estado, "pendiente_de_contacto");
  assert.equal(output.json.lead.nombre, "Ada Ejemplo");
  assert.equal(output.json.lead.email, "ada@example.com");
  assert.equal(output.json.lead.empresa, "Demo");
  assert.deepEqual(output.json.errores, []);
});

check("03 lead management rejects an invalid email", () => {
  const output = executeCodeNode(
    "03-n8n-lead-management.json",
    "Validar contacto",
    { body: { nombre: "Ada Ejemplo", email: "correo-invalido" } },
  );
  assert.equal(output.json.valido, false);
  assert.equal(output.json.estado, "requiere_correccion");
  assert.ok(output.json.errores.includes("email inválido"));
});

check("04 data processing computes totals and marks invalid rows", () => {
  const rows = executeCodeNode("04-n8n-data-processing.json", "Datos de ejemplo");
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.map((row) => row.json.total), [50000, 36000, 180000, 0]);
  assert.equal(rows[3].json.valido, false);
  assert.equal(rows.filter((row) => row.json.valido).length, 3);
});

check("05 report automation calculates deterministic sales metrics", () => {
  const output = executeCodeNode("05-n8n-report-automation.json", "Calcular métricas");
  assert.equal(output.length, 1);
  assert.deepEqual(
    {
      cantidadVentas: output[0].json.cantidadVentas,
      totalVentas: output[0].json.totalVentas,
      promedio: output[0].json.promedio,
      minimo: output[0].json.minimo,
      maximo: output[0].json.maximo,
    },
    { cantidadVentas: 5, totalVentas: 70000, promedio: 14000, minimo: 7500, maximo: 22500 },
  );
});

check("06 API monitor reports a mocked successful response", () => {
  const output = executeCodeNode("06-n8n-api-monitor.json", "Evaluar respuesta", {
    id: 1,
    title: "Mock response",
  });
  assert.equal(output.json.disponible, true);
  assert.equal(output.json.nota, "La API respondió con datos");
  assert.equal(output.json.error, null);
});

check("06 API monitor reports a mocked request failure", () => {
  const output = executeCodeNode("06-n8n-api-monitor.json", "Evaluar respuesta", {
    error: "Request failed",
  });
  assert.equal(output.json.disponible, false);
  assert.equal(output.json.nota, "La solicitud falló");
  assert.equal(output.json.error, "Request failed");
});

check("07 notification builder prepares text without sending it", () => {
  const output = executeCodeNode("07-n8n-notification-system.json", "Preparar notificación");
  assert.equal(output.json.destinoConfigurado, false);
  assert.equal(output.json.asunto, "Nuevo evento: lead_recibido");
  assert.match(output.json.mensaje, /Cliente de prueba/);
});

check("08 secure webhook returns 401 without a key", () => {
  const output = executeCodeNode(
    "08-n8n-secure-webhook.json",
    "Validar clave y payload",
    { headers: {}, body: { mensaje: "hola" } },
  );
  assert.equal(output.json.statusCode, 401);
  assert.equal(output.json.ok, false);
});

check("08 secure webhook returns 400 for an empty message with a valid key", () => {
  const output = executeCodeNode(
    "08-n8n-secure-webhook.json",
    "Validar clave y payload",
    { headers: { "x-api-key": "CHANGE_ME_LOCAL_DEMO_KEY" }, body: {} },
  );
  assert.equal(output.json.statusCode, 400);
  assert.equal(output.json.error, "El campo mensaje es obligatorio");
});

check("08 secure webhook accepts a valid key and message", () => {
  const output = executeCodeNode(
    "08-n8n-secure-webhook.json",
    "Validar clave y payload",
    { headers: { "x-api-key": "CHANGE_ME_LOCAL_DEMO_KEY" }, body: { mensaje: " hola " } },
  );
  assert.equal(output.json.statusCode, 200);
  assert.equal(output.json.ok, true);
  assert.equal(output.json.resultado.mensaje, "hola");
});

check("08 response node returns the Code-node status code", () => {
  const { workflow } = getCodeNode(
    "08-n8n-secure-webhook.json",
    "Validar clave y payload",
  );
  const webhook = workflow.nodes.find((node) => node.name === "Webhook Seguro");
  const response = workflow.nodes.find((node) => node.name === "Responder con estado HTTP");
  assert.equal(webhook.parameters.responseMode, "responseNode");
  assert.equal(response.type, "n8n-nodes-base.respondToWebhook");
  assert.equal(response.parameters.options.responseCode, "={{ $json.statusCode }}");
});

console.log(`\n${passed} behavior checks passed; ${failures.length} failed.`);
if (failures.length > 0) {
  process.exitCode = 1;
}
