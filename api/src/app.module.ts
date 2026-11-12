import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { AdminGuard, CustomerGuard } from './auth'
import { CustomerController } from './customer.controller'
import { AppController } from './app.controller'
import { PrismaService } from './prisma.service'
import { GeminiService } from './gemini.service'
import { RateLimitGuard } from './rate-limit'

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '8h' } })],
  controllers: [AppController, CustomerController],
  providers: [PrismaService, AdminGuard, CustomerGuard, GeminiService, { provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
