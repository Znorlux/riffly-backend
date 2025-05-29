import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { Track, Prisma } from '../../generated/prisma';

@Injectable()
export class TracksService {
  constructor(private prisma: PrismaService) {}

  async create(createTrackDto: CreateTrackDto): Promise<Track> {
    try {
      // Convertir fileSize a BigInt si está presente
      const { userId, ...trackDataWithoutUserId } = createTrackDto;

      const data: Prisma.TrackCreateInput = {
        ...trackDataWithoutUserId,
        fileSize: createTrackDto.fileSize
          ? BigInt(createTrackDto.fileSize)
          : undefined,
        user: {
          connect: { id: userId },
        },
      };

      return await this.prisma.track.create({
        data,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profileImage: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'Ya existe un track con esos datos únicos',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Usuario no encontrado');
        }
      }
      throw error;
    }
  }

  async findAll(
    options: {
      skip?: number;
      take?: number;
      userId?: string;
      genre?: string;
      mood?: string;
      isPublic?: boolean;
      aiGenerated?: boolean;
    } = {},
  ): Promise<Track[]> {
    const {
      skip = 0,
      take = 20,
      userId,
      genre,
      mood,
      isPublic,
      aiGenerated,
    } = options;

    const where: Prisma.TrackWhereInput = {};

    if (userId) where.userId = userId;
    if (genre) where.genre = genre as Prisma.EnumTrackGenreFilter;
    if (mood) where.mood = mood as Prisma.EnumTrackMoodFilter;
    if (isPublic !== undefined) where.isPublic = isPublic;
    if (aiGenerated !== undefined) where.aiGenerated = aiGenerated;

    return await this.prisma.track.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Track> {
    const track = await this.prisma.track.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            bio: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!track) {
      throw new NotFoundException(`Track con ID ${id} no encontrado`);
    }

    return track;
  }

  async findByUser(userId: string): Promise<Track[]> {
    return await this.prisma.track.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updateData: Partial<CreateTrackDto>,
    requestUserId: string,
  ): Promise<Track> {
    // Verificar que el track existe y pertenece al usuario
    const existingTrack = await this.prisma.track.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingTrack) {
      throw new NotFoundException(`Track con ID ${id} no encontrado`);
    }

    if (existingTrack.userId !== requestUserId) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar este track',
      );
    }

    // Preparar datos para actualización, excluyendo userId si está presente
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId, ...dataWithoutUserId } = updateData;

    const data = {
      ...dataWithoutUserId,
      fileSize: updateData.fileSize ? BigInt(updateData.fileSize) : undefined,
    };

    return await this.prisma.track.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
  }

  async remove(id: string, requestUserId: string): Promise<void> {
    // Verificar que el track existe y pertenece al usuario
    const existingTrack = await this.prisma.track.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingTrack) {
      throw new NotFoundException(`Track con ID ${id} no encontrado`);
    }

    if (existingTrack.userId !== requestUserId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este track',
      );
    }

    await this.prisma.track.delete({
      where: { id },
    });
  }

  async getPopularTracks(limit: number = 10): Promise<Track[]> {
    return await this.prisma.track.findMany({
      where: { isPublic: true },
      take: limit,
      orderBy: {
        likes: {
          _count: 'desc',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
  }

  async searchTracks(query: string): Promise<Track[]> {
    return await this.prisma.track.findMany({
      where: {
        AND: [
          { isPublic: true },
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { aiPrompt: { contains: query, mode: 'insensitive' } },
              { lyrics: { contains: query, mode: 'insensitive' } },
              { user: { username: { contains: query, mode: 'insensitive' } } },
            ],
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
