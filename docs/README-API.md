# HEIC to JPG Conversion API

Public endpoint for converting HEIC/HEIF images to JPEG.

- Base URL: `https://heic-to-jpg.io`
- Endpoint: `POST /api/convert`
- Auth: None (public)
- CORS: `*` (POST, OPTIONS)

## Request

- Content-Type: `multipart/form-data`
- Fields:
  - `file` (required): HEIC/HEIF image

## Response

- Success: `200 OK`, body is `image/jpeg`
- Headers: `Content-Disposition: inline; filename="<original>.jpg"`

## Examples

### JavaScript (browser)
```js
const formData = new FormData()
formData.append('file', file, file.name)

const res = await fetch('https://heic-to-jpg.io/api/convert', {
  method: 'POST',
  body: formData
})
if (!res.ok) throw new Error('Conversion failed')
const blob = await res.blob()
```

### cURL
```bash
curl -X POST https://heic-to-jpg.io/api/convert \
  -F "file=@/path/to/photo.heic" \
  -o output.jpg
```

## Errors

- `400` Missing `file` or invalid content type
- `422` Decode failure (invalid or unsupported HEIC)
- `500` Server error

## OpenAPI

See `docs/openapi.yaml` or import into your API tool (Insomnia/Postman). 