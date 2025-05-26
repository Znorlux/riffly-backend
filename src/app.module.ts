import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { S3FakeModule } from './s3fake/s3fake.module';
import { RiffusionModule } from './riffusion/riffusion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    S3FakeModule,
    RiffusionModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
