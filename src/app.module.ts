import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { S3FakeModule } from './s3fake/s3fake.module';
import { RiffusionModule } from './riffusion/riffusion.module';
import { TracksModule } from './tracks/tracks.module';
import { MinimaxModule } from './minimax/minimax.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    S3FakeModule,
    RiffusionModule,
    TracksModule,
    MinimaxModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
