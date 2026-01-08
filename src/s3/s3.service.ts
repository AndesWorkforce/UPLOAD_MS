import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
export enum FileType {
  DOCUMENT = 'reports',
  PDF = 'pdfs',
}

@Injectable()
export class S3Service {
  private s3: AWS.S3;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('envs.aws.region');
    const bucketName = this.configService.get<string>(
      'envs.aws.s3Bucket',
    );
    const accessKeyId = this.configService.get<string>(
      'envs.aws.accessKeyId',
    );
    const secretAccessKey = this.configService.get<string>(
      'envs.aws.secretAccessKey',
    );
    this.logger.log(bucketName, accessKeyId, secretAccessKey);
    
    if (!bucketName || !accessKeyId || !secretAccessKey) {
      throw new Error('Faltan credenciales de AWS');
    }

    this.region = region || 'us-east-2';
    this.bucketName = bucketName;
    this.logger.log(`AWS S3 configured with bucket: ${this.bucketName} in region: ${this.region}`);

    // Configurar AWS SDK
    AWS.config.update({
      region: this.region,
      accessKeyId,
      secretAccessKey,
    });

    this.s3 = new AWS.S3();
  }

  async uploadFile(
    file: Express.Multer.File,
    type: FileType = FileType.DOCUMENT,
    folder?: string,
    explicitKey?: string,
  ): Promise<string> {
    try {
      const finalFolder = folder || this.getBasePath(type);
      const fileExt = file.originalname.split('.').pop() || '';
      const fileName = `${uuidv4()}.${fileExt}`;
      const key =
        explicitKey && explicitKey.trim().length > 0
          ? explicitKey
          : `${finalFolder}/${fileName}`;

      this.logger.log(`Uploading file to S3: ${finalFolder}/${fileName}`);

      await this.s3
        .putObject({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
        .promise();

      return this.getPublicUrl(key);
    } catch (error) {
      this.logger.error(`Error al subir archivo: ${error}`);
      throw new BadRequestException('Error al subir el archivo');
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType = 'application/pdf',
  ): Promise<string> {
    try {
      await this.s3
        .putObject({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
        .promise();

      return this.getPublicUrl(key);
    } catch (error) {
      this.logger.error(`Error al subir buffer: ${error}`);
      throw new BadRequestException('Error al subir el archivo');
    }
  }

  async testConnection(){
    try {
      this.logger.log('Probando conexión con el servicio de almacenamiento...');

      const response = await this.s3.listBuckets().promise();

      return {
        status: 'success',
        message: 'Conexión exitosa al servicio de almacenamiento',
        bucketName: this.bucketName,
        endpoint: this.configService.get<string>('environments.aws.endpoint'),
        bucketsAvailable: response.Buckets?.length || 0,
      };
    } catch (error) {
      this.logger.error('Error al conectar con S3:', error);
      return false;
    }
  }

  private getBasePath(type: FileType): string {
    const paths: Record<FileType, string> = {
      [FileType.DOCUMENT]: 'reports',
      [FileType.PDF]: 'pdfs',
    };
    const path = paths[type];
    if (!path) {
      throw new BadRequestException(`Tipo de archivo no soportado: ${type}`);
    }
    return path;
  }

  private getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
