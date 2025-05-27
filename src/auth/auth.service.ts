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

  /*
  FUNCIÓN DE REGISTRO:
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
  async register(dto: RegisterDto) {
    try {
      // Verificar que el DTO no sea null o undefined
      if (!dto) {
        throw new BadRequestException('Los datos del usuario son requeridos');
      }

      // Verificar que todos los campos requeridos estén presentes y no sean strings vacíos
      if (!dto.email || dto.email.trim() === '') {
        throw new BadRequestException(
          'El email es requerido y no puede estar vacío',
        );
      }

      if (!dto.username || dto.username.trim() === '') {
        throw new BadRequestException(
          'El username es requerido y no puede estar vacío',
        );
      }

      if (!dto.password || dto.password.trim() === '') {
        throw new BadRequestException(
          'La contraseña es requerida y no puede estar vacía',
        );
      }

      // Validaciones adicionales
      if (dto.password.length < 8) {
        throw new BadRequestException(
          'La contraseña debe tener al menos 8 caracteres',
        );
      }

      // Validar formato de email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.email)) {
        throw new BadRequestException('El formato del email no es válido');
      }

      // Generar el hash de la contraseña
      const hash = await argon.hash(dto.password);

      // Crear el usuario en la base de datos
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.trim().toLowerCase(),
          username: dto.username.trim(),
          passwordHash: hash,
          profileImage: dto.profileImage?.trim() || null,
          bio: dto.bio?.trim() || null,
          role: dto.role || 'AFICIONADO',
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
      // Si ya es una excepción de NestJS, la relanzamos
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Error de campos únicos duplicados (email o username ya existen)
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as PrismaKnownError;
        if (prismaError.code === 'P2002' && prismaError.meta?.target) {
          const field = prismaError.meta.target[0] || 'campo';
          const fieldName =
            field === 'email'
              ? 'email'
              : field === 'username'
                ? 'nombre de usuario'
                : field;
          throw new ForbiddenException(`El ${fieldName} ya está en uso`);
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

      // Errores durante el hashing de la contraseña
      if (error && error instanceof Error && error.message.includes('argon2')) {
        throw new BadRequestException('Error al procesar la contraseña');
      }

      // Para cualquier otro error, devolvemos un mensaje genérico
      console.error('Error inesperado en registro:', error);
      throw new BadRequestException(
        'Error interno del servidor. Por favor, intente de nuevo más tarde.',
      );
    }
  }

  /*
  FUNCIÓN DE LOGIN:
  Ejemplo de body para login:
  {
    "email": "usuario@ejemplo.com",
    "password": "contraseña123"
  }
  */

  async login(dto: LoginDto) {
    try {
      // Verificar que el DTO no sea null o undefined
      if (!dto) {
        throw new BadRequestException('Las credenciales son requeridas');
      }

      // Verificar que todos los campos requeridos estén presentes y no sean strings vacíos
      if (!dto.email || dto.email.trim() === '') {
        throw new BadRequestException(
          'El email es requerido y no puede estar vacío',
        );
      }

      if (!dto.password || dto.password.trim() === '') {
        throw new BadRequestException(
          'La contraseña es requerida y no puede estar vacía',
        );
      }

      // Validar formato de email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.email)) {
        throw new BadRequestException('El formato del email no es válido');
      }

      // Buscar el usuario por email (normalizado)
      const user = await this.prisma.user.findUnique({
        where: {
          email: dto.email.trim().toLowerCase(),
        },
      });

      // Si no existe el usuario, lanzar excepción
      if (!user) {
        throw new UnauthorizedException('Credenciales incorrectas');
      }

      // Verificar la contraseña
      const passwordMatches = await argon.verify(
        user.passwordHash,
        dto.password,
      );

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
    } catch (error) {
      // Si ya es una excepción de NestJS, la relanzamos
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Error de validación o consulta de Prisma
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message;

        if (errorMessage.includes('Prisma')) {
          throw new BadRequestException(
            'Error al procesar la solicitud de inicio de sesión',
          );
        }
      }

      // Errores inesperados durante la verificación de contraseña
      if (error && error instanceof Error && error.message.includes('argon2')) {
        throw new BadRequestException('Error al verificar las credenciales');
      }

      // Para cualquier otro error, devolvemos un mensaje genérico para no exponer detalles internos
      console.error('Error inesperado en login:', error);
      throw new UnauthorizedException(
        'Error al iniciar sesión, por favor intente de nuevo',
      );
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
