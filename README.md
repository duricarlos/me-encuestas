# Me Encuestas

Base sencilla de Next.js + Payload + Postgres para crear encuestas desde JSON y publicarlas en `/[slug]`.

## Arranque

```bash
npm install
cp .env.example .env
# Edita DATABASE_URL y PAYLOAD_SECRET
npm run dev
```

Abre `http://localhost:3000/admin` para crear el primer usuario y administrar encuestas. Una encuesta publicada en Payload queda disponible en `http://localhost:3000/<slug>`.

Para cargar la encuesta de ejemplo después de configurar Postgres:

```bash
npm run seed
```

La definición de referencia está en [content/demo-survey.json](content/demo-survey.json). El campo `definition` de la colección `surveys` acepta ese mismo formato JSON:

Para pedirle a otro agente que genere encuestas compatibles, usa [ENCUESTAS-AGENTE.md](ENCUESTAS-AGENTE.md).

```json
{
  "version": 1,
  "intro": { "title": "Tu opinión", "description": "Un minuto." },
  "questions": [
    {
      "id": "satisfaction",
      "type": "rating",
      "label": "¿Cómo fue tu experiencia?",
      "required": true,
      "min": 1,
      "max": 5
    }
  ],
  "thankYou": { "title": "Gracias" }
}
```

Tipos de pregunta incluidos: `text`, `textarea`, `email`, `number`, `date`, `single`, `multiple`, `rating` y `boolean`.

## Datos de respuesta

La ruta `POST /api/surveys/[id]/responses` valida las preguntas requeridas y guarda:

- respuestas y duración de la sesión;
- idioma, zona horaria, navegador, plataforma, viewport, pantalla, pixel ratio, touch points, conexión y preferencias de movimiento/color;
- user agent, referer e idioma de la petición;
- país, región, ciudad, zona horaria y coordenadas aproximadas obtenidas con ip.guide;
- la IP se usa únicamente durante la consulta geográfica y no se guarda, ni en crudo ni mediante hash.

La geolocalización del navegador no se solicita. Los datos de proveedor dependen del hosting y pueden quedar vacíos en local. Revisa consentimiento, retención y obligaciones legales antes de usar datos de producción.

En producción, `DATABASE_URL` debe apuntar a un Postgres accesible desde el hosting. No uses `localhost` ni `127.0.0.1`; esos valores solo sirven para desarrollo local.

## MCP para revisar respuestas

El proyecto expone un MCP en `POST /api/mcp`. Autentica con el usuario de Payload mediante su cookie de sesión, un JWT en `Authorization: Bearer <token>` o una API key generada desde el usuario en Payload.

Cada encuesta tiene un `owner` relacionado con `Users`. Las encuestas creadas desde Payload se asignan automáticamente al usuario que las crea. La encuesta demo `experiencia` se asigna al primer usuario cuando se ejecuta `npm run seed` después de crear ese usuario.

El MCP ofrece estas herramientas:

- `list_surveys`: lista las encuestas del usuario autenticado.
- `get_survey_responses`: devuelve las respuestas de una encuesta propia, sin metadatos técnicos ni campos de preguntas de tipo email.
- `save_response_analysis`: guarda el resultado de una revisión en la colección `response-analyses`, enlazado a `Users`, `Surveys` y `Responses`.

Para conectar un cliente MCP remoto, usa la URL pública `https://tu-dominio.com/api/mcp` y autentícalo con el JWT del usuario de Payload. En local, el login se puede obtener así:

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H 'content-type: application/json' \
  -d '{"email":"tu-email","password":"tu-password"}'
```

Para generar una API key, abre `/admin/collections/users`, edita el usuario, activa `Enable API Key` y pulsa `Generate`. El cliente MCP debe enviarla así: `Authorization: users API-Key <API_KEY>`.

No guardes el token ni la API key en el repositorio. La IA solo podrá consultar encuestas cuyo `owner` coincida con el usuario autenticado.

## Comandos

```bash
npm run dev
npm run generate:types
npm run seed
npm run build
```

## Licencia

Este proyecto se publica bajo la licencia [MIT](LICENSE). El uso personal y comercial es gratuito; en usos comerciales debe conservarse el aviso de copyright y la atribución de Me Encuestas.
