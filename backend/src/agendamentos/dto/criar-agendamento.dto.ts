import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarAgendamentoDto {
  @IsString()
  @IsNotEmpty()
  requesterId!: string;

  @IsOptional()
  @IsString()
  extensionistId?: string;

  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsOptional()
  @IsString()
  availabilityId?: string;

  @Type(() => Date)
  @IsDate()
  preferredDate!: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  justification?: string;
}
