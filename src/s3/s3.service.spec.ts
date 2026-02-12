import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';

describe('S3Service', () => {
  let service: S3Service;

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
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
