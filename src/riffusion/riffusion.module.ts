import { Module } from '@nestjs/common';
import { RiffusionService } from './riffusion.service';
import { RiffusionController } from './riffusion.controller';

@Module({
  controllers: [RiffusionController],
  providers: [RiffusionService],
})
export class RiffusionModule {}
