# Análisis del Backend - Riffly

## Resumen General

El backend está construido con **NestJS** y utiliza **TypeScript**. Tiene tres módulos principales:

- **Riffusion**: Para generar música usando IA
- **S3Fake**: Para almacenar archivos en Supabase Storage
- **Tracks**: Para gestionar las canciones/tracks generados

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

## Módulo Tracks - Gestión de Canciones

### Ruta Principal

**Base URL**: `/tracks`

### Endpoints Disponibles

#### POST `/tracks`

**Propósito**: Crear una nueva canción/track con todos sus metadatos

**Body (JSON)**:

```json
{
  "title": "Mi Canción Generada",
  "description": "Una descripción opcional",
  "audioUrl": "https://supabase-url/.../audio.wav",
  "coverImage": "https://example.com/cover.jpg",
  "spectrogramUrl": "https://supabase-url/.../spectro.png",
  "genre": "ELECTRONIC",
  "mood": "ENERGETICO",
  "tempo": "FAST",
  "duration": 120,
  "isPublic": true,
  "allowCollaborations": false,
  "aiGenerated": true,
  "generationMethod": "PROMPT",
  "aiPrompt": "electronic dance music with ambient chill",
  "originalPrompt": "electronic dance music",
  "mainInstruments": ["synthesizer", "drums"],
  "lyrics": "Letras opcionales",
  "riffusionId": "prediction-id-from-replicate",
  "generationId": "unique-session-id",
  "generationTime": 30000,
  "fileSize": 2048576,
  "userId": "user-uuid"
}
```

**Respuesta**: Track creado con información del usuario y contadores

#### GET `/tracks`

**Propósito**: Obtener lista de tracks con filtros y paginación

**Query Parameters**:

- `page`: Número de página (default: 1)
- `limit`: Tracks por página (default: 20)
- `userId`: Filtrar por usuario
- `genre`: Filtrar por género
- `mood`: Filtrar por estado de ánimo
- `isPublic`: Filtrar por visibilidad (true/false)
- `aiGenerated`: Filtrar por generación IA (true/false)

**Ejemplo**: `GET /tracks?page=1&limit=10&genre=ELECTRONIC&mood=ENERGETICO`

#### GET `/tracks/popular`

**Propósito**: Obtener tracks más populares (por número de likes)

**Query Parameters**:

- `limit`: Número de tracks (default: 10)

#### GET `/tracks/search`

**Propósito**: Buscar tracks por texto

**Query Parameters**:

- `q`: Texto a buscar (en título, descripción, prompts, lyrics, username)

**Ejemplo**: `GET /tracks/search?q=electronic dance`

#### GET `/tracks/user/:userId`

**Propósito**: Obtener todos los tracks de un usuario específico

**Parámetros**:

- `userId`: ID del usuario

#### GET `/tracks/:id`

**Propósito**: Obtener un track específico con todos sus detalles, comentarios y likes

**Parámetros**:

- `id`: ID del track

#### PUT `/tracks/:id`

**Propósito**: Actualizar un track existente

**Parámetros**:

- `id`: ID del track
- `userId`: ID del usuario (query param, en producción vendría del JWT)

**Body**: Cualquier campo del track a actualizar (parcial)

#### DELETE `/tracks/:id`

**Propósito**: Eliminar un track

**Parámetros**:

- `id`: ID del track
- `userId`: ID del usuario (query param, en producción vendría del JWT)

### Enums Disponibles

#### TrackGenre

```typescript
POP |
  ROCK |
  ELECTRONIC |
  HIP_HOP |
  JAZZ |
  CLASSICAL |
  FOLK |
  REGGAETON |
  BLUES |
  COUNTRY;
```

#### TrackMood

```typescript
ALEGRE |
  MELANCOLICO |
  ENERGETICO |
  RELAJANTE |
  ROMANTICO |
  NOSTALGICO |
  MOTIVACIONAL |
  MISTERIOSO |
  EPICO |
  INTIMO |
  FESTIVO |
  CONTEMPLATIVO;
```

#### TempoRange

```typescript
VERY_SLOW; // 60-70 BPM
SLOW; // 70-90 BPM
MODERATE; // 90-120 BPM
FAST; // 120-140 BPM
VERY_FAST; // 140+ BPM
```

#### GenerationMethod

```typescript
PROMPT; // Descripción de texto
MELODY; // Tararear melodía
LYRICS; // Solo letras
STYLE; // Imitación de estilo
```

## Flujo Completo Actualizado: Generar → Guardar → Crear Track

### 1. Generar Música

```typescript
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
```

### 2. Guardar Archivos en Supabase

