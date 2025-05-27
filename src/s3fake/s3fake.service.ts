import { Injectable } from '@nestjs/common';
import { S3FakeClient } from './s3fake.client';
import { Response } from 'express';
import { Readable } from 'stream';
import axios from 'axios';
import * as mime from 'mime-types';

@Injectable()
export class S3FakeService {
  private readonly bucket = 'rifflymusicbucket';
  private readonly client = new S3FakeClient().getClient();

  async uploadFile(path: string, buffer: Buffer, mimetype: string) {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, buffer, {
        contentType: mimetype,
      });

    if (error) throw new Error(error.message);

    const { data } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return { path, publicUrl: data.publicUrl };
  }

  async downloadFile(path: string) {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(path);

    if (error) {
      console.error('[S3FakeService][downloadFile] Error:', error);
      throw new Error(`Failed to download ${path}: ${error.message}`);
    }

    return data;
  }

  async streamAudio(path: string, res: Response) {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(path);

    if (error || !data) {
      console.error('[S3FakeService][streamAudio] Error:', error);
      throw new Error(`Failed to stream ${path}: ${error?.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    const extension = path.split('.').pop() || 'mp3';
    const mimeType = mime.contentType(extension) || 'audio/mpeg';

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${path}"`,
      'Accept-Ranges': 'bytes',
    });

    stream.pipe(res);
  }


  async uploadFromUrlWithId(url: string, id: string) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const contentType = response.headers['content-type'];
    const extension = mime.extension(contentType) || mime.extension(url) || 'bin';

    const mimetype = contentType || 'application/octet-stream';
    const filename = `${id}.${extension}`;

    return this.uploadFile(filename, buffer, mimetype);
  }
}
