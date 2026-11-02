import { changerTitre, changerTotalPoints, lireTotalPoints } from '../../../domain';
import { ChampDossier } from '../../composants';
import { useDossier } from '../../etat';

/** Titre de la grille et total de points. */
export function Parametres() {
  const { dossier, modifier } = useDossier();
  const { titre, totalPoints } = dossier.grille;
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
      <ChampDossier
        etiquette="Titre de la grille"
        valeur={titre}
        appliquer={(texte) => modifier((d) => changerTitre(d, texte))}
      />
      <ChampDossier
        etiquette="Total de points"
        modeSaisie="decimal"
        valeur={String(totalPoints).replace('.', ',')}
        appliquer={(texte) =>
          modifier((d) => {
            const total = lireTotalPoints(texte);
            return total.ok ? changerTotalPoints(d, total.valeur) : total;
          })
        }
      />
    </div>
  );
}
