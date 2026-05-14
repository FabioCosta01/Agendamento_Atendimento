import { IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from 'shared';

export class AtualizarUsuarioDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Informe um e-mail valido' })
  email?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no minimo 6 digitos' })
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendanceMunicipalityIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
