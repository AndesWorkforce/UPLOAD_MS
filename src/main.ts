import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { envs, getLogModeMessage, resolveLogLevels } from 'config';

import { AppModule } from './app.module';
import { RpcExceptionFilter } from './common/filters/rpc-exception.filter';

async function bootstrap() {
  const logLevels = resolveLogLevels();
  Logger.overrideLogger(logLevels);

  const logger = new Logger('Main');
  const log = (message: string) => logger.log(message);

  try {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        transport: Transport.NATS,
        options: {
          servers: [`nats://${envs.natsHost}:${envs.natsPort}`],
          user: envs.natsUsername,
          pass: envs.natsPassword,
        },
        logger: logLevels,
      },
    );

    app.useGlobalFilters(new RpcExceptionFilter());

    const modeMessage = getLogModeMessage();
    if (envs.devLogsEnabled) {
      logger.verbose(modeMessage);
    } else {
      logger.warn(modeMessage);
    }

    await app.listen();

    log(`✅ Upload microservice is running on NATS`);
    log(`🔌 NATS Server: ${envs.natsHost}:${envs.natsPort}`);
    log(`👤 NATS User: ${envs.natsUsername}`);
  } catch (error) {
    logger.error(`❌ Error starting UPLOAD_MS: ${error.message}`);
    logger.error(
      `❌ Verify that NATS is running at: ${envs.natsHost}:${envs.natsPort}`,
    );
    throw error;
  }
}
bootstrap();
