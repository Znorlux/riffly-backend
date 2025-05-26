import { Injectable } from '@nestjs/common';
import { createRouteHandler } from 'uploadthing/express';
import { uploadRouter } from './uploadthing.router';

@Injectable()
export class UploadthingService {
  readonly handler = createRouteHandler({
    router: uploadRouter,
    config: {
      callbackUrl: '/api/uploadthing', // se puede personalizar
    },
  });
}
