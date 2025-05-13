import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as argon from 'argon2';

/*
  Ejemplo de body para registro:
  {
    "email": "usuario@ejemplo.com",
    "username": "usuario123",
    "password": "contraseña123",
    "profileImage": "https://ejemplo.com/imagen.jpg", // opcional
    "bio": "Breve descripción del usuario", // opcional
    "role": "AFICIONADO" // opcional, valores permitidos: AFICIONADO, PROFESIONAL, PRODUCTOR, COMPOSITOR
  }
*/

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

  async login(dto: LoginDto) {
    // Buscar el usuario por email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    // Si no existe el usuario, lanzar excepción
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Verificar la contraseña
    const passwordMatches = await argon.verify(user.passwordHash, dto.password);

    // Si la contraseña no coincide, lanzar excepción
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Generar JWT token
    const token = await this.signToken(user.id, user.email);

    // Retornar el usuario (sin la contraseña) y el token
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
      },
      access_token: token,
    };
  }

  async signToken(userId: string, email: string): Promise<string> {
    const payload = {
      sub: userId,
      email,
    };

    return this.jwtService.signAsync(payload);
  }
}
