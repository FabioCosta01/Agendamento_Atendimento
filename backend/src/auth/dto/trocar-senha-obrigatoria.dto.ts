import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class TrocarSenhaObrigatoriaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'A nova senha deve ter pelo menos 8 caracteres' })
  newPassword!: string;
}
