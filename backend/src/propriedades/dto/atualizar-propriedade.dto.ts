import { PartialType } from '@nestjs/mapped-types';
import { CriarPropriedadeDto } from './criar-propriedade.dto';

export class AtualizarPropriedadeDto extends PartialType(CriarPropriedadeDto) {}
