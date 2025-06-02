import { Module } from '@nestjs/common';
import { MinimaxController } from './minimax.controller';
import { MinimaxService } from './minimax.service';

@Module({
  controllers: [MinimaxController],
  providers: [MinimaxService],
  exports: [MinimaxService],
})
export class MinimaxModule {}
