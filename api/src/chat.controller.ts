import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common'
import { Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator'
import { ChatService } from './chat.service'
import { RateLimit } from './rate-limit'

const MINUTE = 60_000

class ChatMessageDto {
  @IsIn(['user', 'assistant']) role!: 'user' | 'assistant'
  @IsString() @MinLength(1) @MaxLength(2000) text!: string
}

class ChatDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[]
  /** Fiche produit ouverte par la cliente, pour comprendre « ce soin » */
  @IsOptional() @IsString() @MaxLength(80) productSlug?: string
}

/** Chat de la conseillère IA : questions sur les soins, la commande, la livraison et le paiement. */
@Controller('ai')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('chat')
  @HttpCode(200)
  @RateLimit('ai-chat', 30, 10 * MINUTE)
  reply(@Body() dto: ChatDto) {
    const last = dto.messages[dto.messages.length - 1]
    if (last.role !== 'user') throw new BadRequestException('Le dernier message doit être une question.')
    if (last.text.length > 1000) throw new BadRequestException('Votre message est trop long (1 000 caractères au maximum).')
    return this.chat.reply(dto.messages, dto.productSlug)
  }
}
