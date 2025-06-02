import { Injectable, BadRequestException } from '@nestjs/common';
import * as ytdl from '@distube/ytdl-core';
import { S3FakeService } from '../s3fake/s3fake.service';

export interface YoutubeDownloadResult {
  success: boolean;
  audioUrl?: string;
  title?: string;
  duration?: string;
  error?: string;
}

@Injectable()
export class YoutubeService {
  constructor(private readonly s3FakeService: S3FakeService) {}

  async downloadMp3(url: string): Promise<YoutubeDownloadResult> {
    try {
      // Validar que la URL sea de YouTube
      if (!ytdl.validateURL(url)) {
        throw new BadRequestException('URL de YouTube no válida');
      }

      console.log(`[YoutubeService] Iniciando descarga de: ${url}`);

      // Obtener información del video
      const info = await ytdl.getInfo(url);
      const videoDetails = info.videoDetails;

      console.log(`[YoutubeService] Video encontrado: ${videoDetails.title}`);

      // Buscar el mejor formato de audio
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

      if (audioFormats.length === 0) {
        throw new BadRequestException('No se encontró audio en el video');
      }

      // Obtener el formato de mejor calidad
      const format = ytdl.chooseFormat(info.formats, {
        quality: 'highestaudio',
        filter: 'audioonly',
      });

      console.log(`[YoutubeService] Formato seleccionado: ${format.container}`);

      // Crear stream de descarga
      const audioStream = ytdl(url, {
        format: format,
        quality: 'highestaudio',
      });

      // Convertir stream a buffer
      const chunks: Buffer[] = [];

      return new Promise<YoutubeDownloadResult>((resolve, reject) => {
        audioStream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        audioStream.on('end', () => {
          this.processAudioBuffer(chunks, format, videoDetails)
            .then(resolve)
            .catch(reject);
        });

        audioStream.on('error', (error) => {
          console.error(
            '[YoutubeService] Error en el stream de descarga:',
            error,
          );
          reject(
            new BadRequestException('Error al descargar el video de YouTube'),
          );
        });
      });
    } catch (error) {
      console.error('[YoutubeService] Error general:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Error al procesar el video de YouTube: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  private async processAudioBuffer(
    chunks: Buffer[],
    format: ytdl.videoFormat,
    videoDetails: ytdl.MoreVideoDetails,
  ): Promise<YoutubeDownloadResult> {
    try {
      const audioBuffer = Buffer.concat(chunks);
      console.log(
        `[YoutubeService] Descarga completada. Tamaño: ${audioBuffer.length} bytes`,
      );

      // Generar ID único para el archivo
      const fileId = `youtube-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Subir a storage usando S3FakeService - FORZAR EXTENSIÓN .mp3
      const uploadResult = await this.s3FakeService.uploadFile(
        `${fileId}.mp3`, // Siempre usar .mp3 independientemente del formato original
        audioBuffer,
        'audio/mpeg', // Siempre usar mimetype de MP3
      );

      console.log(
        `[YoutubeService] Archivo subido como MP3: ${uploadResult.publicUrl}`,
      );

      return {
        success: true,
        audioUrl: uploadResult.publicUrl,
        title: videoDetails.title || 'Sin título',
        duration: this.formatDuration(
          parseInt(videoDetails.lengthSeconds || '0'),
        ),
      };
    } catch (uploadError) {
      console.error('[YoutubeService] Error al subir archivo:', uploadError);
      throw new BadRequestException('Error al guardar el archivo de audio');
    }
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  async getVideoInfo(url: string) {
    try {
      if (!ytdl.validateURL(url)) {
        throw new BadRequestException('URL de YouTube no válida');
      }

      const info = await ytdl.getInfo(url);
      const videoDetails = info.videoDetails;

      return {
        title: videoDetails.title,
        duration: this.formatDuration(
          parseInt(videoDetails.lengthSeconds || '0'),
        ),
        thumbnail: videoDetails.thumbnails?.[0]?.url || '',
        author: videoDetails.author?.name || 'Desconocido',
        viewCount: videoDetails.viewCount || '0',
        description: videoDetails.description || '',
      };
    } catch (error) {
      console.error('[YoutubeService] Error al obtener info del video:', error);
      throw new BadRequestException('Error al obtener información del video');
    }
  }
}
