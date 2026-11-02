import { useId, useState } from 'react';
import {
  NIVEAUX_MAX,
  NIVEAUX_MIN,
  ajouterNiveau,
  renommerNiveau,
  retirerNiveau,
  type Dossier,
} from '../../../domain';
import { Bouton, ChampDossier, Dialogue } from '../../composants';
import { useDossier } from '../../etat';
import { MESSAGES_ERREUR } from '../../messages';

const accorder = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;

/** Ce que retirer le dernier niveau effacerait : évaluations à ce niveau, descripteurs rédigés. */
function pertes(dossier: Dossier): string[] {
  const r = retirerNiveau(dossier);
  if (!r.ok) return [];
  const dernier = dossier.grille.niveaux.length - 1;
  const descripteurs = dossier.grille.criteres.filter(
    (c) => (c.descripteurs[dernier] ?? '').trim() !== '',
  ).length;
  const evaluations = r.valeur.evaluationsEffacees;
  return [
    evaluations > 0 &&
      accorder(evaluations, 'évaluation sera effacée.', 'évaluations seront effacées.'),
    descripteurs > 0 &&
      accorder(descripteurs, 'descripteur sera effacé.', 'descripteurs seront effacés.'),
  ].filter((p): p is string => p !== false);
}

/** Libellés des niveaux, ajout et retrait du dernier (de 3 à 10). */
export function Niveaux() {
  const { dossier, modifier } = useDossier();
  const [confirmation, setConfirmation] = useState<string[] | null>(null);
  const id = useId();
  const { niveaux } = dossier.grille;
  const auMaximum = niveaux.length >= NIVEAUX_MAX;
  const auMinimum = niveaux.length <= NIVEAUX_MIN;

  const retirer = () =>
    modifier((d) => {
      const r = retirerNiveau(d);
      return r.ok ? { ok: true, valeur: r.valeur.dossier } : r;
    });

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="text-lg font-semibold text-texte">Niveaux ({niveaux.length})</legend>
      <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {niveaux.map((libelle, i) => (
          <li key={i}>
            <ChampDossier
              etiquette={`Libellé du niveau ${i + 1}`}
              valeur={libelle}
              appliquer={(texte) => modifier((d) => renommerNiveau(d, i + 1, texte))}
            />
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Bouton
          onClick={() => modifier(ajouterNiveau)}
          disabled={auMaximum}
          aria-describedby={auMaximum ? `${id}-max` : undefined}
        >
          Ajouter un niveau
        </Bouton>
        <Bouton
          variante="danger"
          disabled={auMinimum}
          aria-describedby={auMinimum ? `${id}-min` : undefined}
          onClick={() => {
            const p = pertes(dossier);
            if (p.length === 0) retirer();
            else setConfirmation(p);
          }}
        >
          Retirer le dernier niveau
        </Bouton>
        {auMaximum && (
          <span id={`${id}-max`} className="text-xs text-texte-attenue">
            {MESSAGES_ERREUR['niveaux-maximum']}
          </span>
        )}
        {auMinimum && (
          <span id={`${id}-min`} className="text-xs text-texte-attenue">
            {MESSAGES_ERREUR['niveaux-minimum']}
          </span>
        )}
      </div>
      <Dialogue
        ouvert={confirmation !== null}
        titre={`Retirer le niveau « ${niveaux.at(-1) ?? ''} » ?`}
        confirmer="Retirer le niveau"
        surAnnuler={() => setConfirmation(null)}
        surConfirmer={() => {
          retirer();
          setConfirmation(null);
        }}
      >
        {confirmation?.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Dialogue>
    </fieldset>
  );
}
