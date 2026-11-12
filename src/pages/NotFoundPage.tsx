import React from 'react'
import { ArrowRight, Leaf } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { usePageMeta } from '../hooks/usePageMeta'

export const NotFoundPage: React.FC = () => {
  const { navigate } = useApp()
  usePageMeta('Page introuvable')

  return (
    <div className="ng-container ng-subpage">
      <div className="ng-empty ng-empty--icon ng-404">
        <span className="ng-empty-ico">
          <Leaf size={28} />
        </span>
        <h3>Cette page n’existe pas</h3>
        <p>Le lien est peut-être ancien ou mal recopié.</p>
        <div className="ng-hero-actions">
          <button type="button" className="ng-btn ng-btn--primary" onClick={() => navigate('/boutique')}>
            Voir la boutique <ArrowRight size={16} />
          </button>
          <button type="button" className="ng-btn ng-btn--ghost" onClick={() => navigate('/')}>
            Accueil
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
