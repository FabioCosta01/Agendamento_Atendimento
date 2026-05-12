import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RecuperarSenhaDto {
  @Transform(({ value }) => String(value ?? '').replace(/\D/g, ''))
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'CPF invalido' })
  document!: string;

  @Transform(({ value }) => String(value ?? '').replace(/\D/g, ''))
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Telefone invalido' })
  phone!: string;
}
