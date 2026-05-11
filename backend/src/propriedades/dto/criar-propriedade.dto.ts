import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarPropriedadeDto {
  @IsString()
  @IsNotEmpty()
  ownerId!: string;

  @IsString()
  @IsNotEmpty()
  ownerName!: string;

  @IsString()
  @IsNotEmpty()
  ownerDocument!: string;

  @IsOptional()
  @IsString()
  ruralRegistry?: string;

  @IsOptional()
  @IsString()
  funruralCode?: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsBoolean()
  hasHabiteSe!: boolean;
}
