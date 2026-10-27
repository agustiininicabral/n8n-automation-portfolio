# Guía de validación reproducible

## Preparación

Importa cada archivo en una instancia local de **n8n 2.44.7**. Ejecuta los workflows manuales con **Execute Workflow**. Para cada webhook, abre el nodo Webhook, pulsa **Listen for test event** y envía la solicitud a la URL de prueba mostrada por n8n (normalmente `http://localhost:5678/webhook-test/<path>`). Los siguientes comandos presuponen esa URL base y una terminal Bash con `curl`.

Los casos de esta guía describen resultados esperados; las pruebas automáticas de JavaScript no equivalen a ejecutar los workflows dentro de n8n.

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

Ejecuta manualmente. Requiere acceso a `https://jsonplaceholder.typicode.com/posts/1`. El comportamiento de normalización se prueba con una respuesta simulada; la integración real sigue pendiente. Esperado: un item con `fuente: "JSONPlaceholder"`, `id: 1`, `titulo` y `resumen`.

### 03 — Lead Management

Ruta: `portfolio-leads`. Primer caso esperado: `valido: true`, estado `pendiente_de_contacto` y email normalizado en minúsculas.

```sh
curl -i -X POST http://localhost:5678/webhook-test/portfolio-leads \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Ada Ejemplo","email":"ADA@example.com","empresa":"Demo"}'
```

Repite con `{"nombre":"Ada Ejemplo","email":"correo-invalido"}`. Esperado: `valido: false`, estado `requiere_correccion` y un error de email.

### 04 — Data Processing

El bloque Code calcula cuatro registros y marca como inválido el que tiene `unidades: 0`; la prueba automatizada comprueba los totales y que tres registros cumplen la condición. La ejecución real del nodo Filter sigue pendiente. Los totales válidos son 50000, 36000 y 180000.

### 05 — Report Automation

La prueba automática comprueba `cantidadVentas: 5`, `totalVentas: 70000`, `promedio: 14000`, `minimo: 7500` y `maximo: 22500` en la lógica del nodo Code. La ejecución dentro de n8n sigue pendiente.

### 06 — API Monitor

La lógica del nodo Code se prueba con respuestas simuladas de éxito y error. La integración real con JSONPlaceholder sigue pendiente. En el caso de fallo se espera `disponible: false`, `nota: "La solicitud falló"` y el error informado por n8n.

### 07 — Notification Builder

La prueba automática verifica que el nodo prepare un asunto y mensaje, y devuelva `destinoConfigurado: false`. Este workflow no envía nada. La ejecución dentro de n8n sigue pendiente.

### 08 — Secure Webhook

Ruta: `portfolio-secure`. Las pruebas automáticas verifican que la lógica del nodo Code indique 401 sin clave, 400 con clave correcta y mensaje vacío, y 200 con clave correcta y mensaje no vacío. También se comprueba estáticamente la configuración del nodo Respond to Webhook. Los códigos HTTP reales siguen pendientes de ejecución en n8n. El placeholder de demo es `CHANGE_ME_LOCAL_DEMO_KEY`.

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
| Parseo JSON de los ocho workflows | CI | No comprueba importación en n8n |
| Referencias, nombres e IDs de nodos | CI | Comprueba unicidad y conexiones existentes |
| Sintaxis JavaScript de nodos Code | CI | Compila con `node --check`; no ejecuta bloques |
| Comportamiento de los ocho nodos Code | CI | Ejecuta lógica con entradas simuladas; no ejecuta el motor n8n |
| CLI/importación en n8n 2.44.7 | Pendiente | Requiere una instalación local de n8n |
| Webhooks y nodos n8n reales | Pendiente | Requiere importar y ejecutar los casos localmente |
| Respuesta real de JSONPlaceholder | Pendiente | Requiere ejecutar el workflow con Internet |

Marca como realizada una prueba de n8n solo después de ejecutar el caso correspondiente en una instancia local y comparar su resultado con lo esperado.
