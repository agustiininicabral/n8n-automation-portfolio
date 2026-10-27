# Portafolio de automatizaciones n8n

Ocho workflows educativos preparados para importar y revisar en **n8n 2.44.7**. Todos se distribuyen inactivos; ninguno incluye credenciales reales.

## Workflows

| Archivo | Propósito | Tipo de prueba |
| --- | --- | --- |
| `workflows/01-n8n-webhook-api.json` | Recibe y valida una consulta | Webhook de prueba |
| `workflows/02-n8n-api-integration.json` | Consulta JSONPlaceholder y normaliza la respuesta | Manual; requiere Internet |
| `workflows/03-n8n-lead-management.json` | Valida un contacto ficticio | Webhook de prueba |
| `workflows/04-n8n-data-processing.json` | Calcula totales y filtra registros | Manual |
| `workflows/05-n8n-report-automation.json` | Calcula métricas de ventas ficticias | Manual |
| `workflows/06-n8n-api-monitor.json` | Informa si JSONPlaceholder respondió | Manual; requiere Internet |
| `workflows/07-n8n-notification-system.json` | Construye una notificación sin enviarla | Manual |
| `workflows/08-n8n-secure-webhook.json` | Demuestra validación de clave y payload | Webhook de prueba |

## Importar y probar

1. En n8n 2.44.7, crea un workflow y elige **Import from File** en el menú de opciones.
2. Selecciona un archivo de `workflows/` y revisa los nodos. No agregues credenciales para estas pruebas.
3. Para un workflow manual, usa **Execute Workflow**. Para los workflows con Webhook, abre el nodo y elige **Listen for test event**.
4. Envía las solicitudes de prueba y compara el resultado con los casos documentados en [`docs/validation-checklist.md`](docs/validation-checklist.md).

Las pruebas con Webhook usan la URL de prueba de tu instancia, habitualmente `http://localhost:5678/webhook-test/<path>`. Los ejemplos del documento usan `curl`; adaptá la URL si tu instancia está en otra dirección. El endpoint externo de los workflows 02 y 06 requiere Internet.

## Seguridad y alcance

El workflow 08 contiene `CHANGE_ME_LOCAL_DEMO_KEY` como placeholder para una prueba local. No lo uses como secreto real ni expongas el webhook de prueba a Internet. Los workflows son ejemplos educativos, no sistemas listos para producción. El workflow 07 prepara texto y no envía notificaciones. JSONPlaceholder es un servicio público y puede no estar disponible.

Las casillas de las pruebas de n8n en la checklist quedan pendientes hasta que una persona ejecute esos casos en una instancia local. Las validaciones estáticas del repositorio se registran allí por separado.
