import { Logger } from '@nestjs/common'
import nodemailer, { Transporter } from 'nodemailer'

/**
 * Envoi de messages (e-mail, SMS, WhatsApp).
 *
 * Variables d'environnement (toutes facultatives) :
 * - E-mail GRATUIT par Gmail (prioritaire) : SMTP_USER (adresse Gmail), SMTP_PASS (mot de passe d'application Google),
 *   MAIL_FROM (ex. « Nature & Grâce <adresse@gmail.com> »), SMTP_HOST (défaut smtp.gmail.com), SMTP_PORT (défaut 465)
 * - E-mail (Resend, plus tard avec un nom de domaine) : RESEND_API_KEY, MAIL_FROM
 * - SMS (Twilio) : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM (numéro Twilio ou nom d'expéditeur autorisé)
 * - WhatsApp (Twilio) : TWILIO_WHATSAPP_FROM (ex. « whatsapp:+14155238886 » pour le bac à sable Twilio)
 *
 * Sans fournisseur configuré : en développement, le message est écrit dans le terminal de l'API (pour tester seul) ;
 * en production, rien n'est écrit (un code de connexion ne doit jamais finir dans des journaux).
 */
const logger = new Logger('Messages')
const production = () => process.env.NODE_ENV === 'production'
const TIMEOUT_MS = 10_000

export const smtpEnabled = () => Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim())
export const resendEnabled = () => Boolean(process.env.RESEND_API_KEY?.trim() && process.env.MAIL_FROM?.trim())
export const emailEnabled = () => smtpEnabled() || resendEnabled()
/** Fournisseur d'e-mail utilisé : Gmail (gratuit) en priorité, sinon Resend, sinon aucun */
export const emailProvider = (): 'smtp' | 'resend' | null => (smtpEnabled() ? 'smtp' : resendEnabled() ? 'resend' : null)

let smtp: Transporter | null = null
function smtpTransport(): Transporter {
  if (!smtp) {
    const port = Number(process.env.SMTP_PORT ?? 465) || 465
    smtp = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER!.trim(), pass: process.env.SMTP_PASS!.replace(/\s+/g, '') },
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    })
  }
  return smtp
}
export const smsEnabled = () => Boolean(twilioAuth() && process.env.TWILIO_SMS_FROM?.trim())
export const whatsappEnabled = () => Boolean(twilioAuth() && process.env.TWILIO_WHATSAPP_FROM?.trim())
/** En développement sans fournisseur, les messages s'affichent dans le terminal : le parcours reste testable */
export const devConsoleDelivery = () => !production() && !emailEnabled() && !smsEnabled()

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const token = process.env.TWILIO_AUTH_TOKEN?.trim()
  return sid && token ? { sid, token } : null
}

/** « 2250798419730 » → « +2250798419730 » */
const e164 = (digits: string) => `+${digits.replace(/\D/g, '')}`

function devLog(channel: string, to: string, text: string) {
  if (production()) return
  logger.warn(`[développement, aucun fournisseur ${channel}] À ${to} :\n${text}`)
}

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!emailEnabled()) {
    devLog('e-mail', to, `${subject}\n\n${text}`)
    return false
  }
  try {
    if (emailProvider() === 'smtp') {
      const from = process.env.MAIL_FROM?.trim() || `Nature & Grâce <${process.env.SMTP_USER!.trim()}>`
      await smtpTransport().sendMail({ from, to, subject, text })
      return true
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM!.trim(), to: [to], subject, text }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) throw new Error(`Resend ${res.status}`)
    return true
  } catch (error) {
    logger.error(`E-mail non envoyé : ${(error as Error).message}`)
    return false
  }
}

