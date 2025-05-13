import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as argon from 'argon2';

interface PrismaError {
  code: string;
  meta?: {
    target?: string[];
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      // Generar el hash de la contraseña
      const hash = await argon.hash(dto.password);

      // Crear el usuario en la base de datos
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          passwordHash: hash,
          profileImage: dto.profileImage,
          bio: dto.bio,
          role: dto.role,
        },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          role: true,
          profileImage: true,
          bio: true,
        },
      });

      // Generar JWT token
      const token = await this.signToken(user.id, user.email);

      // Retornar el usuario y el token
      return {
        user,
        access_token: token,
      };
    } catch (error) {
      if ((error as PrismaError).code === 'P2002') {
        throw new ForbiddenException('Credenciales ya en uso');
      }
      throw error;
    }
  }

  async signToken(userId: string, email: string): Promise<string> {
    const payload = {
      sub: userId,
      email,
    };

    return this.jwtService.signAsync(payload);
  }
}
