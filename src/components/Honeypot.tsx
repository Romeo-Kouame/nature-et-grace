import React from 'react'

/**
 * Champ piège anti-spam : invisible pour les visiteurs (et ignoré par les lecteurs d'écran),
 * mais les robots qui remplissent tous les champs le complètent, et le serveur refuse alors l'envoi.
 * Pour un formulaire contrôlé, passer `value` et `onChange`.
 */
export const Honeypot: React.FC<{ value?: string; onChange?: (v: string) => void }> = ({ value, onChange }) => (
  <div className="ng-hp" aria-hidden="true">
    <label>
      Ne pas remplir ce champ
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        {...(onChange ? { value: value ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) } : {})}
      />
    </label>
  </div>
)

export default Honeypot
