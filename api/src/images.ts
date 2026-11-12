import { BadRequestException } from '@nestjs/common'

const MAX_BYTES = 4 * 1024 * 1024

/** Signatures binaires des formats acceptés : on ne se fie pas au type annoncé par le navigateur. */
const SIGNATURES: { mime: string; test: (b: Buffer) => boolean }[] = [
  { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/webp', test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
]

/** Décode une image `data:image/...;base64,...` et vérifie qu'il s'agit bien d'une photo JPEG, PNG ou WebP. */
export function decodeImage(dataUrl: string): { mime: string; data: Uint8Array<ArrayBuffer> } {
  const match = /^data:image\/[a-z+.-]+;base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl ?? '')
  if (!match) throw new BadRequestException('Envoyez une image au format JPEG, PNG ou WebP.')
  const data = Buffer.from(match[1], 'base64')
  if (data.length > MAX_BYTES) throw new BadRequestException('Image trop lourde (4 Mo maximum).')
  const format = SIGNATURES.find((s) => s.test(data))
  if (!format) throw new BadRequestException('Format non reconnu : envoyez une photo JPEG, PNG ou WebP.')
  return { mime: format.mime, data: new Uint8Array(data) }
}

/** Référence courte d'une commande, identique côté client et côté administration. */
export const orderReference = (id: string) => id.slice(-6).toUpperCase()
