import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  document!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
