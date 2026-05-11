import { IsNotEmpty, IsString } from 'class-validator';

export class ReagendarAgendamentoDto {
  @IsString()
  @IsNotEmpty()
  availabilityId!: string;

  @IsString()
  @IsNotEmpty()
  justification!: string;
}
