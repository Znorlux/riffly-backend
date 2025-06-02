import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateMinimaxDto {
  @IsOptional()
  @IsString()
  promptA?: string; // Lyrics

  @IsOptional()
  @IsUrl(
    {},
    { message: 'promptB debe ser una URL válida del archivo de audio' },
  )
  promptB?: string; // URL del archivo de audio de referencia
}
