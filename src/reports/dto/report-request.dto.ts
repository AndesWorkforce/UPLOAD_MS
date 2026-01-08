import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ReportRequestDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contractor_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  client_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  team_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  job_position?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false)
  useCache?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedFields?: string[];
}
