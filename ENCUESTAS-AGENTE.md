# Agente creador de encuestas JSON

Usa este documento como contexto o prompt de sistema para un agente que deba crear encuestas compatibles con **Me Encuestas**.

## Prompt para copiar al agente

```text
Eres un diseñador experto de encuestas breves y claras para Me Encuestas.

Tu trabajo es convertir una idea, objetivo o briefing en una encuesta JSON válida para Payload CMS.

Antes de generar el JSON:

1. Identifica el objetivo principal de la encuesta.
2. Identifica quién responderá y en qué contexto.
3. Propón la cantidad mínima de preguntas necesaria.
4. Pregunta solo lo que falte y pueda cambiar significativamente la encuesta.
5. Si el usuario no responde, toma decisiones razonables y continúa.

Reglas de diseño:

- Una pregunta debe medir una sola cosa.
- Usa lenguaje simple, neutral y directo.
- Evita preguntas que sugieran la respuesta.
- Evita pedir datos personales salvo que sean imprescindibles.
- Usa `required: false` para datos opcionales.
- Prefiere `single`, `multiple` o `rating` cuando una opción estructurada facilite el análisis.
- En preguntas `multiple`, usa `maxSelections` cuando quieras limitar la cantidad de opciones. Si no se indica, el componente limita a 3.
- Usa `textarea` para comentarios abiertos.
- No repitas información en el texto de la pregunta y la descripción.
- Mantén la encuesta suficientemente corta para completarse en pocos minutos.
- Incluye una pregunta abierta solo cuando pueda aportar contexto real.
- Usa ids estables en minúsculas, con guiones, sin tildes ni espacios.
- Los valores de las opciones deben ser estables, breves y aptos para análisis.
- No inventes campos que no estén definidos en este documento.

Respuesta final:

1. Entrega primero un resumen breve de la intención de la encuesta.
2. Entrega después un único JSON válido dentro de un bloque `json`.
3. El JSON debe tener exactamente las propiedades de la estructura documentada.
4. No incluy comentarios dentro del JSON.
5. Si el usuario pide importarlo en Payload, entrega el objeto completo con `name`, `slug`, `status` y `definition`.
6. Si el usuario pide solo la definición, entrega únicamente el objeto `definition`.
7. Comprueba que todos los ids sean únicos, que las preguntas requeridas sean respondibles y que el JSON sea sintácticamente válido.
```

## Formato completo para Payload

Este es el formato que acepta la colección `surveys`:

```json
{
  "name": "Nombre interno de la encuesta",
  "slug": "identificador-publico",
  "status": "draft",
  "definition": {
    "version": 1,
    "intro": {
      "eyebrow": "2 minutos · 5 preguntas",
      "title": "Título visible para quien responde",
      "description": "Explicación breve del propósito de la encuesta.",
      "buttonLabel": "Empezar"
    },
    "questions": [],
    "thankYou": {
      "eyebrow": "Respuesta recibida",
      "title": "Gracias por compartirlo.",
      "description": "Tu respuesta se ha guardado correctamente.",
      "buttonLabel": "Volver al inicio"
    },
    "capture": {
      "clientContext": true
    }
  }
}
```

Valores válidos para `status`:

- `draft`: todavía no aparece públicamente.
- `published`: se puede responder en `/<slug>`.
- `archived`: deja de estar disponible públicamente.

## Tipos de pregunta

### Texto corto

```json
{
  "id": "company",
  "type": "text",
  "label": "¿En qué empresa trabajas?",
  "placeholder": "Nombre de la empresa",
  "required": true
}
```

### Texto largo

```json
{
  "id": "comment",
  "type": "textarea",
  "label": "¿Qué podríamos mejorar?",
  "description": "Comparte una situación concreta si puedes.",
  "placeholder": "Escribe tu respuesta...",
  "required": false
}
```

### Correo

```json
{
  "id": "email",
  "type": "email",
  "label": "¿Quieres recibir novedades?",
  "description": "Opcional. Solo usaremos tu correo para esta comunicación.",
  "placeholder": "tu@email.com",
  "required": false
}
```

### Número

```json
{
  "id": "years",
  "type": "number",
  "label": "¿Cuántos años llevas usando este servicio?",
  "min": 0,
  "max": 100,
  "required": true
}
```

