import { useEffect, useId, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  calculerResultat,
  commenter,
  commenterGeneral,
  evaluer,
  formaterPoids,
  reinitialiserEvaluation,
  type Critere,
  type Etudiant,
} from '../../../domain';
import { pertesEtudiant, texteResultat } from '../../../textes';
import { Bouton, BoutonsExport, Champ, Dialogue } from '../../composants';
import { useDossier, useSelection } from '../../etat';
import { exporterPersonne } from '../../exports';
import { Vue } from '../../layout';

const STYLE_LIEN = 'font-medium text-marque-700 underline hover:text-marque-800';

/** La vue Évaluation : une personne à la fois, la note en direct. */
export function EvaluationPage() {
  const { dossier } = useDossier();
  const { etudiants, grille } = dossier;
  if (etudiants.length > 0 && grille.criteres.length > 0) return <Evaluation />;
  return (
    <Vue titre="Évaluation">
      {etudiants.length === 0 ? (
        <p className="text-texte-attenue">
          Ajoutez d’abord des personnes étudiantes.{' '}
          <Link to="/groupe" className={STYLE_LIEN}>
            Aller au Groupe
          </Link>
        </p>
      ) : (
        <p className="text-texte-attenue">
          La grille n’a encore aucun critère.{' '}
          <Link to="/grille" className={STYLE_LIEN}>
            Aller à la Grille
          </Link>
        </p>
      )}
    </Vue>
  );
}

function Evaluation() {
  const { dossier, modifier } = useDossier();
  const { etudiants, grille } = dossier;
  const { personne: memoire, choisirPersonne } = useSelection();
  const [params, setParams] = useSearchParams();
  const [effacer, setEffacer] = useState<string[] | null>(null);
  const precedente = useRef<HTMLButtonElement>(null);
  const suivante = useRef<HTMLButtonElement>(null);
  const idChoix = useId();

  // L'adresse d'abord, puis la dernière personne évaluée, puis la première du groupe.
  const trouver = (id: string | null) => etudiants.find((e) => e.id === id);
  const e = trouver(params.get('personne')) ?? trouver(memoire) ?? (etudiants[0] as Etudiant);
  const position = etudiants.indexOf(e);

  useEffect(() => choisirPersonne(e.id), [e.id, choisirPersonne]);

  const aller = (j: number) => {
    const cible = etudiants[j];
    if (!cible) return;
    setParams({ personne: cible.id }, { replace: true });
    // Le bouton cliqué va se désactiver au bout de la liste : le focus passe à l'autre.
    if (j === 0) suivante.current?.focus();
    else if (j === etudiants.length - 1) precedente.current?.focus();
  };

  const pertes = pertesEtudiant(e);

  const choix = (
    <div className="sm:max-w-sm">
      <label htmlFor={idChoix} className="block text-sm font-medium text-texte">
        Personne
      </label>
      <select
        id={idChoix}
        value={e.id}
        onChange={(ev) => aller(etudiants.findIndex((x) => x.id === ev.target.value))}
        className="mt-1 block w-full rounded-champ border border-bordure-champ bg-surface px-2 py-1.5 text-sm text-texte focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus max-[480px]:min-h-11"
      >
        {etudiants.map((x) => (
          <option key={x.id} value={x.id}>
            {x.nom}
          </option>
        ))}
      </select>
    </div>
  );

  const barre = (
    <div
      role="group"
      aria-label="Changer de personne"
      className="flex items-center gap-2 max-[480px]:justify-between"
    >
      <Bouton ref={precedente} disabled={position === 0} onClick={() => aller(position - 1)}>
        Précédente
      </Bouton>
      <p className="text-sm text-texte-attenue">
        {position + 1} / {etudiants.length}
      </p>
      <Bouton
        ref={suivante}
        disabled={position === etudiants.length - 1}
        onClick={() => aller(position + 1)}
      >
        Suivante
      </Bouton>
    </div>
  );

  return (
    // Changer de personne ne modifie rien : hors des champs, actif même en lecture seule.
    <Vue titre="Évaluation" outils={choix} barre={barre}>
      <div className="flex flex-col gap-6">
        <Resultat etudiant={e} />

        {grille.criteres.map((c) => (
          <CritereEvalue key={`${e.id}-${c.id}`} etudiant={e} critere={c} />
        ))}

        <Champ
          multiligne
          etiquette="Commentaire général"
          valeur={e.commentaireGeneral}
          surSaisie={(t) => modifier((d) => commenterGeneral(d, e.id, t))}
        />

        <BoutonsExport
          titre="Exporter cette personne"
          formats={['pdf', 'word']}
          exporter={(f) => exporterPersonne(dossier, e.id, f === 'pdf' ? 'pdf' : 'word')}
        />

        <div>
          <Bouton
            variante="danger"
            disabled={pertes.length === 0}
            onClick={() => setEffacer(pertes)}
          >
            Effacer l’évaluation de cette personne
          </Bouton>
        </div>

        <Dialogue
          ouvert={effacer !== null}
          titre={`Effacer l’évaluation de « ${e.nom} » ?`}
          confirmer="Effacer l’évaluation"
          surAnnuler={() => setEffacer(null)}
          surConfirmer={() => {
            setEffacer(null);
            modifier((d) => reinitialiserEvaluation(d, e.id));
          }}
        >
          {effacer?.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Dialogue>
      </div>
    </Vue>
  );
}

/** Le résultat de la personne, annoncé poliment à chaque changement. */
function Resultat({ etudiant }: { etudiant: Etudiant }) {
  const { grille } = useDossier().dossier;
  const r = calculerResultat(grille, etudiant);
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-carte bg-surface-attenue p-4">
      <h2 id={id} className="text-sm font-semibold text-texte-attenue">
        Résultat
      </h2>
      <p aria-live="polite" className="mt-1 text-lg font-semibold text-texte">
        {texteResultat(grille, r)}
      </p>
      {r.statut === 'ponderation-invalide' && (
        <p className="mt-1 text-sm">
          <Link to="/grille" className={STYLE_LIEN}>
            Corriger les poids
          </Link>{' '}
          dans la Grille pour obtenir une note.
        </p>
      )}
    </section>
  );
}

