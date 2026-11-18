import 'reflect-metadata'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizePhone } from '../src/customer.controller'
import { stripEmojis } from '../src/gemini.service'
import { ChatService } from '../src/chat.service'
import { assertCaptcha } from '../src/captcha'

test('numéro ivoirien : formats acceptés, normalisés en 225 + 10 chiffres', () => {
  assert.equal(normalizePhone('07 98 41 97 30'), '2250798419730')
  assert.equal(normalizePhone('+225 0798419730'), '2250798419730')
  assert.equal(normalizePhone('002250798419730'), '2250798419730')
  assert.throws(() => normalizePhone('12345'))
  assert.throws(() => normalizePhone('+33 6 12 34 56 78'))
})

test('emojis retirés des textes de l’IA, texte conservé', () => {
  assert.equal(stripEmojis('Bonjour ✨ peau 🌿 douce 👩🏾‍🦱').replace(/\s+/g, ' ').trim(), 'Bonjour peau douce')
  assert.equal(stripEmojis('Prix : 1 500 FCFA'), 'Prix : 1 500 FCFA')
})

test('captcha désactivé sans clé secrète', async () => {
  delete process.env.TURNSTILE_SECRET
  await assert.doesNotReject(assertCaptcha(undefined, { ip: '127.0.0.1' } as never, 'login'))
})

// Faux catalogue : la conseillère (mode sans IA) doit répondre avec les données réelles, sans rien inventer
const product = (over: Record<string, unknown>) => ({
  category: 'Beurre de cacao', size: '100 g', priceXof: 1500, stock: 4, description: 'Un beurre brut.',
  benefits: [], howToUse: [], ingredients: '', origin: '', ...over,
})
const db = {
  product: {
    findMany: async () => [
      product({ slug: 'beurre-de-cacao-brut', name: 'Beurre de cacao brut', howToUse: ['Prélevez une noisette', 'Massez sur peau humide'] }),
      product({ slug: 'savon-noir', name: 'Savon noir de cabosse', category: 'Savons naturels', priceXof: 2000, stock: 0 }),
      product({ slug: 'huile-de-coco', name: 'Huile de coco', category: 'Huiles naturelles', size: 'À confirmer', priceXof: null }),
    ],
  },
  storeSettings: {
    findUnique: async () => ({
      whatsappNumber: '2250798419730', deliveryCommunes: 'Abidjan, Bouaké, Daloa', deliveryInfo: 'Frais confirmés avant validation.',
      waveInstructions: 'Payez par Wave après confirmation.', storeAddress: '',
      deliveryZones: [{ name: 'Cocody', feeXof: 1000, delay: '24 h' }, { name: 'Bouaké', feeXof: null }],
    }),
  },
}
const chat = new ChatService(db as never, { ai: null, takeQuota: () => false } as never)
const ask = (text: string, productSlug?: string) => chat.reply([{ role: 'user', text }], productSlug)

test('chat : frais de livraison réels par zone', async () => {
  const r = await ask('Vous livrez à Cocody ? Combien ?')
  assert.match(r.reply, /Cocody : 1\s?000 FCFA/)
  assert.match(r.reply, /Bouaké : frais à confirmer/)
})

test('chat : prix inconnu jamais inventé', async () => {
  const r = await ask('Combien coûte l’huile de coco ?')
  assert.match(r.reply, /prix sur demande/)
  assert.deepEqual(r.productIds, ['huile-de-coco'])
})

test('chat : rupture signalée et utilisation tirée de la fiche', async () => {
  assert.match((await ask('Comment utiliser le beurre de cacao ?')).reply, /Prélevez une noisette/)
  assert.match((await ask('ce soin convient aux peaux grasses ?', 'savon-noir')).reply, /rupture/)
})

test('chat : hors sujet renvoyé vers la boutique', async () => {
  const r = await ask('Quel temps fait-il à Paris ?')
  assert.match(r.reply, /WhatsApp au \+225 07 98 41 97 30/)
  assert.deepEqual(r.productIds, [])
})
