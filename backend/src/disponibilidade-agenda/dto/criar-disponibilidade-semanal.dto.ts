import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class WeeklyTimeBlockDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @Matches(/^\d{2}:\d{2}$/)
  startTime!: string;

  @Matches(/^\d{2}:\d{2}$/)
  endTime!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CriarDisponibilidadeSemanalDto {
  @IsString()
  @IsNotEmpty()
  extensionistId!: string;

  @IsString()
  @IsNotEmpty()
  municipalityId!: string;

  @IsString()
  @IsNotEmpty()
  weekStartDate!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays!: number[];

  @Matches(/^\d{2}:\d{2}$/)
  startTime!: string;

  @Matches(/^\d{2}:\d{2}$/)
  endTime!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyTimeBlockDto)
  timeBlocks?: WeeklyTimeBlockDto[];

  @IsInt()
  @Min(1)
  @Max(20)
  capacity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
