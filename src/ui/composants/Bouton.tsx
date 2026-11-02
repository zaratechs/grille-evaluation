import type { ComponentPropsWithRef } from 'react';

export type Variante = 'principal' | 'secondaire' | 'danger';

const STYLES: Record<Variante, string> = {
  principal: 'border-marque-700 bg-marque-700 text-surface hover:bg-marque-800',
  secondaire: 'border-bordure-champ bg-surface text-marque-700 hover:bg-marque-50',
  danger: 'border-statut-erreur bg-surface text-statut-erreur hover:bg-statut-erreur-fond',
};

type Props = ComponentPropsWithRef<'button'> & { variante?: Variante };

/** Bouton sobre ; `type="button"` par défaut, pour ne jamais soumettre un formulaire par accident. */
export function Bouton({
  variante = 'secondaire',
  type = 'button',
  className = '',
  ...reste
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-9 items-center rounded-champ border px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60 ${STYLES[variante]} ${className}`}
      {...reste}
    />
  );
}
