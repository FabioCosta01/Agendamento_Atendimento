import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class TrocarSenhaObrigatoriaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'A nova senha deve ter no minimo 6 digitos' })
  newPassword!: string;
}
