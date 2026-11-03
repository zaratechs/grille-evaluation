import { useId, useState } from 'react';
import type { Format } from '../exports';
import { Avis } from './Avis';
import { Bouton } from './Bouton';

const LIBELLES: Record<Format, string> = { pdf: 'PDF', word: 'Word', csv: 'CSV' };

type Props = {
  /** « Exporter cette personne », « Exporter tout le groupe ». */
  titre: string;
  formats: Format[];
  /** Crée et télécharge le fichier ; rend son nom. */
  exporter: (format: Format) => Promise<string>;
  /** Pourquoi il n'y a rien à exporter ; les boutons sont alors désactivés. */
  raison?: string | undefined;
};

type Etat = { ok: true; fichier: string } | { ok: false } | null;

/**
 * Un bouton par format. Pendant la création, le bouton cliqué affiche « Préparation… » et
 * tous sont `aria-disabled` (et non `disabled`) : le focus reste sur le bouton cliqué.
 */
export function BoutonsExport({ titre, formats, exporter, raison }: Props) {
  const [enCours, setEnCours] = useState<Format | null>(null);
  const [etat, setEtat] = useState<Etat>(null);
  const id = useId();

  const lancer = async (format: Format) => {
    if (enCours !== null) return;
    setEnCours(format);
    setEtat(null);
    try {
      setEtat({ ok: true, fichier: await exporter(format) });
    } catch {
      setEtat({ ok: false });
    } finally {
      setEnCours(null);
    }
  };

  return (
    <div role="group" aria-labelledby={`${id}-titre`} className="flex flex-col gap-2">
      <p id={`${id}-titre`} className="text-sm font-semibold text-texte">
        {titre}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {formats.map((f) => (
          <Bouton
            key={f}
            disabled={raison !== undefined}
            aria-disabled={enCours !== null ? true : undefined}
            aria-describedby={raison !== undefined ? `${id}-raison` : undefined}
            className="aria-disabled:cursor-wait aria-disabled:opacity-60"
            onClick={() => void lancer(f)}
          >
            {enCours === f ? 'Préparation…' : LIBELLES[f]}
          </Bouton>
        ))}
      </div>
      {raison !== undefined && (
        <p id={`${id}-raison`} className="text-xs text-texte-attenue">
          {raison}
        </p>
      )}
      <p aria-live="polite" className="text-xs text-texte-attenue">
        {etat?.ok ? `Fichier prêt : ${etat.fichier}` : ''}
      </p>
      {etat?.ok === false && (
        <Avis importance="alerte" surFermer={() => setEtat(null)}>
          Le fichier n’a pas pu être créé. Réessayez ; si le problème persiste, exportez vos données
          en JSON depuis « Vos données ».
        </Avis>
      )}
    </div>
  );
}
