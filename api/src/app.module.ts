import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AdminGuard } from './auth'
import { AppController } from './app.controller'
import { PrismaService } from './prisma.service'
import { GeminiService } from './gemini.service'

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '8h' } })],
  controllers: [AppController],
  providers: [PrismaService, AdminGuard, GeminiService],
})
export class AppModule {}

