import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';

// Definir el enum localmente en lugar de importarlo de Prisma
export enum UserRole {
  AFICIONADO = 'AFICIONADO',
  PROFESIONAL = 'PROFESIONAL',
  PRODUCTOR = 'PRODUCTOR',
  COMPOSITOR = 'COMPOSITOR',
}

export class RegisterDto {
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString({ message: 'El username debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El username es requerido' })
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
  @MaxLength(30, { message: 'El username no puede tener más de 30 caracteres' })
  username: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, {
    message: 'La contraseña no puede tener más de 100 caracteres',
  })
  password: string;

  @IsOptional()
  @IsString({ message: 'La imagen de perfil debe ser una cadena de texto' })
  @IsUrl({}, { message: 'La imagen de perfil debe ser una URL válida' })
  profileImage?: string;

  @IsOptional()
  @IsString({ message: 'La biografía debe ser una cadena de texto' })
  @MaxLength(500, {
    message: 'La biografía no puede tener más de 500 caracteres',
  })
  bio?: string;

  @IsEnum(UserRole, {
    message:
      'El rol debe ser uno de: AFICIONADO, PROFESIONAL, PRODUCTOR, COMPOSITOR',
  })
  @IsOptional()
  role?: UserRole;
}