```typescript
// Guardar audio
const saveAudio = await fetch('http://localhost:3000/s3fake/upload-from-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: result.output.audio,
    id: `track-${Date.now()}`,
  }),
});

const savedAudio = await saveAudio.json();

// Guardar espectrograma
const saveSpectro = await fetch(
  'http://localhost:3000/s3fake/upload-from-url',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: result.output.spectrogram,
      id: `spectro-${Date.now()}`,
    }),
  },
);

const savedSpectro = await saveSpectro.json();
```

### 3. Crear Track en Base de Datos

```typescript
const trackData = {
  title: 'Mi Canción Generada',
  description: 'Música generada con IA',
  audioUrl: savedAudio.publicUrl,
  spectrogramUrl: savedSpectro.publicUrl,
  genre: 'ELECTRONIC',
  mood: 'ENERGETICO',
  tempo: 'FAST',
  duration: 120, // segundos
  isPublic: true,
  aiGenerated: true,
  generationMethod: 'PROMPT',
  aiPrompt: 'electronic dance music with ambient chill',
  originalPrompt: 'electronic dance music',
  mainInstruments: ['synthesizer', 'drums'],
  riffusionId: result.id,
  generationId: `session-${Date.now()}`,
  generationTime: 30000, // ms
  fileSize: 2048576, // bytes
  userId: 'user-uuid',
};

const createTrack = await fetch('http://localhost:3000/tracks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(trackData),
});

const createdTrack = await createTrack.json();
```

### 4. Obtener y Mostrar Tracks

```typescript
// Obtener tracks populares
const popularTracks = await fetch(
  'http://localhost:3000/tracks/popular?limit=10',
);
const popular = await popularTracks.json();

// Buscar tracks
const searchResults = await fetch(
  'http://localhost:3000/tracks/search?q=electronic',
);
const results = await searchResults.json();

// Obtener tracks de un usuario
const userTracks = await fetch('http://localhost:3000/tracks/user/user-uuid');
const tracks = await userTracks.json();
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

## Estructura de Archivos Actualizada

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
├── tracks/
│   ├── tracks.controller.ts       # Rutas de gestión de tracks
│   ├── tracks.service.ts          # Lógica de CRUD de tracks
│   ├── tracks.module.ts           # Configuración del módulo
│   └── dto/
│       └── create-track.dto.ts    # DTOs y validaciones
├── app.module.ts                  # Módulo principal
└── main.ts                        # Configuración del servidor
```

## Tipos TypeScript Actualizados

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

// Tipos específicos para Tracks
interface CreateTrackDto {
  title: string;
  description?: string;
  audioUrl: string;
  coverImage?: string;
  spectrogramUrl?: string;
  genre: TrackGenre;
  mood: TrackMood;
  tempo: TempoRange;
  duration: number;
  isPublic?: boolean;
  allowCollaborations?: boolean;
  aiGenerated?: boolean;
  generationMethod?: GenerationMethod;
  aiPrompt?: string;
  originalPrompt?: string;
  mainInstruments?: string[];
  lyrics?: string;
  riffusionId?: string;
  generationId?: string;
  generationTime?: number;
  fileSize?: number;
  userId: string;
}

interface TrackResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description?: string;
  audioUrl: string;
  coverImage?: string;
  spectrogramUrl?: string;
  genre: TrackGenre;
  mood: TrackMood;
  tempo: TempoRange;
  duration: number;
  isPublic: boolean;
  allowCollaborations: boolean;
  aiGenerated: boolean;
  generationMethod?: GenerationMethod;
  aiPrompt?: string;
  originalPrompt?: string;
  mainInstruments: string[];
  lyrics?: string;
  riffusionId?: string;
  generationId?: string;
  generationTime?: number;
  fileSize?: bigint;
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

// Flujo completo
interface CompleteTrackFlow {
  // 1. Generar música
  generateMusic: (params: RiffusionParams) => Promise<RiffusionResponse>;

  // 2. Guardar archivos
  saveAudio: (url: string, id: string) => Promise<UploadResponse>;
  saveSpectrogram: (url: string, id: string) => Promise<UploadResponse>;

  // 3. Crear track
  createTrack: (trackData: CreateTrackDto) => Promise<TrackResponse>;

  // 4. Gestionar tracks
  getTracks: (filters?: TrackFilters) => Promise<TrackResponse[]>;
  getTrack: (id: string) => Promise<TrackResponse>;
  updateTrack: (
    id: string,
    data: Partial<CreateTrackDto>,
  ) => Promise<TrackResponse>;
  deleteTrack: (id: string) => Promise<void>;
}
```

## Próximos Pasos para Conectar Frontend

1. **Configurar variables de entorno** en el frontend con la URL del backend
2. **Crear servicios** para cada módulo (RiffusionService, StorageService)
3. **Implementar manejo de estados** para el proceso de generación
4. **Agregar componentes de audio** para reproducción
5. **Implementar sistema de carga** para las operaciones asíncronas

Este backend está listo para conectarse con cualquier frontend que pueda hacer peticiones HTTP. La arquitectura es modular y escalable.
