import { PartialType } from '@nestjs/mapped-types';

import { CriarDisponibilidadeAgendaDto } from './criar-disponibilidade-agenda.dto';

export class AtualizarDisponibilidadeAgendaDto extends PartialType(CriarDisponibilidadeAgendaDto) {}
