import {
  Controller,
  Req,
  Res,
  All,
  Next,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UploadthingService } from './uploadthing.service';

@Controller('uploadthing')
export class UploadthingController {
  constructor(private readonly uploadthingService: UploadthingService) {}

  @All()
  handleUploadthing(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.uploadthingService.handler(req, res, next);
  }
}
