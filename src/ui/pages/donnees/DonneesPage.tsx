import { useId, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  exporterJSON,
  importerJSON,
  lireCopie,
  lireFichier,
  reinitialiser,
  telecharger,
  type Import,
} from '../../../data-access';
import { dossierVide, nomFichier, ok, type CodeErreur, type Dossier } from '../../../domain';
import { accorder } from '../../accords';
import { Avis, Bouton, Dialogue } from '../../composants';
import { useDossier } from '../../etat';
import { Vue } from '../../layout';
import { MESSAGES_ERREUR, phrasesBilan } from '../../messages';

const JSON_TYPE = 'application/json';

type Retour = { importance: 'alerte' | 'info'; texte: string; details: string[] };
type Proposition = { nom: string; texte: string; phrases: string[] };

const alerte = (code: CodeErreur): Retour => ({
  importance: 'alerte',
  texte: MESSAGES_ERREUR[code],
  details: [],
});

/** Ce que l'import va changer, en phrases, pour la confirmation. */
function resume(imp: Import, courant: Dossier): string[] {
  const phrases = imp.grilleSeule
    ? [
        'La grille actuelle sera remplacée.',
        ...(courant.etudiants.length > 0
          ? [
              'Le groupe est gardé, mais ses évaluations et ses commentaires par critère seront effacés.',
            ]
          : []),
      ]
    : [
        'La grille et le groupe actuels seront remplacés.',
        imp.dossier.etudiants.length === 0
          ? 'Le fichier ne contient aucune personne étudiante.'
          : `Le fichier contient ${accorder(
              imp.dossier.etudiants.length,
              'personne étudiante',
              'personnes étudiantes',
            )}.`,
      ];
  if (imp.modelesAjoutes > 0) {
    phrases.push(
      accorder(
        imp.modelesAjoutes,
        'modèle personnel sera ajouté.',
        'modèles personnels seront ajoutés.',
      ),
    );
  }
  return phrases;
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="border-b border-bordure pb-1 text-lg font-semibold text-texte">
        {titre}
      </h2>
      {children}
    </section>
  );
}

