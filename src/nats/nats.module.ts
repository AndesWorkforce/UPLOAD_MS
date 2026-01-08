import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { envs } from 'config';
import { NatsListener } from './nats.listener';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [`nats://${envs.natsHost}:${envs.natsPort}`],
          user: envs.natsUsername,
          pass: envs.natsPassword,
        },
      },
      {
        name: 'ADT_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [`nats://${envs.natsHost}:${envs.natsPort}`],
          user: envs.natsUsername,
          pass: envs.natsPassword,
        },
      },
    ]),
  ],
  controllers: [NatsListener],
  exports: [ClientsModule],
})
export class NatsModule {}