async function twilioMessage(from: string, to: string, text: string): Promise<boolean> {
  const auth = twilioAuth()!
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${auth.sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${auth.sid}:${auth.token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: from, To: to, Body: text }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Twilio ${res.status}`)
  return true
}

export async function sendSms(phoneDigits: string, text: string): Promise<boolean> {
  if (!smsEnabled()) {
    devLog('SMS', e164(phoneDigits), text)
    return false
  }
  try {
    return await twilioMessage(process.env.TWILIO_SMS_FROM!.trim(), e164(phoneDigits), text)
  } catch (error) {
    logger.error(`SMS non envoyé : ${(error as Error).message}`)
    return false
  }
}

export async function sendWhatsApp(phoneDigits: string, text: string): Promise<boolean> {
  if (!whatsappEnabled()) {
    devLog('WhatsApp', e164(phoneDigits), text)
    return false
  }
  try {
    return await twilioMessage(process.env.TWILIO_WHATSAPP_FROM!.trim(), `whatsapp:${e164(phoneDigits)}`, text)
  } catch (error) {
    logger.error(`WhatsApp non envoyé : ${(error as Error).message}`)
    return false
  }
}

/** Message court sur le téléphone : WhatsApp si configuré, sinon SMS */
export async function sendToPhone(phoneDigits: string, text: string): Promise<boolean> {
  if (whatsappEnabled()) return sendWhatsApp(phoneDigits, text)
  return sendSms(phoneDigits, text)
}

const formatXof = (v: number) => `${v.toLocaleString('fr-FR').replace(/ /g, ' ')} FCFA`

/** Alerte de la boutique à chaque nouvelle commande : WhatsApp (ou SMS) au numéro de la boutique, et e-mail si renseigné */
export async function alertNewOrder(
  order: { reference: string; customerName: string; phone: string; commune: string; totalXof: number; deliveryZone: string | null; deliveryFeeXof: number | null },
  items: { name: string; size: string; quantity: number }[],
  owner: { whatsappNumber: string; alertEmail: string },
): Promise<void> {
  const lines = items.map((i) => `- ${i.name} (${i.size}) x${i.quantity}`).join('\n')
  const fee = order.deliveryFeeXof === null ? 'à confirmer' : order.deliveryFeeXof === 0 ? 'offerte' : formatXof(order.deliveryFeeXof)
  const text = `Nouvelle commande ${order.reference} sur le site Nature & Grâce
Cliente : ${order.customerName} (${e164(order.phone)})
Livraison : ${order.commune}${order.deliveryZone ? `, zone ${order.deliveryZone}` : ''} (frais : ${fee})
${lines}
Total produits : ${formatXof(order.totalXof)}
À traiter dans l'espace boutique : /admin`
  await Promise.allSettled([
    owner.whatsappNumber ? sendToPhone(owner.whatsappNumber, text) : Promise.resolve(false),
    owner.alertEmail ? sendEmail(owner.alertEmail, `Nouvelle commande ${order.reference}`, text) : Promise.resolve(false),
  ])
}

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: 'est confirmée. Vous pouvez la payer par Wave en suivant les consignes de votre espace « Vos commandes ».',
  preparing: 'est en préparation.',
  shipped: 'est en route. Le livreur vous contactera à l’approche.',
  delivered: 'est livrée. Merci ! Votre avis aide d’autres clientes : donnez-le depuis « Vos commandes ».',
  cancelled: 'a été annulée. Une question ? Répondez-nous sur WhatsApp.',
}

/**
 * Suivi de commande envoyé à la cliente quand la boutique change le statut :
 * par e-mail si elle a une adresse (gratuit), et sur son téléphone si un service SMS/WhatsApp est configuré.
 */
export async function notifyOrderStatus(
  order: { reference: string; phone: string; customerName: string; email?: string | null },
  status: string,
): Promise<void> {
  const message = STATUS_MESSAGES[status]
  if (!message) return
  const firstName = order.customerName.split(' ')[0]
  const text = `Bonjour ${firstName}, votre commande Nature & Grâce ${order.reference} ${message}`
  const phoneService = smsEnabled() || whatsappEnabled()
  await Promise.allSettled([
    order.email ? sendEmail(order.email, `Votre commande ${order.reference}`, `${text}\n\nVous recevez ce message car vous avez passé commande sur le site Nature & Grâce.`) : Promise.resolve(false),
    // Sans service téléphone : en développement, le message s'affiche dans le terminal seulement s'il n'y a pas d'e-mail
    order.phone && (phoneService || !order.email) ? sendToPhone(order.phone, text) : Promise.resolve(false),
  ])
}
