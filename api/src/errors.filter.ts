import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response } from 'express'

/**
 * Filet de sécurité pour toutes les erreurs de l'API :
 * - les erreurs prévues (400, 401, 404, 429…) gardent leur message, déjà rédigé pour le visiteur ;
 * - les erreurs imprévues sont journalisées (méthode, adresse, pile) sans le contenu de la requête,
 *   qui peut contenir des mots de passe ou des adresses, et le visiteur ne reçoit qu'un message générique.
 */
@Catch()
export class AllErrorsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Erreurs')

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      if (status >= 500) this.logger.error(`${request.method} ${request.path} → ${status} ${exception.message}`)
      response.status(status).json(exception.getResponse())
      return
    }

    // Erreurs du lecteur de requêtes (corps trop lourd, JSON mal formé) : erreurs du visiteur, pas du serveur
    const parserStatus = (exception as { status?: unknown; type?: unknown } | null)?.status
    if (typeof parserStatus === 'number' && parserStatus >= 400 && parserStatus < 500) {
      const message = parserStatus === 413 ? 'Envoi trop volumineux.' : 'Requête invalide.'
      response.status(parserStatus).json({ statusCode: parserStatus, message })
      return
    }

    const stack = exception instanceof Error ? exception.stack : String(exception)
    this.logger.error(`${request.method} ${request.path} → 500`, stack)
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: 'Une erreur est survenue. Réessayez dans un instant ou contactez la boutique sur WhatsApp.',
    })
  }
}