/** Un critère : un niveau par bouton radio (les flèches changent de niveau), un commentaire. */
function CritereEvalue({ etudiant, critere }: { etudiant: Etudiant; critere: Critere }) {
  const { dossier, modifier } = useDossier();
  const id = useId();
  const choisi = etudiant.niveaux[critere.id];
  const premier = useRef<HTMLInputElement>(null);
  const poids = critere.poids === 0 ? 'non noté' : formaterPoids(critere.poids);
  return (
    <fieldset className="min-w-0 rounded-carte border border-bordure p-4">
      <legend className="px-1 text-base font-semibold text-texte">
        {critere.nom} · {poids}
      </legend>
      <div className="flex flex-col gap-1">
        {dossier.grille.niveaux.map((libelle, k) => {
          const n = k + 1;
          const descripteur = critere.descripteurs[k] ?? '';
          return (
            <label
              key={n}
              className="flex cursor-pointer gap-2 rounded-champ px-2 py-1 hover:bg-surface-attenue has-checked:bg-marque-50"
            >
              <input
                type="radio"
                ref={k === 0 ? premier : undefined}
                name={`niveau-${critere.id}`}
                checked={choisi === n}
                onChange={() => modifier((d) => evaluer(d, etudiant.id, critere.id, n))}
                aria-labelledby={`${id}-${n}`}
                aria-describedby={descripteur ? `${id}-${n}-d` : undefined}
                className="mt-1 accent-marque-700"
              />
              <span className="text-sm">
                <span id={`${id}-${n}`} className="font-medium text-texte">
                  {n} {libelle}
                </span>
                {descripteur && (
                  <span id={`${id}-${n}-d`} className="block text-texte-attenue">
                    {descripteur}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {choisi !== undefined && (
        <Bouton
          className="mt-2"
          onClick={() => {
            modifier((d) => evaluer(d, etudiant.id, critere.id, null));
            // Le bouton disparaît : le focus reste dans le critère, sur son premier niveau.
            premier.current?.focus();
          }}
        >
          Retirer le niveau
        </Bouton>
      )}
      <Champ
        className="mt-3"
        multiligne
        etiquette="Commentaire"
        valeur={etudiant.commentaires[critere.id] ?? ''}
        surSaisie={(t) => modifier((d) => commenter(d, etudiant.id, critere.id, t))}
      />
    </fieldset>
  );
}
