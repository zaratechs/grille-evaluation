import { Vue } from '../../layout';
import { Niveaux } from './Niveaux';
import { Parametres } from './Parametres';

/** Construire la grille : paramètres, niveaux, puis critères (tâche 5) et modèles (tâche 6). */
export function GrillePage() {
  return (
    <Vue titre="Grille">
      <div className="flex flex-col gap-8">
        <Parametres />
        <Niveaux />
      </div>
    </Vue>
  );
}
