import { useNavigate } from 'react-router';
import { exporterJSON, telecharger } from '../../data-access';
import { nomFichier } from '../../domain';
import { Avis } from '../composants';
import { useDossier, type ActionAvisApp } from '../etat';

const LIBELLES: Record<ActionAvisApp, string> = {
  'telecharger-originale': 'Télécharger l’originale',
  exporter: 'Exporter maintenant',
  'aller-donnees': 'Aller à Vos données',
  recharger: 'Recharger la page',
};

const JSON_TYPE = 'application/json';

/** Les avis de l'application, sous l'en-tête, sur toutes les vues. */
export function BandeAvis() {
  const { avis, fermerAvis, dossier, sauvegardeOrigine } = useDossier();
  const naviguer = useNavigate();
  if (avis.length === 0) return null;

  const gestes: Record<ActionAvisApp, () => void> = {
    'telecharger-originale': () =>
      telecharger(
        nomFichier('copie de secours', new Date(), 'json'),
        sauvegardeOrigine ?? '',
        JSON_TYPE,
      ),
    exporter: () =>
      telecharger(
        nomFichier(dossier.grille.titre, new Date(), 'json'),
        exporterJSON(dossier),
        JSON_TYPE,
      ),
    'aller-donnees': () => void naviguer('/donnees'),
    // `history.go(0)` recharge la page, comme `location.reload()`.
    recharger: () => window.history.go(0),
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 pt-4">
      {avis.map((a) => (
        <Avis
          key={a.cle}
          importance={a.importance}
          actions={a.actions.map((action) => ({
            libelle: LIBELLES[action],
            action: gestes[action],
          }))}
          {...(a.fermable ? { surFermer: () => fermerAvis(a.cle) } : {})}
        >
          <p>{a.texte}</p>
          {a.details.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {a.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </Avis>
      ))}
    </div>
  );
}
