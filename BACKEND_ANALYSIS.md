# Análisis del Backend - Riffly

## Resumen General

El backend está construido con **NestJS** y utiliza **TypeScript**. Tiene dos módulos principales:

- **Riffusion**: Para generar música usando IA
- **S3Fake**: Para almacenar archivos en Supabase Storage

## Configuración del Servidor

- **Puerto**: 3000 (por defecto) o variable de entorno `PORT`
- **CORS**: Habilitado para `http://localhost:4200` (Angular)
- **Base URL**: `http://localhost:3000`

## Variables de Entorno Requeridas

```env
REPLICATE_API_TOKEN=tu_token_de_replicate
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_key_de_supabase
PORT=3000
```

## Módulo Riffusion - Generación de Música

### Ruta Principal

**Base URL**: `/riffusion`

### Endpoints Disponibles

#### POST `/riffusion/generate`

**Propósito**: Generar música usando IA de Riffusion a través de Replicate

**Body (JSON)**:

```json
{
  "promptA": "funky synth solo", // Opcional, default: "funky synth solo"
  "promptB": "90s rap", // Opcional, default: "90s rap"
  "alpha": 0.5, // Opcional, default: 0.5 (mezcla entre prompts)
  "denoising": 0.75, // Opcional, default: 0.75
  "seed_image_id": "vibes", // Opcional, default: "vibes"
  "num_inference_steps": 50 // Opcional, default: 50
}
```

**Respuesta**: Objeto de predicción de Replicate con **DOS archivos generados**

```json
{
  "id": "prediction-id",
  "status": "succeeded",
  "output": {
    "audio": "https://replicate.delivery/pbxt/.../audio.wav",
    "spectrogram": "https://replicate.delivery/pbxt/.../spectrogram.png"
  }
  // ... otros campos de metadatos
}
```

**Tipos de archivos devueltos**:

- **`audio`**: Archivo de audio en formato WAV
- **`spectrogram`**: Imagen del espectrograma en formato PNG

**Ejemplo de uso desde frontend**:

```typescript
const generateMusic = async (params: any) => {
  const response = await fetch('http://localhost:3000/riffusion/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  return response.json();
};
```

## Módulo S3Fake - Almacenamiento en Supabase

### Ruta Principal

**Base URL**: `/s3fake`

### Endpoints Disponibles

#### POST `/s3fake/upload`

**Propósito**: Subir archivos directamente desde el cliente

**Content-Type**: `multipart/form-data`
**Campo**: `file` (archivo)

**Respuesta**:

```json
{
  "path": "timestamp-filename.ext",
  "publicUrl": "https://supabase-url/storage/v1/object/public/rifflymusicbucket/path"
}
```

#### GET `/s3fake/download/:filename`

**Propósito**: Descargar archivo como attachment

**Parámetros**:

- `filename`: Nombre del archivo a descargar

**Respuesta**: Archivo binario con headers de descarga

#### GET `/s3fake/stream/:filename`

**Propósito**: Reproducir audio en streaming

**Parámetros**:

- `filename`: Nombre del archivo de audio

**Respuesta**: Stream de audio con headers apropiados para reproducción

#### POST `/s3fake/upload-from-url`

**Propósito**: Subir archivo desde una URL (útil para guardar música generada)

**Body (JSON)**:

```json
{
  "url": "https://replicate.delivery/pbxt/...",
  "id": "unique-track-id"
}
```

**Respuesta**:

```json
{
  "path": "unique-track-id.mp3",
  "publicUrl": "https://supabase-url/storage/v1/object/public/rifflymusicbucket/unique-track-id.mp3"
}
```

## Flujo Completo de Generación y Almacenamiento

### 1. Generar Música

```typescript
// Paso 1: Generar música con Riffusion
const musicData = await fetch('http://localhost:3000/riffusion/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    promptA: 'electronic dance music',
    promptB: 'ambient chill',
    alpha: 0.7,
  }),
});

const result = await musicData.json();
// result.output.audio contiene la URL del archivo de audio (.wav)
// result.output.spectrogram contiene la URL de la imagen del espectrograma (.png)
```

### 2. Guardar en Supabase

