import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export interface ValidatedDateRange {
  from: string;
  to: string;
}

/**
 * Validador de rangos de fechas para reportes
 */
@Injectable()
export class ReportDateValidator {
  /**
   * Valida el rango de fechas según reglas de negocio
   * @throws RpcException si las fechas no son válidas
   */
  validate(from: string, to: string): ValidatedDateRange {
    const fromDate = this.parseDate(from);
    const toDate = this.parseDate(to);

    this.validateDateOrder(fromDate, toDate);
    this.validateNotFuture(fromDate, toDate);

    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    };
  }

  /**
   * Convierte string a Date y valida formato
   */
  private parseDate(dateString: string): Date {
    const date = new Date(dateString);

    if (Number.isNaN(date.valueOf())) {
      throw new RpcException({
        status: 400,
        message: `Invalid date format: ${dateString}`,
      });
    }

    return date;
  }

  /**
   * Valida que from sea anterior o igual a to
   */
  private validateDateOrder(fromDate: Date, toDate: Date): void {
    if (fromDate > toDate) {
      throw new RpcException({
        status: 400,
        message: 'Start date must be before or equal to end date',
      });
    }
  }

  /**
   * Valida que las fechas no sean futuras
   */
  private validateNotFuture(fromDate: Date, toDate: Date): void {
    const now = new Date();

    if (fromDate > now || toDate > now) {
      throw new RpcException({
        status: 400,
        message: 'Dates cannot be in the future',
      });
    }
  }
}
