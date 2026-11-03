import { useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { nouvelId } from '../../../data-access';
import {
  ajouterEtudiant,
  calculerResultat,
  deplacerEtudiant,
  renommerEtudiant,
  retirerEtudiant,
  synthese,
  type CodeErreur,
  type Etudiant,
} from '../../../domain';
import { accorder, pertesEtudiant, texteNote, texteResultat } from '../../../textes';
import { Bouton, Champ, Dialogue, FenetreSaisie } from '../../composants';
import { useDossier } from '../../etat';
import { Vue } from '../../layout';
import { MESSAGES_ERREUR } from '../../messages';

/** Ajouter une personne : le champ se vide et garde le focus, pour enchaîner. */
function Ajout() {
  const { modifier } = useDossier();
  const [nom, setNom] = useState('');
  const [code, setCode] = useState<CodeErreur | undefined>();
  const champ = useRef<HTMLInputElement>(null);

  const ajouter = (e: FormEvent) => {
    e.preventDefault();
    const id = nouvelId();
    const r = modifier((d) => ajouterEtudiant(d, id, nom));
    if (r.ok) setNom('');
    else setCode(r.erreur);
    champ.current?.focus();
  };

  return (
    <form onSubmit={ajouter} className="flex flex-wrap items-end gap-2">
      <Champ
        className="min-w-0 flex-1 sm:max-w-md"
        etiquette="Nom de la personne étudiante"
        valeur={nom}
        surSaisie={(t) => {
          setNom(t);
          setCode(undefined);
        }}
        erreur={code && MESSAGES_ERREUR[code]}
        refChamp={champ}
      />
      <Bouton type="submit" variante="principal">
        Ajouter
      </Bouton>
    </form>
  );
}

function Synthese() {
  const { dossier } = useDossier();
  const s = synthese(dossier);
  const id = useId();
  const { grille } = dossier;
  return (
    <section aria-labelledby={id} className="rounded-carte bg-surface-attenue p-4 text-sm">
      <h2 id={id} className="font-semibold text-texte">
        Synthèse du groupe
      </h2>
      {s.moyenne && s.mediane ? (
        <ul className="mt-1 text-texte">
          <li>
            {accorder(s.completes, 'évaluation complète', 'évaluations complètes')} sur {s.total}
          </li>
          <li>Moyenne : {texteNote(grille, s.moyenne)}</li>
          <li>Médiane : {texteNote(grille, s.mediane)}</li>
        </ul>
      ) : (
        <p className="mt-1 text-texte">Aucune évaluation complète sur {s.total}.</p>
      )}
    </section>
  );
}

/** Le groupe : ajouter, renommer, ordonner, retirer ; état de chaque évaluation ; synthèse. */
export function GroupePage() {
  const { dossier, modifier } = useDossier();
  const [renommer, setRenommer] = useState<Etudiant | null>(null);
  const [retirer, setRetirer] = useState<{ etudiant: Etudiant; pertes: string[] } | null>(null);
  const { etudiants, grille } = dossier;
  const enleve = (e: Etudiant) => modifier((d) => retirerEtudiant(d, e.id));

  return (
    <Vue titre="Groupe">
      <div className="flex flex-col gap-6">
        <Ajout />
        {etudiants.length === 0 ? (
          <p className="text-sm text-texte-attenue">
            Aucune personne étudiante pour l’instant. Ajoutez-les une à une : Entrée valide et garde
            le curseur dans le champ.
          </p>
        ) : (
          <>
            <Synthese />
            <table className="w-full border-collapse text-sm max-sm:block">
              <thead className="max-sm:sr-only">
                <tr className="border-b border-bordure text-left">
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Nom
                  </th>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Évaluation
                  </th>
                  <th scope="col" className="py-2 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="max-sm:block">
                {etudiants.map((e, i) => (
                  <tr
                    key={e.id}
                    className="border-b border-bordure max-sm:flex max-sm:flex-col max-sm:gap-1 max-sm:py-3"
                  >
                    <th scope="row" className="py-2 pr-4 text-left font-medium max-sm:py-0">
                      {e.nom}
                    </th>
                    <td className="py-2 pr-4 text-texte-attenue max-sm:py-0">
                      {texteResultat(grille, calculerResultat(grille, e))}
                    </td>
                    <td className="py-2 max-sm:py-0">
                      <div className="flex flex-wrap gap-1">
                        <Link
                          to={`/evaluation?personne=${encodeURIComponent(e.id)}`}
                          className="inline-flex min-h-9 items-center rounded-champ border border-marque-700 bg-marque-700 px-3 py-1.5 text-sm font-medium text-surface hover:bg-marque-800"
                        >
                          Évaluer
                        </Link>
                        <Bouton onClick={() => setRenommer(e)}>Renommer</Bouton>
                        <Bouton
                          disabled={i === 0}
                          onClick={() => modifier((d) => deplacerEtudiant(d, e.id, 'haut'))}
                        >
                          Monter
                        </Bouton>
                        <Bouton
                          disabled={i === etudiants.length - 1}
                          onClick={() => modifier((d) => deplacerEtudiant(d, e.id, 'bas'))}
                        >
                          Descendre
                        </Bouton>
                        <Bouton
                          variante="danger"
                          onClick={() => {
                            const p = pertesEtudiant(e);
                            if (p.length === 0) enleve(e);
                            else setRetirer({ etudiant: e, pertes: p });
                          }}
                        >
                          Retirer
                        </Bouton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {renommer && (
        <FenetreSaisie
          titre={`Renommer ${renommer.nom}`}
          etiquette="Nom"
          valeurInitiale={renommer.nom}
          valider="Renommer"
          fermer={() => setRenommer(null)}
          surValider={(nom) => modifier((d) => renommerEtudiant(d, renommer.id, nom))}
        />
      )}
      <Dialogue
        ouvert={retirer !== null}
        titre={`Retirer ${retirer?.etudiant.nom ?? ''} ?`}
        confirmer="Retirer la personne"
        surAnnuler={() => setRetirer(null)}
        surConfirmer={() => {
          if (retirer) enleve(retirer.etudiant);
          setRetirer(null);
        }}
      >
        {retirer?.pertes.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Dialogue>
    </Vue>
  );
}
