import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MinimaxService } from './minimax.service';
import { CreateMinimaxDto } from './dto/create-minimax.dto';
import { MinimaxPrediction } from './interfaces/minimax-prediction.interface';

@Controller('minimax')
export class MinimaxController {
  constructor(private readonly minimaxService: MinimaxService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generate(
    @Body() createMinimaxDto: CreateMinimaxDto,
  ): Promise<MinimaxPrediction> {
    return this.minimaxService.generateTrack(createMinimaxDto);
  }
}
