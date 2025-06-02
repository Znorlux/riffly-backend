import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import { DownloadYoutubeDto } from './dto/download-youtube.dto';

@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Post('download')
  @HttpCode(HttpStatus.OK)
  async downloadMp3(@Body() downloadYoutubeDto: DownloadYoutubeDto) {
    console.log(
      `[YoutubeController] Solicitud de descarga: ${downloadYoutubeDto.url}`,
    );
    return this.youtubeService.downloadMp3(downloadYoutubeDto.url);
  }

  @Get('info')
  async getVideoInfo(@Query('url') url: string) {
    if (!url) {
      throw new Error('URL es requerida como query parameter');
    }
    console.log(`[YoutubeController] Solicitud de información: ${url}`);
    return this.youtubeService.getVideoInfo(url);
  }
}
