# Portafolio de automatizaciones n8n

Ocho workflows educativos preparados para importar y revisar en **n8n 2.44.7**. Todos se distribuyen inactivos; ninguno incluye credenciales reales.

## Workflows

| Archivo | Propósito | Tipo de prueba |
| --- | --- | --- |
| `workflows/01-n8n-webhook-api.json` | Recibe y valida una consulta | Webhook de prueba |
| `workflows/02-n8n-api-integration.json` | Consulta JSONPlaceholder y normaliza la respuesta | Manual; requiere Internet |
| `workflows/03-n8n-lead-management.json` | Valida un contacto ficticio | Webhook de prueba |
| `workflows/04-n8n-data-processing.json` | Calcula totales y filtra registros | Manual y comportamiento Code-node simulado |
| `workflows/05-n8n-report-automation.json` | Calcula métricas de ventas ficticias | Comportamiento Code-node simulado y manual |
| `workflows/06-n8n-api-monitor.json` | Informa si JSONPlaceholder respondió | Comportamiento Code-node simulado; integración manual requiere Internet |
| `workflows/07-n8n-notification-system.json` | Construye una notificación sin enviarla | Comportamiento Code-node simulado |
| `workflows/08-n8n-secure-webhook.json` | Demuestra validación de clave y payload | Comportamiento Code-node simulado y webhook manual |

## Ejecutar n8n en Windows sin Docker

Requisitos: Node.js y npm disponibles en PowerShell. Comprueba con `node --version` y `npm --version`.

Desde la raíz del repositorio, ejecuta:

```powershell
./scripts/start_n8n_local.ps1
```

Si la política de ejecución de PowerShell bloquea el script, usa un bypass limitado al proceso:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_n8n_local.ps1
```

El script ejecuta la versión fijada de n8n con `npx`; la primera ejecución descarga el paquete a la caché de npm y puede tardar. No instala n8n dentro del repositorio ni utiliza Docker. El servidor se configura para escuchar en `127.0.0.1:5678` y desactiva diagnósticos, personalización, plantillas y avisos de versión. Abre `http://127.0.0.1:5678`, completa la configuración inicial que solicite n8n y deja la terminal abierta mientras lo utilizas. Pulsa Ctrl+C para detenerlo.

## Importar y probar

1. Con n8n abierto, crea un workflow y elige **Import from File** en el menú de opciones.
2. Selecciona un archivo de `workflows/` y revisa los nodos. No agregues credenciales para estas pruebas.
3. Para un workflow manual, usa **Execute Workflow**. Para los workflows con Webhook, abre el nodo Webhook y elige **Listen for test event**.
4. Envía las solicitudes de prueba y compara el resultado con los casos documentados en [`docs/validation-checklist.md`](docs/validation-checklist.md).

Las pruebas con Webhook usan la URL de prueba de tu instancia, habitualmente `http://127.0.0.1:5678/webhook-test/<path>`. Los ejemplos del documento usan `curl`; adapta la URL si tu instancia está en otra dirección. El endpoint externo de los workflows 02 y 06 requiere Internet.

## Seguridad y alcance

El workflow 08 contiene `CHANGE_ME_LOCAL_DEMO_KEY` como placeholder para una prueba local. No lo uses como secreto real ni expongas el webhook de prueba a Internet. Los workflows son ejemplos educativos, no sistemas listos para producción. El workflow 07 prepara texto y no envía notificaciones. JSONPlaceholder es un servicio público y puede no estar disponible.

## Validación automatizada

GitHub Actions ejecuta `scripts/validate_workflows.py` en cada push y pull request. El script comprueba que los ocho archivos sean JSON válido, que los workflows estén inactivos, que no incluyan referencias a credenciales, que los nombres e IDs de nodos sean únicos, que las conexiones apunten a nodos existentes y que el JavaScript de los nodos Code compile con Node.js. También se ejecutan Ruff y `pip check`.

Además, `scripts/test_workflow_behavior.mjs` ejecuta los bloques JavaScript de los nodos Code con entradas simuladas. Cubre casos válidos e inválidos, normalización de datos, métricas, respuesta de monitorización y códigos previstos para el webhook seguro. No hace llamadas de red.

**Límite importante:** estas pruebas ejercitan la lógica JavaScript de los nodos Code, pero no arrancan n8n ni ejecutan nodos Webhook, HTTP Request, Filter o Respond to Webhook dentro del motor real. La importación en n8n 2.44.7, las llamadas reales a JSONPlaceholder y los casos manuales siguen pendientes hasta ejecutarlos en una instancia local.
