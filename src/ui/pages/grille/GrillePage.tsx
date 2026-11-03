import { useDossier } from '../../etat';
import { Vue } from '../../layout';
import { Criteres } from './Criteres';
import { Modeles } from './Modeles';
import { Niveaux } from './Niveaux';
import { Parametres } from './Parametres';
import { PourCommencer } from './PourCommencer';

/** Construire la grille : paramètres et modèles, niveaux, critères. */
export function GrillePage() {
  const { criteres } = useDossier().dossier.grille;
  return (
    <Vue titre="Grille">
      <div className="flex flex-col gap-8">
        {criteres.length === 0 && <PourCommencer />}
        <div className="flex flex-col gap-3">
          <Parametres />
          <Modeles />
        </div>
        <Niveaux />
        <Criteres />
      </div>
    </Vue>
  );
}
