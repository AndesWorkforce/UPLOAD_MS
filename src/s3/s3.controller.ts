import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { Role } from '../common/enums/role.enum';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { S3Service, FileType } from './s3.service';

@Roles(Role.Superadmin, Role.TeamAdmin)
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  /**
   * Endpoint HTTP para subir reportes (PDF, Excel, CSV, etc.)
   * Acepta cualquier tipo de archivo relacionado con reportes
   * Requiere autenticación y rol Superadmin o TeamAdmin
   */
  @Public()
  @Post('upload/report')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB para reportes
      },
    }),
  )
  async uploadReport(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(pdf|xlsx|xls|csv|txt)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    const targetFolder =
      folder && folder.trim().length > 0 ? folder : 'reports';
    return this.s3Service.uploadFile(file, FileType.DOCUMENT, targetFolder);
  }

  @Public()
  @Get('test-connection')
  async testConnection() {
    return this.s3Service.testConnection();
  }
}
