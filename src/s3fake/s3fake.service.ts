import { Injectable } from '@nestjs/common';
import { S3FakeClient } from './s3fake.client';

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

}
