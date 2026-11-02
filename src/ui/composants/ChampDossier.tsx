import { useState, type ComponentProps } from 'react';
import type { Dossier, Resultat } from '../../domain';
import { MESSAGES_ERREUR } from '../messages';
import { Champ } from './Champ';

type Props = Omit<ComponentProps<typeof Champ>, 'valeur' | 'surSaisie' | 'erreur'> & {
  /** La valeur du dossier, telle qu'affichée hors saisie. */
  valeur: string;
  /** Applique le texte au dossier (en général : `texte => modifier(d => …)`). */
  appliquer: (texte: string) => Resultat<Dossier>;
};

type Brouillon = { texte: string; erreur: string | undefined };

/**
 * Champ relié au dossier. Pendant la saisie, le texte tapé reste tel quel (espaces compris)
 * et chaque frappe est appliquée. Un texte refusé reste dans le champ avec son message ; le
 * dossier garde alors la dernière valeur valide. En quittant un champ accepté, il affiche
 * la valeur du dossier (par exemple sans les espaces de fin).
 */
export function ChampDossier({ valeur, appliquer, surSortie, ...reste }: Props) {
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  return (
    <Champ
      {...reste}
      valeur={brouillon?.texte ?? valeur}
      erreur={brouillon?.erreur}
      surSaisie={(texte) => {
        const r = appliquer(texte);
        setBrouillon({ texte, erreur: r.ok ? undefined : MESSAGES_ERREUR[r.erreur] });
      }}
      surSortie={() => {
        if (brouillon && !brouillon.erreur) setBrouillon(null);
        surSortie?.();
      }}
    />
  );
}
