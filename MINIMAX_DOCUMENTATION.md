# Documentación del Módulo MiniMax

## Descripción General

El módulo MiniMax permite generar música usando el modelo de IA **MiniMax Music-01** de Replicate. Este modelo es especial porque puede crear canciones inspiradas en una canción existente, usando lyrics personalizadas y un archivo de audio de referencia.

## Características Principales

- **Generación basada en referencia**: Crea música inspirada en una canción existente
- **Lyrics personalizadas**: Permite usar letras propias o usar las por defecto
- **Modelo avanzado**: Usa el modelo `minimax/music-01` de Replicate
- **Polling automático**: Espera hasta 2 minutos para que complete la generación
- **Manejo de errores**: Control completo de errores y timeouts

## Endpoint Principal

### POST `/minimax/generate`

Genera una nueva canción usando el modelo MiniMax.

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "promptA": "string - Lyrics de la canción",
  "promptB": "string  - URL del archivo de audio de referencia"
}
```

**Ejemplo de Request:**

```json
{
  "promptA": "[verse]\nEsta es mi canción personalizada\nCon ritmo y melodía\n[chorus]\nMiniMax genera música increíble\nCon IA de última generación",
  "promptB": "https://example.com/mi-cancion-referencia.wav"
}
```

**Ejemplo de Request Mínimo (usa valores por defecto):**

```json
{}
```

**Response Exitoso (201):**

```json
{
  "id": "pred_abc123def456",
  "status": "succeeded",
  "output": "https://replicate.delivery/pbxt/xyz789/generated-song.wav",
  "created_at": "2024-01-15T10:30:00.000Z",
  "completed_at": "2024-01-15T10:32:15.000Z"
}
```

**Response de Error (400/500):**

```json
{
  "statusCode": 500,
  "message": "Failed to generate track: Prediction timed out after 2 minutes",
  "error": "Internal Server Error"
}
```

## Valores por Defecto

Si no se proporcionan parámetros, el sistema usa estos valores:

**Lyrics por defecto (promptA):**

```
[intro]

No lyrics? No problem, I'm ready to shine
MiniMax in the lab, cookin' audio so fine
Default track, but still got that flame
AI on the beat, remember the name

[chorus]
Riffusion in the wires, feel the groove ignite
Even my fallback track hits just right
```

**Audio de referencia por defecto (promptB):**

```
https://replicate.delivery/pbxt/M9zum1Y6qujy02jeigHTJzn0lBTQOemB7OkH5XmmPSC5OUoO/MiniMax-Electronic.wav
```

## Validaciones

- **promptA**: Debe ser un string válido (opcional)
- **promptB**: Debe ser una URL válida si se proporciona (opcional)

## Flujo de Trabajo Recomendado

### 1. Generar Música con MiniMax

```bash
curl -X POST http://localhost:3000/minimax/generate \
  -H "Content-Type: application/json" \
  -d '{
    "promptA": "Mi letra personalizada aquí",
    "promptB": "https://mi-servidor.com/cancion-referencia.wav"
  }'
```

### 2. Guardar el Resultado en S3Fake

```bash
curl -X POST http://localhost:3000/s3fake/upload-from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "URL_DEL_OUTPUT_DE_MINIMAX",
    "filename": "mi-cancion-minimax.wav"
  }'
```

### 3. Crear Track en la Base de Datos

```bash
curl -X POST http://localhost:3000/tracks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi Canción MiniMax",
    "description": "Generada con MiniMax usando referencia",
    "audioUrl": "http://localhost:3000/s3fake/stream/mi-cancion-minimax.wav",
    "userId": "user-id-aqui",
    "aiGenerated": true,
    "generationMethod": "minimax",
    "aiPrompt": "Mi letra personalizada aquí"
  }'
