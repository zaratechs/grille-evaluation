import { useId, useRef, useState } from 'react';
import { nouvelId } from '../../../data-access';
import { AUTEUR_MODELES, LICENCE_MODELES, MODELES_FOURNIS } from '../../../data/modeles';
import {
  appliquerModele,
  cleNom,
  enregistrerModele,
  formaterPoids,
  ok,
  renommerModele,
  supprimerModele,
  type Dossier,
  type Modele,
} from '../../../domain';
import { accorder, phrasesPertes } from '../../../textes';
import { Bouton, Champ, ChampDossier, Dialogue, Fenetre, FenetreSaisie } from '../../composants';
import { useDossier } from '../../etat';

type Choix = { perso: boolean; id: string };

/** Ce qu'appliquer un modèle remplacerait ou effacerait ; vide si la grille est vierge. */
function pertes(dossier: Dossier): string[] {
  const { criteres } = dossier.grille;
  const evaluations = dossier.etudiants.reduce((n, e) => n + Object.keys(e.niveaux).length, 0);
  const commentaires = dossier.etudiants.reduce(
    (n, e) => n + Object.values(e.commentaires).filter((c) => c.trim() !== '').length,
    0,
  );
  const phrases = [
    ...(criteres.length > 0
      ? [
          accorder(
            criteres.length,
            'critère actuel sera remplacé.',
            'critères actuels seront remplacés.',
          ),
        ]
      : []),
    ...phrasesPertes({ evaluations, commentaires }),
  ];
  if (phrases.length > 0 && dossier.etudiants.length > 0) {
    phrases.push('Les commentaires généraux sont gardés.');
  }
  return phrases;
}

