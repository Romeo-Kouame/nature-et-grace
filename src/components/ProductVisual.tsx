import React, { useState } from 'react'
import { productLook } from '../data/products'

type Props = {
  product: { id: string; name: string; category: string; imageUrl?: string | null; size?: string }
  /** 'card' : vignette de grille · 'hero' : grande image de fiche · 'thumb' : miniature (panier) */
  size?: 'card' | 'hero' | 'thumb'
  className?: string
}

const PALETTE: Record<string, { bg: string; body: string; dark: string; lid: string; label: string }> = {
  cocoa: { bg: '#efe4cf', body: '#d7b98a', dark: '#b8935e', lid: '#7a5634', label: '#fffaf0' },
  whip: { bg: '#f1ece0', body: '#efe3c8', dark: '#d8c49c', lid: '#a8804f', label: '#fffdf7' },
  soap: { bg: '#e3e1d6', body: '#4a3f33', dark: '#2f271f', lid: '#4a3f33', label: '#f3ead6' },
  coconut: { bg: '#e6ece0', body: '#c9b77c', dark: '#a8975f', lid: '#5d4a31', label: '#fffaf0' },
  neem: { bg: '#dde6d6', body: '#7f8f55', dark: '#5f6d3d', lid: '#3d4a2a', label: '#f6f3e4' },
  shea: { bg: '#f0e7d3', body: '#e0c27d', dark: '#c3a15a', lid: '#6b5331', label: '#fffaf0' },
  gift: { bg: '#e4ece6', body: '#0e4a35', dark: '#0a3626', lid: '#c59d4f', label: '#f6f0dd' },
}

/** Nom court pour l'étiquette : « Beurre de cacao brut » → « Beurre de cacao » */
const LINK_WORDS = new Set(['de', 'du', 'des', 'à', 'au', 'aux', 'en', 'la', 'le', 'les', 'et', '–', '-'])
function shortLabel(name: string) {
  const words = name.replace(/\(.*?\)/g, '').split(/\s[–-]\s/)[0].trim().split(/\s+/).slice(0, 3)
  // On ne finit jamais sur un mot de liaison (« Savon noir de » → « Savon noir »)
  while (words.length > 1 && LINK_WORDS.has(words[words.length - 1].toLowerCase())) words.pop()
  return words.join(' ')
}

/**
 * Photo du produit si elle existe, sinon une illustration dessinée aux couleurs de la marque.
 * L'illustration annonce clairement « visuel d'illustration » pour ne pas être prise pour une photo.
 */
export const ProductVisual: React.FC<Props> = ({ product, size = 'card', className = '' }) => {
  const [failed, setFailed] = useState(false)
  if (product.imageUrl && !failed) {
    return (
      <img
        className={`ng-visual-photo ${className}`}
        src={product.imageUrl}
        alt={product.name}
        loading={size === 'hero' ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
      />
    )
  }

  const { shape, tone } = productLook(product)
  const c = PALETTE[tone] ?? PALETTE.cocoa
  const label = shortLabel(product.name)
  const showText = size === 'hero'

  return (
    <svg
      className={`ng-visual ng-visual--${size} ${className}`}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`${product.name} (illustration)`}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="200" height="200" fill={c.bg} />
      <circle cx="100" cy="98" r="70" fill="#ffffff" opacity="0.35" />
      <circle cx="100" cy="98" r="86" fill="none" stroke="#ffffff" strokeOpacity="0.5" />
      {/* feuilles */}
      <path d="M38 150c10-26 30-34 44-30-6 16-24 30-44 30z" fill="#6f8a5c" opacity="0.55" />
      <path d="M162 46c-8 20-24 27-36 24 5-13 20-24 36-24z" fill="#6f8a5c" opacity="0.45" />
      <ellipse cx="100" cy="160" rx="54" ry="7" fill="#000" opacity="0.08" />

      {shape === 'jar' && (
        <g>
          <rect x="58" y="66" width="84" height="20" rx="5" fill={c.lid} />
          <rect x="54" y="84" width="92" height="74" rx="14" fill={c.body} />
          <rect x="54" y="140" width="92" height="18" rx="9" fill={c.dark} opacity="0.35" />
          <rect x="68" y="100" width="64" height="34" rx="6" fill={c.label} opacity="0.95" />
          <text x="100" y="116" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0e4a35" fontFamily="Georgia, serif">N&amp;G</text>
          <text x="100" y="128" textAnchor="middle" fontSize="6.5" letterSpacing="1" fill="#7a6545">NATUREL</text>
        </g>
      )}
      {shape === 'bar' && (
        <g transform="rotate(-8 100 116)">
          <rect x="46" y="88" width="108" height="58" rx="18" fill={c.body} />
          <rect x="46" y="128" width="108" height="18" rx="9" fill={c.dark} opacity="0.6" />
          <rect x="62" y="102" width="76" height="22" rx="11" fill="none" stroke={c.label} strokeOpacity="0.7" />
          <text x="100" y="117" textAnchor="middle" fontSize="10" fontWeight="800" fill={c.label} fontFamily="Georgia, serif">N&amp;G</text>
        </g>
      )}
      {shape === 'bottle' && (
        <g>
          <rect x="88" y="42" width="24" height="20" rx="4" fill={c.lid} />
          <rect x="91" y="60" width="18" height="14" fill={c.dark} />
          <rect x="70" y="72" width="60" height="88" rx="16" fill={c.body} />
          <rect x="70" y="72" width="14" height="88" rx="7" fill="#ffffff" opacity="0.18" />
          <rect x="78" y="98" width="44" height="38" rx="6" fill={c.label} opacity="0.95" />
          <text x="100" y="116" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0e4a35" fontFamily="Georgia, serif">N&amp;G</text>
          <text x="100" y="128" textAnchor="middle" fontSize="6" letterSpacing="1" fill="#7a6545">HUILE</text>
        </g>
      )}
      {shape === 'box' && (
        <g>
          <rect x="48" y="80" width="104" height="76" rx="10" fill={c.body} />
          <rect x="44" y="70" width="112" height="22" rx="6" fill={c.dark} />
          <rect x="94" y="70" width="12" height="86" fill={c.lid} />
          <path d="M100 70c-14-18-34-14-26-2 4 6 18 4 26 2zm0 0c14-18 34-14 26-2-4 6-18 4-26 2z" fill={c.lid} />
          <text x="100" y="134" textAnchor="middle" fontSize="10" fontWeight="800" fill={c.label} fontFamily="Georgia, serif">N&amp;G</text>
        </g>
      )}

      {showText && (
        <text x="100" y="186" textAnchor="middle" fontSize="9" fontWeight="600" fill="#5b6a5f" opacity="0.8">
          {label}
        </text>
      )}
    </svg>
  )
}

export default ProductVisual
