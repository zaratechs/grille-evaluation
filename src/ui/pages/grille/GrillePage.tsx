import { Vue } from '../../layout';
import { Criteres } from './Criteres';
import { Niveaux } from './Niveaux';
import { Parametres } from './Parametres';

/** Construire la grille : paramètres, niveaux, critères, puis modèles (tâche 6). */
export function GrillePage() {
  return (
    <Vue titre="Grille">
      <div className="flex flex-col gap-8">
        <Parametres />
        <Niveaux />
        <Criteres />
      </div>
    </Vue>
  );
}
