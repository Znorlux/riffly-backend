import {
  BadRequestException,
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

// Tipos para los errores de Prisma
type PrismaErrorCode = 'P2002' | 'P2000' | 'P2025';

interface PrismaKnownError {
  code: PrismaErrorCode;
  meta?: {
    target?: string[];
  };
  message: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      // Verificar que todos los campos requeridos estén presentes
      if (!dto.email || !dto.username || !dto.password) {
        throw new BadRequestException(
          'Faltan campos obligatorios: email, username y password son requeridos',
        );
      }

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
      // Error de campos únicos duplicados (email o username ya existen)
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as PrismaKnownError;
        if (prismaError.code === 'P2002' && prismaError.meta?.target) {
          const field = prismaError.meta.target[0] || 'campo';
          throw new ForbiddenException(`El ${field} ya está en uso`);
        }
      }

      // Error de validación (campos faltantes o tipos incorrectos)
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message;
        const match = errorMessage.match(/Argument `(\w+)` is missing/);
        if (match && match[1]) {
          throw new BadRequestException(
            `Falta el campo obligatorio: ${match[1]}`,
          );
        }

        if (errorMessage.includes('Prisma')) {
          throw new BadRequestException(
            'Error de validación en los datos proporcionados',
          );
        }
      }

      // Si es otro tipo de error, lo relanzamos
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
