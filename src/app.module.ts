import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import envs from '../config/envs';
import { NatsModule } from './nats/nats.module';
import { S3Module } from './s3/s3.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envs],
    }),
    NatsModule,
    S3Module,
    ReportsModule,
  ],
  controllers: [],
  providers: [
    // TODO: Configurar AUTH_SERVICE para usar los guards globales
    // Cuando se habilite autenticación, descomentar:
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthGuard,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
  ],
})
export class AppModule {}
