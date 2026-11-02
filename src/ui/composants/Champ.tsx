import { useId, type Ref } from 'react';

type Props = {
  etiquette: string;
  valeur: string;
  surSaisie: (texte: string) => void;
  surSortie?: () => void;
  /** Message d'erreur, lié au champ et annoncé par les lecteurs d'écran. */
  erreur?: string | undefined;
  aide?: string;
  multiligne?: boolean;
  desactive?: boolean;
  /** Pour les nombres : « decimal » ou « numeric » montre le bon clavier sur téléphone. */
  modeSaisie?: 'text' | 'decimal' | 'numeric';
  className?: string;
  /** Pour donner le focus au champ (une seule ligne seulement). */
  refChamp?: Ref<HTMLInputElement>;
};

const STYLE_CHAMP =
  'mt-1 block w-full rounded-champ border border-bordure-champ bg-surface px-2 py-1.5 text-sm text-texte focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus disabled:bg-surface-attenue aria-invalid:border-statut-erreur';

/** Champ de texte avec étiquette visible, aide et erreur liées par `aria-describedby`. */
export function Champ({
  etiquette,
  valeur,
  surSaisie,
  surSortie,
  erreur,
  aide,
  multiligne = false,
  desactive = false,
  modeSaisie = 'text',
  className = '',
  refChamp,
}: Props) {
  const id = useId();
  const idAide = `${id}-aide`;
  const idErreur = `${id}-erreur`;
  const decrit = [aide && idAide, erreur && idErreur].filter(Boolean).join(' ') || undefined;
  const commun = {
    id,
    value: valeur,
    disabled: desactive,
    onBlur: surSortie,
    'aria-describedby': decrit,
    'aria-invalid': erreur ? true : undefined,
    className: STYLE_CHAMP,
  };
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-texte">
        {etiquette}
      </label>
      {multiligne ? (
        <textarea {...commun} rows={2} onChange={(e) => surSaisie(e.target.value)} />
      ) : (
        <input
          {...commun}
          ref={refChamp}
          type="text"
          inputMode={modeSaisie}
          onChange={(e) => surSaisie(e.target.value)}
        />
      )}
      {aide && (
        <p id={idAide} className="mt-1 text-xs text-texte-attenue">
          {aide}
        </p>
      )}
      {erreur && (
        <p id={idErreur} className="mt-1 text-xs text-statut-erreur">
          {erreur}
        </p>
      )}
    </div>
  );
}
