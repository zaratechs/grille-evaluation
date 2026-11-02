import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { charger, enregistrer, surveillerAutresOnglets } from '../../data-access';
import { erreur, type Dossier, type Resultat } from '../../domain';
import {
  AVIS_AUTRE_ONGLET,
  AVIS_ECRITURE,
  avecAvis,
  avisChargement,
  sansAvis,
  type AvisApp,
} from './avis';
import { ContexteDossier, type EtatDossier, type Operation } from './useDossier';

type Depart = {
  dossier: Dossier;
  avis: AvisApp[];
  sauvegardeOrigine: string | undefined;
  /** Le navigateur refuse le stockage : inutile d'essayer d'écrire. */
  stockageRefuse: boolean;
};

function depart(): Depart {
  const chargement = charger();
  const avis = avisChargement(chargement);
  return {
    dossier: chargement.dossier,
    avis: avis ? [avis] : [],
    sauvegardeOrigine: chargement.sauvegardeOrigine,
    stockageRefuse: chargement.avertissement === 'lecture-impossible',
  };
}

/**
 * Garde le dossier de l'application. Il est chargé une fois au démarrage, puis enregistré
 * à chaque modification (décision 2 de la phase 3). Si un autre onglet le modifie, celui-ci
 * passe en lecture seule (décision 5 de la phase 4).
 */
export function DossierProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(depart);
  const [dossier, setDossier] = useState(initial.dossier);
  const [avis, setAvis] = useState(initial.avis);
  const [lectureSeule, setLectureSeule] = useState(false);

  // Valeurs à jour pour `modifier`, qui peut être appelé deux fois dans le même geste.
  const courant = useRef(initial.dossier);
  const bloque = useRef(false);

  useEffect(
    () =>
      surveillerAutresOnglets(() => {
        bloque.current = true;
        setLectureSeule(true);
        setAvis((liste) => avecAvis(liste, AVIS_AUTRE_ONGLET));
      }),
    [],
  );

  const modifier = useCallback(
    (operation: Operation): Resultat<Dossier> => {
      if (bloque.current) return erreur('ecriture-impossible');
      const r = operation(courant.current);
      if (!r.ok) return r;
      courant.current = r.valeur;
      setDossier(r.valeur);
      if (!initial.stockageRefuse) {
        const ecrit = enregistrer(r.valeur).ok;
        setAvis((liste) => (ecrit ? sansAvis(liste, 'ecriture') : avecAvis(liste, AVIS_ECRITURE)));
      }
      return r;
    },
    [initial.stockageRefuse],
  );

  const fermerAvis = useCallback(
    (cle: AvisApp['cle']) => setAvis((liste) => sansAvis(liste, cle)),
    [],
  );

  const valeur = useMemo<EtatDossier>(
    () => ({
      dossier,
      modifier,
      lectureSeule,
      avis,
      fermerAvis,
      sauvegardeOrigine: initial.sauvegardeOrigine,
    }),
    [dossier, modifier, lectureSeule, avis, fermerAvis, initial.sauvegardeOrigine],
  );

  return <ContexteDossier value={valeur}>{children}</ContexteDossier>;
}