```typescript
// Paso 2a: Guardar el archivo de audio en Supabase
const saveAudio = await fetch('http://localhost:3000/s3fake/upload-from-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: result.output.audio, // URL del archivo de audio generado
    id: `track-${Date.now()}`, // ID único para el track
  }),
});

const savedAudio = await saveAudio.json();

// Paso 2b: (Opcional) Guardar también el espectrograma
const saveSpectro = await fetch(
  'http://localhost:3000/s3fake/upload-from-url',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: result.output.spectrogram, // URL de la imagen del espectrograma
      id: `spectro-${Date.now()}`, // ID único para el espectrograma
    }),
  },
);

const savedSpectro = await saveSpectro.json();
```

### 3. Reproducir Música

```typescript
// Opción 1: Stream directo desde tu backend
const audioElement = new Audio(
  `http://localhost:3000/s3fake/stream/${savedAudio.path}`,
);
audioElement.play();

// Opción 2: Usar la URL pública de Supabase
const audioElement2 = new Audio(savedAudio.publicUrl);
audioElement2.play();

// Opción 3: Reproducir directamente desde Replicate (temporal)
const audioElement3 = new Audio(result.output.audio);
audioElement3.play();
```

### 4. Mostrar Espectrograma (Opcional)

```typescript
// Mostrar la imagen del espectrograma
const imgElement = document.createElement('img');
imgElement.src = savedSpectro.publicUrl; // o result.output.spectrogram
imgElement.alt = 'Espectrograma de la música generada';
document.body.appendChild(imgElement);
```

## Configuración de Supabase Storage

### Bucket

- **Nombre**: `rifflymusicbucket`
- **Configuración**: Público para lectura
- **Tipos de archivo**: Principalmente audio (mp3, wav, etc.)

## Dependencias Principales

### Backend

- **NestJS**: Framework principal
- **Replicate**: Cliente para IA de Riffusion
- **@supabase/supabase-js**: Cliente de Supabase
- **multer**: Manejo de archivos
- **axios**: Peticiones HTTP
- **mime-types**: Detección de tipos MIME

## Estructura de Archivos

```
src/
├── riffusion/
│   ├── riffusion.controller.ts    # Rutas de generación
│   ├── riffusion.service.ts       # Lógica de Replicate
│   └── riffusion.module.ts        # Configuración del módulo
├── s3fake/
│   ├── s3fake.controller.ts       # Rutas de almacenamiento
│   ├── s3fake.service.ts          # Lógica de Supabase
│   ├── s3fake.client.ts           # Cliente de Supabase
│   └── s3fake.module.ts           # Configuración del módulo
├── app.module.ts                  # Módulo principal
└── main.ts                        # Configuración del servidor
```

## Consideraciones para el Frontend

### Headers Recomendados

```typescript
const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};
```

### Manejo de Errores

- Todos los endpoints pueden devolver errores HTTP estándar
- Verificar siempre el status de la respuesta
- Los errores de Replicate se propagan al frontend

### Tipos TypeScript Sugeridos

```typescript
interface RiffusionParams {
  promptA?: string;
  promptB?: string;
  alpha?: number;
  denoising?: number;
  seed_image_id?: string;
  num_inference_steps?: number;
}

interface RiffusionOutput {
  audio: string; // URL del archivo de audio (.wav)
  spectrogram: string; // URL de la imagen del espectrograma (.png)
}

interface RiffusionResponse {
  id: string;
  status: string;
  output: RiffusionOutput;
  // ... otros campos de metadatos de Replicate
}

interface UploadResponse {
  path: string;
  publicUrl: string;
}

interface UploadFromUrlParams {
  url: string;
  id: string;
}

// Interfaz completa para manejo del flujo
interface GeneratedTrack {
  id: string;
  audioUrl: string;
  spectrogramUrl: string;
  savedAudio?: UploadResponse;
  savedSpectrogram?: UploadResponse;
  prompts: {
    promptA: string;
    promptB?: string;
    alpha?: number;
  };
  createdAt: Date;
}
```

## Próximos Pasos para Conectar Frontend

1. **Configurar variables de entorno** en el frontend con la URL del backend
2. **Crear servicios** para cada módulo (RiffusionService, StorageService)
3. **Implementar manejo de estados** para el proceso de generación
4. **Agregar componentes de audio** para reproducción
5. **Implementar sistema de carga** para las operaciones asíncronas

Este backend está listo para conectarse con cualquier frontend que pueda hacer peticiones HTTP. La arquitectura es modular y escalable.
