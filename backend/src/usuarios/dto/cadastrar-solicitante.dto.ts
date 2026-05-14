import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CadastrarSolicitanteDto {
  @IsString()
  @IsNotEmpty()
  document!: string;

  @IsEmail({}, { message: 'Informe um e-mail valido' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no minimo 6 digitos' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  community!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;
}

