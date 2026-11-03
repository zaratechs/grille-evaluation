import { useId } from 'react';
import { Vue } from '../../layout';

// Page provisoire : le contenu final arrive en phase 6.
export function TransparencePage() {
  const idPolice = useId();
  return (
    <Vue titre="Transparence">
      <div className="flex max-w-2xl flex-col gap-6">
        <p className="text-texte-attenue">
          Cette page présentera l’usage de l’intelligence artificielle dans la conception de l’outil
          et la façon dont vos données sont traitées.
        </p>
        <section aria-labelledby={idPolice} className="flex flex-col gap-1">
          <h2 id={idPolice} className="text-lg font-semibold text-texte">
            Police des documents PDF
          </h2>
          <p className="text-sm text-texte-attenue">
            Les PDF exportés embarquent la police Noto Sans (The Noto Project Authors), sous licence
            SIL Open Font License 1.1, réduite aux caractères latins pour rester légère.
          </p>
        </section>
      </div>
    </Vue>
  );
}
