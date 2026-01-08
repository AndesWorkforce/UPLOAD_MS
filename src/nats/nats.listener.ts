import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { envs, getMessagePattern } from 'config';

@Controller()
export class NatsListener {
  private readonly logger = new Logger(NatsListener.name);

  @MessagePattern(getMessagePattern('upload.health'))
  health() {
    const timestamp = new Date().toISOString();
    this.logger.debug(`Health check requested at ${timestamp}`);

    return {
      status: 'ok',
      service: 'upload_ms',
      transport: 'nats',
      environment: envs.environment,
      timestamp,
    };
  }
}
