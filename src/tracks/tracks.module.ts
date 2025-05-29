import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TracksController } from './tracks.controller';
import { TracksService } from './tracks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [TracksController],
  providers: [TracksService, JwtAuthGuard],
  exports: [TracksService],
})
export class TracksModule {}
