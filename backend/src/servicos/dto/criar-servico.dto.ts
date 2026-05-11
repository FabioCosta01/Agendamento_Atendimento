import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CriarServicoDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  classification!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes!: number;

  @IsBoolean()
  active!: boolean;
}
