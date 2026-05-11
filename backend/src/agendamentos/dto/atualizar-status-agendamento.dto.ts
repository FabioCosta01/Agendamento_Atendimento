import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from 'shared';

export class AtualizarStatusAgendamentoDto {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @IsOptional()
  @IsString()
  extensionistId?: string;

  @IsOptional()
  @IsString()
  justification?: string;
}
