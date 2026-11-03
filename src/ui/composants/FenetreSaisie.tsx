import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { CodeErreur, Resultat } from '../../domain';
import { MESSAGES_ERREUR } from '../messages';
import { Bouton } from './Bouton';
import { Champ } from './Champ';
import { Fenetre } from './Fenetre';

type Props = {
  titre: string;
  etiquette: string;
  valeurInitiale?: string;
  /** Texte du bouton, par exemple « Enregistrer ». */
  valider: string;
  /** Applique le texte ; un refus garde la fenêtre ouverte avec le message du code. */
  surValider: (texte: string) => Resultat<unknown>;
  fermer: () => void;
  children?: ReactNode;
};

/** Fenêtre à un champ (renommer, enregistrer comme modèle) : Entrée valide, Échap annule. */
export function FenetreSaisie({
  titre,
  etiquette,
  valeurInitiale = '',
  valider,
  surValider,
  fermer,
  children,
}: Props) {
  const [texte, setTexte] = useState(valeurInitiale);
  const [code, setCode] = useState<CodeErreur | undefined>();
  const champ = useRef<HTMLInputElement>(null);

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    const r = surValider(texte);
    if (r.ok) fermer();
    else setCode(r.erreur);
  };

  return (
    <Fenetre ouvert titre={titre} surFermer={fermer} focusInitial={champ}>
      <form onSubmit={soumettre} className="flex flex-col gap-3">
        {children}
        <Champ
          etiquette={etiquette}
          valeur={texte}
          surSaisie={(t) => {
            setTexte(t);
            setCode(undefined);
          }}
          erreur={code && MESSAGES_ERREUR[code]}
          refChamp={champ}
        />
        <div>
          <Bouton type="submit" variante="principal">
            {valider}
          </Bouton>
        </div>
      </form>
    </Fenetre>
  );
}