```

## Diferencias con Riffusion

| Característica | Riffusion                        | MiniMax                        |
| -------------- | -------------------------------- | ------------------------------ |
| **Entrada**    | Prompts de texto (A y B)         | Lyrics + Audio de referencia   |
| **Salida**     | Audio + Spectrogram              | Solo Audio                     |
| **Uso**        | Crear música desde cero          | Inspirarse en música existente |
| **Modelo**     | `riffusion/riffusion:8cf61ea...` | `minimax/music-01`             |
| **Tiempo**     | ~30-60 segundos                  | ~1-2 minutos                   |

## Tipos TypeScript para Frontend

```typescript
// DTO para enviar a MiniMax
interface CreateMinimaxDto {
  promptA?: string; // Lyrics
  promptB?: string; // URL del audio de referencia
}

// Respuesta de MiniMax
interface MinimaxPrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string; // URL del archivo generado
  error?: string;
  created_at?: string;
  completed_at?: string;
  [key: string]: unknown;
}

// Función para usar en React/Frontend
async function generateWithMiniMax(
  lyrics?: string,
  referenceUrl?: string,
): Promise<MinimaxPrediction> {
  const response = await fetch('/api/minimax/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      promptA: lyrics,
      promptB: referenceUrl,
    }),
  });

  if (!response.ok) {
    throw new Error('Error generating with MiniMax');
  }

  return response.json();
}
```

## Casos de Uso

### 1. Crear Cover/Remix

```json
{
  "promptA": "[verse]\nEsta es mi versión del clásico\nCon mi estilo personal\n[chorus]\nUn remix único y especial",
  "promptB": "https://example.com/cancion-original.wav"
}
```

### 2. Inspirarse en un Género

```json
{
  "promptA": "[verse]\nQuiero crear algo nuevo\nPero con este estilo\n[chorus]\nInnovación con tradición",
  "promptB": "https://example.com/ejemplo-jazz.wav"
}
```

### 3. Generación Rápida (valores por defecto)

```json
{}
```

## Variables de Entorno Requeridas

```env
REPLICATE_API_TOKEN=tu_token_de_replicate_aqui
```

## Manejo de Errores

El servicio maneja varios tipos de errores:

- **Timeout**: Si la generación toma más de 2 minutos
- **Fallo del modelo**: Si Replicate reporta un error
- **Token inválido**: Si el token de Replicate no es válido
- **URL inválida**: Si promptB no es una URL válida

## Estructura de Archivos

```
src/minimax/
├── dto/
│   └── create-minimax.dto.ts          # Validaciones de entrada
├── interfaces/
│   └── minimax-prediction.interface.ts # Tipos TypeScript
├── minimax.controller.ts              # Endpoint REST
├── minimax.service.ts                 # Lógica de negocio
└── minimax.module.ts                  # Configuración del módulo
```

## Testing

### Ejemplo con curl

```bash
# Test básico
curl -X POST http://localhost:3000/minimax/generate \
  -H "Content-Type: application/json" \
  -d '{}'

# Test con parámetros
curl -X POST http://localhost:3000/minimax/generate \
  -H "Content-Type: application/json" \
  -d '{
    "promptA": "Test lyrics here",
    "promptB": "https://example.com/test.wav"
  }'
```

### Ejemplo con JavaScript/Fetch

```javascript
// Test en el navegador o Node.js
fetch('http://localhost:3000/minimax/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    promptA: 'My custom lyrics',
    promptB: 'https://example.com/reference.wav',
  }),
})
  .then((response) => response.json())
  .then((data) => console.log('Generated:', data))
  .catch((error) => console.error('Error:', error));
```

## Notas Importantes

1. **Tiempo de generación**: MiniMax puede tomar 1-2 minutos en completar
2. **Formato de audio**: El modelo acepta archivos WAV como referencia
3. **Calidad de referencia**: Mejores resultados con audio de alta calidad
4. **Lyrics formato**: Usar tags como [verse], [chorus], [bridge] mejora los resultados
5. **Rate limits**: Respeta los límites de Replicate API

## Integración con el Sistema Completo

MiniMax se integra perfectamente con el resto del backend:

1. **Generar** → MiniMax crea la música
2. **Almacenar** → S3Fake guarda el archivo
3. **Catalogar** → Tracks gestiona los metadatos
4. **Autenticar** → Auth protege las operaciones

¡El módulo MiniMax está listo para usar! 🎵
