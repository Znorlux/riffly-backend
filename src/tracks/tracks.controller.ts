import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TracksService } from './tracks.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser, User } from '../auth/get-user.decorator';

@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTrackDto: CreateTrackDto) {
    return this.tracksService.create(createTrackDto);
  }

  @Get('my-tracks')
  @UseGuards(JwtAuthGuard)
  async getMyTracks(@GetUser() user: User) {
    return this.tracksService.findByUser(user.id);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('genre') genre?: string,
    @Query('mood') mood?: string,
    @Query('isPublic') isPublic?: string,
    @Query('aiGenerated') aiGenerated?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const skip = (pageNum - 1) * limitNum;

    return this.tracksService.findAll({
      skip,
      take: limitNum,
      userId,
      genre,
      mood,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      aiGenerated: aiGenerated ? aiGenerated === 'true' : undefined,
    });
  }

  @Get('popular')
  async getPopular(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.tracksService.getPopularTracks(limitNum);
  }

  @Get('search')
  async search(@Query('q') query: string) {
    if (!query) {
      return [];
    }
    return this.tracksService.searchTracks(query);
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return this.tracksService.findByUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tracksService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateTrackDto: Partial<CreateTrackDto>,
    @GetUser() user: User,
  ) {
    return this.tracksService.update(id, updateTrackDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return this.tracksService.remove(id, user.id);
  }
}
