import { Body, Controller, Post } from '@nestjs/common';
import { RiffusionService } from './riffusion.service';

@Controller('riffusion')
export class RiffusionController {
  constructor(private readonly riffusionService: RiffusionService) {}

  @Post('generate')
  async generate(@Body() body: any) {
    return this.riffusionService.generateTrack(body);
  }
}
