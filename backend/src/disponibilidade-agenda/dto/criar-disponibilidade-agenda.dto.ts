import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CriarDisponibilidadeAgendaDto {
  @IsString()
  @IsNotEmpty()
  extensionistId!: string;

  @IsString()
  @IsNotEmpty()
  municipalityId!: string;

  @Type(() => Date)
  @IsDate()
  startDateTime!: Date;

  @Type(() => Date)
  @IsDate()
  endDateTime!: Date;

  @IsInt()
  @Min(1)
  @Max(20)
  capacity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
