import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from 'shared';

export class CriarUsuarioDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail({}, { message: 'Informe um e-mail valido' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  document!: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no minimo 6 digitos' })
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendanceMunicipalityIds?: string[];
}
