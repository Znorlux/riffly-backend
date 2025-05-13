import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// Definir el enum localmente en lugar de importarlo de Prisma
export enum UserRole {
  AFICIONADO = 'AFICIONADO',
  PROFESIONAL = 'PROFESIONAL',
  PRODUCTOR = 'PRODUCTOR',
  COMPOSITOR = 'COMPOSITOR',
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