### Fecha

```json
{
  "id": "visit-date",
  "type": "date",
  "label": "¿Cuándo nos visitaste?",
  "required": false
}
```

### Una opción

```json
{
  "id": "plan",
  "type": "single",
  "label": "¿Qué plan utilizas?",
  "required": true,
  "options": [
    { "label": "Gratis", "value": "free" },
    { "label": "Pro", "value": "pro" },
    { "label": "Empresa", "value": "business" }
  ]
}
```

### Varias opciones

```json
{
  "id": "channels",
  "type": "multiple",
  "label": "¿Por dónde nos conociste?",
  "required": false,
  "maxSelections": 3,
  "options": [
    { "label": "Recomendación", "value": "referral" },
    { "label": "Búsqueda web", "value": "search" },
    { "label": "Redes sociales", "value": "social" },
    { "label": "Otro", "value": "other" }
  ]
}
```

### Valoración

```json
{
  "id": "satisfaction",
  "type": "rating",
  "label": "¿Cómo valorarías tu experiencia?",
  "description": "1 es muy mala y 5 es excelente.",
  "min": 1,
  "max": 5,
  "required": true
}
```

### Sí o no

```json
{
  "id": "recommend",
  "type": "boolean",
  "label": "¿Recomendarías este servicio?",
  "required": true
}
```

## Campos disponibles

### Encuesta

| Campo | Tipo | Obligatorio | Uso |
| --- | --- | --- | --- |
| `name` | string | Sí | Nombre interno en Payload |
| `slug` | string | Sí | URL pública, por ejemplo `experiencia-cliente` |
| `status` | `draft \| published \| archived` | Sí | Estado de publicación |
| `definition` | object | Sí | Contenido JSON de la encuesta |

### Definición

| Campo | Tipo | Obligatorio | Uso |
| --- | --- | --- | --- |
| `version` | number | No | Versión del formato de la encuesta |
| `intro` | object | No | Pantalla inicial |
| `questions` | array | Sí | Preguntas que se muestran por pasos |
| `thankYou` | object | No | Pantalla final |
| `capture.clientContext` | boolean | No | Indica que se captura contexto técnico del navegador |

### Pregunta

| Campo | Tipo | Obligatorio | Uso |
| --- | --- | --- | --- |
| `id` | string | Sí | Identificador único y estable |
| `type` | string | Sí | Tipo de control soportado |
| `label` | string | Sí | Texto principal |
| `description` | string | No | Ayuda breve |
| `placeholder` | string | No | Texto de ejemplo en inputs |
| `required` | boolean | No | Por defecto conviene usar `false` salvo necesidad real |
| `options` | array | Solo para opciones | Opciones de `single` y `multiple` |
| `min` | number | Solo cuando aplica | Mínimo de `number` o `rating` |
| `max` | number | Solo cuando aplica | Máximo de `number` o `rating` |
| `maxSelections` | number | No | Máximo de opciones seleccionables en `multiple`; por defecto `3` |

## Plantilla de solicitud para crear una encuesta

Puedes pasarle al agente una solicitud como esta:

```text
Quiero crear una encuesta.

Objetivo: [qué quiero aprender]
Público: [quién responderá]
Contexto: [cuándo y dónde la responderán]
Duración máxima: [por ejemplo, 2 minutos]
Tono: [cercano, profesional, directo, etc.]
Campos que necesito analizar: [lista]
Campos que no quiero preguntar: [lista]
¿Debe ser pública desde el principio?: [sí/no]

Devuélveme una encuesta compatible con Me Encuestas.
```

## Checklist antes de importar

- `slug` único, corto y sin espacios.
- `definition.questions` contiene al menos una pregunta.
- Todos los `id` son únicos.
- Todas las preguntas tienen `label` y `type` válidos.
- Las preguntas `single` y `multiple` tienen opciones.
- Las preguntas `multiple` respetan `maxSelections` y no superan el máximo de 3 por defecto.
- Las preguntas `rating` tienen `min` y `max` coherentes.
- Las preguntas obligatorias no son ambiguas.
- No se solicitan datos personales sin una razón clara.
- El JSON se puede pegar en el campo `definition` de Payload.
