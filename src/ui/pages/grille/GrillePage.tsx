import { Vue } from '../../layout';
import { Criteres } from './Criteres';
import { Modeles } from './Modeles';
import { Niveaux } from './Niveaux';
import { Parametres } from './Parametres';

/** Construire la grille : paramètres et modèles, niveaux, critères. */
export function GrillePage() {
  return (
    <Vue titre="Grille">
      <div className="flex flex-col gap-8">
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
