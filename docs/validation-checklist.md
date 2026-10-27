# Guía de validación reproducible

## Preparación

Importa cada archivo en una instancia local de **n8n 2.44.7**. Ejecuta los workflows manuales con **Execute Workflow**. Para cada webhook, abre el nodo Webhook, pulsa **Listen for test event** y envía la solicitud a la URL de prueba mostrada por n8n (normalmente `http://localhost:5678/webhook-test/<path>`). Los siguientes comandos presuponen esa URL base y una terminal Bash con `curl`.

Los casos de esta guía describen resultados esperados; **no se ejecutaron como workflows** durante la validación del repositorio.

## Casos por workflow

### 01 — Webhook API

Ruta: `portfolio-consultas`. Esperado: HTTP 200 y salida `ok: true` con la consulta recortada.

```sh
curl -i -X POST http://localhost:5678/webhook-test/portfolio-consultas \
  -H 'Content-Type: application/json' \
  -d '{"consulta":"  estado del pedido  "}'
```

Repite con `{}`. Esperado: `ok: false` y error `El campo consulta es obligatorio`.

### 02 — REST API Integration

Ejecuta manualmente. Requiere acceso a `https://jsonplaceholder.typicode.com/posts/1`. Esperado: un item con `fuente: "JSONPlaceholder"`, `id: 1`, `titulo` y `resumen`. No se registra como probado hasta completar la ejecución con Internet disponible.

### 03 — Lead Management

Ruta: `portfolio-leads`. Primer caso esperado: `valido: true`, estado `pendiente_de_contacto` y email normalizado en minúsculas.

```sh
curl -i -X POST http://localhost:5678/webhook-test/portfolio-leads \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Ada Ejemplo","email":"ADA@example.com","empresa":"Demo"}'
```

Repite con `{"nombre":"Ada Ejemplo","email":"correo-invalido"}`. Esperado: `valido: false`, estado `requiere_correccion` y un error de email.

### 04 — Data Processing

Ejecuta manualmente. Esperado: tres items válidos después del filtro; ningún item tiene `unidades: 0`. Los totales por producto son 50000, 36000 y 180000.

### 05 — Report Automation

Ejecuta manualmente. Esperado: `cantidadVentas: 5`, `totalVentas: 70000`, `promedio: 14000`, `minimo: 7500` y `maximo: 22500`.

### 06 — API Monitor

Ejecuta manualmente. Si JSONPlaceholder responde con el post esperado, el resultado debe indicar `disponible: true`. Si la solicitud falla, el flujo debe continuar e indicar `disponible: false`, `nota: "La solicitud falló"` y el error informado por n8n. Requiere Internet para el caso exitoso; no se ha probado la API desde este repositorio.

### 07 — Notification Builder

Ejecuta manualmente. Esperado: un item con asunto y mensaje preparados y `destinoConfigurado: false`. Este workflow no envía nada.

### 08 — Secure Webhook

Ruta: `portfolio-secure`. El código HTTP debe ser 401 sin clave, 400 con clave correcta y mensaje vacío, y 200 con clave correcta y mensaje no vacío. El placeholder de demo es `CHANGE_ME_LOCAL_DEMO_KEY`.

```sh
# Esperado: HTTP 401
curl -i -X POST http://localhost:5678/webhook-test/portfolio-secure \
  -H 'Content-Type: application/json' -d '{"mensaje":"hola"}'

# Esperado: HTTP 400
curl -i -X POST http://localhost:5678/webhook-test/portfolio-secure \
  -H 'Content-Type: application/json' -H 'x-api-key: CHANGE_ME_LOCAL_DEMO_KEY' \
  -d '{}'

# Esperado: HTTP 200
curl -i -X POST http://localhost:5678/webhook-test/portfolio-secure \
  -H 'Content-Type: application/json' -H 'x-api-key: CHANGE_ME_LOCAL_DEMO_KEY' \
  -d '{"mensaje":"hola"}'
```

## Registro de validación del repositorio

| Validación | Resultado | Alcance |
| --- | --- | --- |
| Parseo JSON de los ocho workflows | Aprobado en CI | `scripts/validate_workflows.py`; no comprueba importación en n8n |
| Referencias y nombres/IDs de nodos | Aprobado en CI | Nombres e IDs únicos, conexiones válidas y sin referencias a credenciales |
| Sintaxis de los bloques JavaScript | Aprobado en CI | `node --check` compila el código; no ejecuta los bloques |
| CLI/importación en n8n 2.44.7 | Pendiente | No hay CLI n8n disponible en el entorno |
| Casos manuales y webhooks de esta guía | Pendiente | Requieren una instancia n8n local |
| Respuesta real de JSONPlaceholder | Pendiente | Requiere ejecutar el workflow con Internet |

Marca como realizada una prueba de n8n solo después de ejecutar el caso correspondiente y comparar su resultado con lo esperado.