/** Une liste de modèles ; le modèle choisi est marqué `aria-pressed`. */
function ListeModeles({
  titre,
  modeles,
  perso,
  choix,
  choisir,
}: {
  titre: string;
  modeles: readonly Modele[];
  perso: boolean;
  choix: Choix | null;
  choisir: (c: Choix) => void;
}) {
  const id = useId();
  return (
    <div>
      <h3 id={id} className="text-sm font-semibold text-texte">
        {titre}
      </h3>
      <ul aria-labelledby={id} className="mt-2 flex flex-col gap-1">
        {modeles.map((m) => {
          const choisi = choix?.perso === perso && choix.id === m.id;
          return (
            <li key={m.id}>
              <button
                type="button"
                aria-pressed={choisi}
                onClick={() => choisir({ perso, id: m.id })}
                className={`w-full rounded-champ px-2 py-1 text-left text-sm focus-visible:outline-2 focus-visible:outline-focus ${
                  choisi
                    ? 'bg-marque-50 font-semibold text-marque-700'
                    : 'text-texte hover:bg-surface-attenue'
                }`}
              >
                {m.nom}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** « Partir d'un modèle… » et « Enregistrer comme modèle… ». */
export function Modeles() {
  const { dossier, modifier } = useDossier();
  const [ouverte, setOuverte] = useState(false);
  const [enregistrer, setEnregistrer] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <Bouton onClick={() => setOuverte(true)}>Partir d’un modèle…</Bouton>
      <Bouton onClick={() => setEnregistrer(true)}>Enregistrer comme modèle…</Bouton>
      {ouverte && (
        <ChoisirModele dossier={dossier} modifier={modifier} fermer={() => setOuverte(false)} />
      )}
      {enregistrer && <EnregistrerModele fermer={() => setEnregistrer(false)} />}
    </div>
  );
}

function ChoisirModele({
  dossier,
  modifier,
  fermer,
}: {
  dossier: Dossier;
  modifier: ReturnType<typeof useDossier>['modifier'];
  fermer: () => void;
}) {
  const [recherche, setRecherche] = useState('');
  const [choix, setChoix] = useState<Choix | null>(null);
  const [confirmation, setConfirmation] = useState<'appliquer' | 'supprimer' | null>(null);
  const champRecherche = useRef<HTMLInputElement>(null);
  const idApercu = useId();

  const cle = cleNom(recherche);
  const filtre = (liste: readonly Modele[]) => liste.filter((m) => cleNom(m.nom).includes(cle));
  const fournis = filtre(MODELES_FOURNIS);
  const perso = filtre(dossier.modelesPerso);
  const modele = choix
    ? (choix.perso ? dossier.modelesPerso : MODELES_FOURNIS).find((m) => m.id === choix.id)
    : undefined;
  const aRemplacer = pertes(dossier);

  const appliquer = (m: Modele) => {
    modifier((d) => ok(appliquerModele(d, m, nouvelId)));
    fermer();
  };

  return (
    <Fenetre ouvert titre="Choisir un modèle" surFermer={fermer} focusInitial={champRecherche}>
      <Champ
        etiquette="Rechercher un modèle"
        type="search"
        valeur={recherche}
        surSaisie={setRecherche}
        refChamp={champRecherche}
      />
      <div className="mt-4 grid gap-6 sm:grid-cols-[14rem_1fr]">
        <div className="flex flex-col gap-4">
          {dossier.modelesPerso.length === 0 ? (
            <p className="text-sm text-texte-attenue">
              Vos propres modèles apparaîtront ici : utilisez « Enregistrer comme modèle… » sous le
              titre de la grille.
            </p>
          ) : (
            perso.length > 0 && (
              <ListeModeles
                titre="Mes modèles"
                modeles={perso}
                perso
                choix={choix}
                choisir={setChoix}
              />
            )
          )}
          {fournis.length > 0 && (
            <ListeModeles
              titre={`Modèles fournis (${fournis.length})`}
              modeles={fournis}
              perso={false}
              choix={choix}
              choisir={setChoix}
            />
          )}
          {fournis.length === 0 && perso.length === 0 && (
            <p className="text-sm text-texte-attenue">
              Aucun modèle ne correspond à « {recherche} ».
            </p>
          )}
          <p className="text-xs text-texte-attenue">
            Modèles fournis : {AUTEUR_MODELES}, sous licence {LICENCE_MODELES}.
          </p>
        </div>

        {modele && (
          <section aria-labelledby={idApercu} className="min-w-0">
            <h3 id={idApercu} className="text-base font-semibold text-texte">
              {modele.nom}
            </h3>
            <p className="mt-1 text-sm text-texte-attenue">
              {modele.niveaux.length} niveaux : {modele.niveaux.join(', ')}.
            </p>
            <ol className="mt-3 flex flex-col gap-1 text-sm">
              {modele.criteres.map((c, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>{c.nom}</span>
                  <span className="shrink-0 text-texte-attenue">{formaterPoids(c.poids)}</span>
                </li>
              ))}
            </ol>
            {choix?.perso && (
              <ChampDossier
                key={modele.id}
                className="mt-4"
                etiquette="Nom du modèle"
                valeur={modele.nom}
                appliquer={(texte) => modifier((d) => renommerModele(d, modele.id, texte))}
              />
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Bouton
                variante="principal"
                onClick={() =>
                  aRemplacer.length === 0 ? appliquer(modele) : setConfirmation('appliquer')
                }
              >
                Appliquer ce modèle
              </Bouton>
              {choix?.perso && (
                <Bouton variante="danger" onClick={() => setConfirmation('supprimer')}>
                  Supprimer ce modèle
                </Bouton>
              )}
            </div>
            <Dialogue
              ouvert={confirmation === 'appliquer'}
              titre={`Appliquer « ${modele.nom} » ?`}
              confirmer="Appliquer le modèle"
              surAnnuler={() => setConfirmation(null)}
              surConfirmer={() => {
                setConfirmation(null);
                appliquer(modele);
              }}
            >
              {aRemplacer.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </Dialogue>
            <Dialogue
              ouvert={confirmation === 'supprimer'}
              titre={`Supprimer le modèle « ${modele.nom} » ?`}
              confirmer="Supprimer"
              surAnnuler={() => setConfirmation(null)}
              surConfirmer={() => {
                setConfirmation(null);
                setChoix(null);
                modifier((d) => supprimerModele(d, modele.id));
              }}
            >
              Les grilles déjà construites avec ce modèle ne changent pas.
            </Dialogue>
          </section>
        )}
      </div>
    </Fenetre>
  );
}

function EnregistrerModele({ fermer }: { fermer: () => void }) {
  const { modifier } = useDossier();
  return (
    <FenetreSaisie
      titre="Enregistrer comme modèle"
      etiquette="Nom du modèle"
      valider="Enregistrer"
      fermer={fermer}
      surValider={(nom) => {
        const id = nouvelId();
        return modifier((d) => enregistrerModele(d, id, nom));
      }}
    >
      <p className="text-sm text-texte-attenue">
        Les niveaux, les critères, leurs poids et leurs descripteurs sont enregistrés, sans les
        personnes étudiantes ni leurs évaluations.
      </p>
    </FenetreSaisie>
  );
}