/** Vos données : exporter, importer, copie de secours, tout effacer. */
export function DonneesPage() {
  const { dossier, modifier, lectureSeule } = useDossier();
  const [retour, setRetour] = useState<Retour | null>(null);
  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [effacer, setEffacer] = useState(false);
  const idFichier = useId();
  const copie = lireCopie();
  const { grille, etudiants, modelesPerso } = dossier;

  const exporter = (grilleSeule: boolean) =>
    telecharger(
      nomFichier(grilleSeule ? `${grille.titre} grille seule` : grille.titre, new Date(), 'json'),
      exporterJSON(dossier, { grilleSeule }),
      JSON_TYPE,
    );

  const choisir = async (ev: ChangeEvent<HTMLInputElement>) => {
    const champ = ev.currentTarget;
    const f = champ.files?.[0];
    // Vider le champ permet de choisir à nouveau le même fichier.
    champ.value = '';
    if (!f) return;
    setRetour(null);
    const lu = await lireFichier(f);
    if (!lu.ok) return setRetour(alerte(lu.erreur));
    const essai = importerJSON(lu.valeur, dossier);
    if (!essai.ok) return setRetour(alerte(essai.erreur));
    setProposition({ nom: f.name, texte: lu.valeur, phrases: resume(essai.valeur, dossier) });
  };

  const importer = (texte: string) => {
    const issue: { imp?: Import } = {};
    const r = modifier((d) => {
      const i = importerJSON(texte, d);
      if (!i.ok) return i;
      issue.imp = i.valeur;
      return ok(i.valeur.dossier);
    });
    if (!r.ok) return setRetour(alerte(r.erreur));
    const repare = issue.imp?.modifie === true;
    setRetour({
      importance: 'info',
      texte: repare ? 'Import terminé. Le fichier a été réparé :' : 'Import terminé.',
      details: repare && issue.imp ? phrasesBilan(issue.imp.bilan) : [],
    });
  };

  const toutEffacer = () => {
    // Un autre onglet a la main : ne rien effacer de ses données.
    if (lectureSeule) return setRetour(alerte('ecriture-impossible'));
    const r = reinitialiser();
    if (!r.ok) return setRetour(alerte(r.erreur));
    modifier(() => ok(dossierVide()));
    setRetour({ importance: 'info', texte: 'Toutes les données ont été effacées.', details: [] });
  };

  return (
    <Vue titre="Vos données">
      <div className="flex flex-col gap-8">
        <p className="text-texte-attenue">
          Tout reste dans ce navigateur, sur cet appareil. Exportez régulièrement pour garder une
          copie ou passer à un autre appareil.
        </p>

        {retour && (
          <Avis importance={retour.importance} surFermer={() => setRetour(null)}>
            <p>{retour.texte}</p>
            {retour.details.length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {retour.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </Avis>
        )}

        <Section titre="Exporter">
          <div className="flex flex-wrap gap-2">
            <Bouton variante="principal" onClick={() => exporter(false)}>
              Exporter tout
            </Bouton>
            <Bouton onClick={() => exporter(true)}>Exporter la grille seule</Bouton>
          </div>
          <p className="text-sm text-texte-attenue">
            « Exporter tout » enregistre la grille, le groupe et vos modèles. La grille seule ne
            contient aucun nom de personne étudiante : elle se partage sans risque.
          </p>
        </Section>

        <Section titre="Importer">
          <div>
            <label htmlFor={idFichier} className="block text-sm font-medium text-texte">
              Choisir un fichier .json
            </label>
            <input
              id={idFichier}
              type="file"
              accept=".json,application/json"
              onChange={(ev) => void choisir(ev)}
              className="mt-1 block text-sm text-texte file:mr-3 file:rounded-champ file:border file:border-bordure-champ file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-texte hover:file:bg-surface-attenue"
            />
          </div>
          <p className="text-sm text-texte-attenue">
            Un fichier complet remplace la grille et le groupe ; une grille seule garde le groupe.
            Les modèles du fichier s’ajoutent aux vôtres. Une confirmation précède tout changement.
          </p>
        </Section>

        {copie !== null && (
          <Section titre="Copie de secours">
            <p className="text-sm text-texte-attenue">
              Au chargement, une sauvegarde abîmée a été réparée ou écartée. Son texte d’origine est
              gardé ici.
            </p>
            <div>
              <Bouton
                onClick={() =>
                  telecharger(nomFichier('copie de secours', new Date(), 'json'), copie, JSON_TYPE)
                }
              >
                Télécharger la copie de secours
              </Bouton>
            </div>
          </Section>
        )}

        <Section titre="Remise à zéro">
          <div>
            <Bouton variante="danger" onClick={() => setEffacer(true)}>
              Tout effacer…
            </Bouton>
          </div>
        </Section>
      </div>

      <Dialogue
        ouvert={proposition !== null}
        titre={`Importer « ${proposition?.nom ?? ''} » ?`}
        confirmer="Importer"
        variante="principal"
        surAnnuler={() => setProposition(null)}
        surConfirmer={() => {
          if (proposition) importer(proposition.texte);
          setProposition(null);
        }}
      >
        {proposition?.phrases.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Dialogue>
      <Dialogue
        ouvert={effacer}
        titre="Tout effacer ?"
        confirmer="Tout effacer"
        surAnnuler={() => setEffacer(false)}
        surConfirmer={() => {
          setEffacer(false);
          toutEffacer();
        }}
      >
        <p>
          La grille et ses {accorder(grille.criteres.length, 'critère', 'critères')},{' '}
          {accorder(etudiants.length, 'personne étudiante', 'personnes étudiantes')} avec leurs
          évaluations, et {accorder(modelesPerso.length, 'modèle personnel', 'modèles personnels')}{' '}
          seront effacés de ce navigateur.
        </p>
        <p>Exportez d’abord si vous voulez les garder.</p>
      </Dialogue>
    </Vue>
  );
}
