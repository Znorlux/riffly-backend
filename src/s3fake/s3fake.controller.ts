import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  Res,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3FakeService } from './s3fake.service';
import { Response } from 'express';

@Controller('s3fake')
export class S3FakeController {
  constructor(private readonly s3fakeService: S3FakeService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const path = `${Date.now()}-${file.originalname}`;
    return this.s3fakeService.uploadFile(path, file.buffer, file.mimetype);
  }

  @Get('download/:filename')
  async download(@Param('filename') filename: string, @Res() res: Response) {
    const fileStream = await this.s3fakeService.downloadFile(filename);
    const buffer = Buffer.from(await fileStream.arrayBuffer());

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.send(buffer);
  }

  @Post('upload-from-url')
  async uploadFromUrl(@Body() body: { url: string; id: string }) {
    const { url, id } = body;
    if (!url || !id) throw new Error('Missing "url" or "id" in body');

    return this.s3fakeService.uploadFromUrlWithId(url, id);
  }
}
