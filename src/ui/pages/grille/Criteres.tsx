import { useEffect, useId, useRef, useState } from 'react';
import { nouvelId } from '../../../data-access';
import {
  POIDS_TOTAL,
  ajouterCritere,
  changerPoids,
  deplacerCritere,
  egaliserCriteres,
  formaterPoids,
  lirePoids,
  modifierDescripteur,
  renommerCritere,
  retirerCritere,
  totalPoids,
  type Critere,
  type Dossier,
} from '../../../domain';
import { phrasesPertes } from '../../../textes';
import { Bouton, ChampDossier, Dialogue } from '../../composants';
import { useDossier } from '../../etat';

/** 167 → « 16,7 » : le poids tel qu'on le saisit, sans le signe % (ni l'espace insécable). */
const poidsSaisi = (dixiemes: number) => formaterPoids(dixiemes).replace(/\s%$/, '');

/** « 100,0 % ✓ », « 95,0 % — il manque 5,0 % », « 110,0 % — 10,0 % de trop ». */
function texteTotal(total: number): string {
  if (total === POIDS_TOTAL) return `${formaterPoids(total)} ✓`;
  return total < POIDS_TOTAL
    ? `${formaterPoids(total)} — il manque ${formaterPoids(POIDS_TOTAL - total)}`
    : `${formaterPoids(total)} — ${formaterPoids(total - POIDS_TOTAL)} de trop`;
}

/** Ce que retirer ce critère effacerait. */
function pertes(dossier: Dossier, c: Critere): string[] {
  return phrasesPertes({
    evaluations: dossier.etudiants.filter((e) => e.niveaux[c.id] !== undefined).length,
    commentaires: dossier.etudiants.filter((e) => (e.commentaires[c.id] ?? '').trim() !== '')
      .length,
    descripteurs: c.descripteurs.filter((d) => d.trim() !== '').length,
  });
}

type Confirmation = { critere: Critere; pertes: string[] };

/** Les critères de la grille, une carte par critère (décision 2), et le total des poids. */
export function Criteres() {
  const { dossier, modifier } = useDossier();
  const { criteres, niveaux } = dossier.grille;
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [nouveau, setNouveau] = useState<string | null>(null);
  const champNouveau = useRef<HTMLInputElement>(null);
  const id = useId();

  // Le focus va sur le nom du critère qui vient d'être ajouté.
  useEffect(() => {
    if (nouveau) champNouveau.current?.focus();
  }, [nouveau]);

  const ajouter = () => {
    const idCritere = nouvelId();
    if (modifier((d) => ajouterCritere(d, idCritere)).ok) setNouveau(idCritere);
  };
  const retirer = (c: Critere) => modifier((d) => retirerCritere(d, c.id));

  return (
    <section aria-labelledby={`${id}-titre`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 id={`${id}-titre`} className="text-lg font-semibold text-texte">
          Critères
        </h2>
        <div role="status" aria-labelledby={`${id}-total`} className="text-sm text-texte">
          <span id={`${id}-total`}>Total des poids</span> :{' '}
          <span
            className={
              totalPoids(criteres) === POIDS_TOTAL ? 'text-statut-ok' : 'text-statut-avertissement'
            }
          >
            {texteTotal(totalPoids(criteres))}
          </span>
        </div>
        {criteres.length > 0 && (
          <Bouton onClick={() => modifier(egaliserCriteres)}>Égaliser les poids</Bouton>
        )}
      </div>

      {criteres.length === 0 && (
        <p className="mt-3 text-sm text-texte-attenue">
          Aucun critère pour l’instant. Ajoutez-en un, ou partez d’un modèle.
        </p>
      )}

      <ol className="mt-4 flex flex-col gap-4">
        {criteres.map((c, i) => (
          <li key={c.id}>
            <fieldset className="m-0 min-w-0 rounded-carte border border-bordure p-4">
              <legend className="px-1 text-base font-semibold text-texte">
                Critère {i + 1} : {c.nom}
              </legend>
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                <ChampDossier
                  etiquette="Nom"
                  valeur={c.nom}
                  appliquer={(texte) => modifier((d) => renommerCritere(d, c.id, texte))}
                  {...(c.id === nouveau ? { refChamp: champNouveau } : {})}
                />
                <ChampDossier
                  etiquette="Poids (%)"
                  modeSaisie="decimal"
                  valeur={poidsSaisi(c.poids)}
                  appliquer={(texte) =>
                    modifier((d) => {
                      const p = lirePoids(texte);
                      return p.ok ? changerPoids(d, c.id, p.valeur) : p;
                    })
                  }
                />
              </div>
              <ol className="mt-3 flex flex-col gap-2">
                {niveaux.map((libelle, n) => (
                  <li key={n}>
                    <ChampDossier
                      etiquette={`Descripteur du niveau ${n + 1} (${libelle})`}
                      multiligne
                      valeur={c.descripteurs[n] ?? ''}
                      appliquer={(texte) =>
                        modifier((d) => modifierDescripteur(d, c.id, n + 1, texte))
                      }
                    />
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex flex-wrap gap-2">
                <Bouton
                  disabled={i === 0}
                  onClick={() => modifier((d) => deplacerCritere(d, c.id, 'haut'))}
                >
                  Monter
                </Bouton>
                <Bouton
                  disabled={i === criteres.length - 1}
                  onClick={() => modifier((d) => deplacerCritere(d, c.id, 'bas'))}
                >
                  Descendre
                </Bouton>
                <Bouton
                  variante="danger"
                  onClick={() => {
                    const p = pertes(dossier, c);
                    if (p.length === 0) retirer(c);
                    else setConfirmation({ critere: c, pertes: p });
                  }}
                >
                  Retirer
                </Bouton>
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <Bouton variante="principal" className="mt-4" onClick={ajouter}>
        Ajouter un critère
      </Bouton>

      <Dialogue
        ouvert={confirmation !== null}
        titre={`Retirer le critère « ${confirmation?.critere.nom ?? ''} » ?`}
        confirmer="Retirer le critère"
        surAnnuler={() => setConfirmation(null)}
        surConfirmer={() => {
          if (confirmation) retirer(confirmation.critere);
          setConfirmation(null);
        }}
      >
        {confirmation?.pertes.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Dialogue>
    </section>
  );
}
