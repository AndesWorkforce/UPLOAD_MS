import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Controller } from './s3.controller';
import { S3Service } from './s3.service';

describe('S3Controller', () => {
  let controller: S3Controller;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'envs.aws.region': 'us-east-1',
        'envs.aws.s3Bucket': 'test-bucket',
        'envs.aws.accessKeyId': 'test-key',
        'envs.aws.secretAccessKey': 'test-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [S3Controller],
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<S3Controller>(S3Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
