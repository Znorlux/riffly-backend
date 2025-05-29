import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsArray,
  IsUrl,
  Min,
} from 'class-validator';

export enum TrackGenre {
  POP = 'POP',
  ROCK = 'ROCK',
  ELECTRONIC = 'ELECTRONIC',
  HIP_HOP = 'HIP_HOP',
  JAZZ = 'JAZZ',
  CLASSICAL = 'CLASSICAL',
  FOLK = 'FOLK',
  REGGAETON = 'REGGAETON',
  BLUES = 'BLUES',
  COUNTRY = 'COUNTRY',
}

export enum TrackMood {
  ALEGRE = 'ALEGRE',
  MELANCOLICO = 'MELANCOLICO',
  ENERGETICO = 'ENERGETICO',
  RELAJANTE = 'RELAJANTE',
  ROMANTICO = 'ROMANTICO',
  NOSTALGICO = 'NOSTALGICO',
  MOTIVACIONAL = 'MOTIVACIONAL',
  MISTERIOSO = 'MISTERIOSO',
  EPICO = 'EPICO',
  INTIMO = 'INTIMO',
  FESTIVO = 'FESTIVO',
  CONTEMPLATIVO = 'CONTEMPLATIVO',
}

export enum TempoRange {
  VERY_SLOW = 'VERY_SLOW', // 60-70 BPM
  SLOW = 'SLOW', // 70-90 BPM
  MODERATE = 'MODERATE', // 90-120 BPM
  FAST = 'FAST', // 120-140 BPM
  VERY_FAST = 'VERY_FAST', // 140+ BPM
}

export enum GenerationMethod {
  PROMPT = 'PROMPT', // Descripción de texto
  MELODY = 'MELODY', // Tararear melodía
  LYRICS = 'LYRICS', // Solo letras
  STYLE = 'STYLE', // Imitación de estilo
}

export class CreateTrackDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUrl()
  audioUrl: string;

  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @IsOptional()
  @IsUrl()
  spectrogramUrl?: string;

  @IsEnum(TrackGenre)
  genre: TrackGenre;

  @IsEnum(TrackMood)
  mood: TrackMood;

  @IsEnum(TempoRange)
  tempo: TempoRange;

  @IsInt()
  @Min(1)
  duration: number; // duración en segundos

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;

  @IsOptional()
  @IsBoolean()
  allowCollaborations?: boolean = false;

  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean = false;

  @IsOptional()
  @IsEnum(GenerationMethod)
  generationMethod?: GenerationMethod;

  @IsOptional()
  @IsString()
  aiPrompt?: string;

  @IsOptional()
  @IsString()
  originalPrompt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mainInstruments?: string[] = [];

  @IsOptional()
  @IsString()
  lyrics?: string;

  @IsOptional()
  @IsString()
  riffusionId?: string;

  @IsOptional()
  @IsString()
  generationId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  generationTime?: number; // tiempo de generación en ms

  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number; // tamaño en bytes (convertido de BigInt)

  @IsString()
  userId: string;
}
