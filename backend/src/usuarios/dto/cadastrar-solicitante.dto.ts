import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CadastrarSolicitanteDto {
  @IsString()
  @IsNotEmpty()
  document!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @MinLength(8)
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

