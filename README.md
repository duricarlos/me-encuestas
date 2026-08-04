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

## Comandos

```bash
npm run dev
npm run generate:types
npm run seed
npm run build
```
