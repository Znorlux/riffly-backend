import { Module } from '@nestjs/common';
import { S3FakeController } from './s3fake.controller';
import { S3FakeService } from './s3fake.service';

@Module({
  controllers: [S3FakeController],
  providers: [S3FakeService],
  exports: [S3FakeService],
})
export class S3FakeModule {}
