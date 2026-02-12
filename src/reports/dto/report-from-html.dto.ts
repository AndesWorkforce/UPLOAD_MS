import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO para generar reporte PDF desde HTML renderizado en el frontend
 * El frontend envía el HTML completo (ya con datos y estilos) para convertir a PDF
 */
export class ReportFromHtmlDto {
  /**
   * HTML completo del reporte renderizado en el frontend
   * Incluye estilos inline, tabla de datos y métricas
   */
  @IsString()
  @IsNotEmpty()
  html: string;

  /**
   * Nombre descriptivo del reporte (para nombrar el archivo en S3)
   * @example "productivity-report-2025-01-01"
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fileName?: string;
}
