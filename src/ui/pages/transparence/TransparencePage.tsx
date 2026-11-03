import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Vue } from '../../layout';

const SIGNALEMENTS = 'https://github.com/zaratechs/grille-evaluation/issues';
const STYLE_LIEN = 'font-medium text-marque-700 underline hover:text-marque-800';

/** Une carte sobre, titrée par un `h2` qui nomme sa région. */
function Section({ titre, children }: { titre: string; children: ReactNode }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 rounded-carte border border-bordure bg-surface p-5"
    >
      <h2 id={id} className="text-lg font-semibold text-texte">
        {titre}
      </h2>
      {children}
    </section>
  );
}

/** Usage de l'IA, traitement des données, contenus repris, et où signaler une erreur. */
export function TransparencePage() {
  return (
    <Vue titre="Transparence">
      <div className="flex max-w-3xl flex-col gap-6 text-sm leading-relaxed text-texte">
        <Section titre="Développement de cet outil">
          <p>
            Grille d’évaluation a été conçue avec l’assistance de <strong>Claude Code</strong>,
            l’outil de programmation par intelligence artificielle d’Anthropic. Il a servi :
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>à écrire le code ;</li>
            <li>
              au développement piloté par les tests (TDD) : chaque fonctionnalité commence par un
              test qui échoue ;
            </li>
            <li>
              à l’intégration continue : à chaque modification, les tests, l’accessibilité et la
              sécurité sont vérifiés automatiquement ;
            </li>
            <li>à la revue de code.</li>
          </ul>
          <p>Chaque étape a été proposée, relue et validée par l’auteur avant d’être intégrée.</p>
          <p>Le logo a été généré à l’aide de l’outil d’IA Nano Banana 2 de Gemini.</p>
          <p>Dans tous les cas, l’auteur conserve l’entière responsabilité du contenu final.</p>
        </Section>

        <Section titre="Vos données restent dans votre navigateur">
          <p>
            Votre grille, votre groupe et vos modèles sont enregistrés uniquement dans le navigateur
            de cet ordinateur. Rien n’est envoyé à un serveur, et l’outil n’utilise ni témoins ni
            mesure d’audience. Les fichiers PDF, Word et CSV sont créés sur place, dans votre
            navigateur.
          </p>
          <p>
            Vider les données du site dans le navigateur efface votre travail. Pour le garder ou
            changer d’ordinateur, exportez-le en JSON depuis{' '}
            <Link to="/donnees" className={STYLE_LIEN}>
              Vos données
            </Link>
            .
          </p>
        </Section>

        <Section titre="Contenus">
          <p>
            Les modèles de grilles proviennent de l’outil d’origine de{' '}
            <strong>Paulo Mendonça, Conseiller pédagogique TIC</strong>.
          </p>
          <p>
            Les PDF exportés embarquent la police <strong>Noto Sans</strong> (The Noto Project
            Authors), sous licence SIL Open Font License 1.1, réduite aux caractères latins pour
            rester légère.
          </p>
        </Section>

        <Section titre="Signaler une erreur">
          <p>
            Une erreur, un calcul qui semble faux, une idée d’amélioration ? Vous pouvez la signaler
            dans les{' '}
            <a href={SIGNALEMENTS} target="_blank" rel="noopener noreferrer" className={STYLE_LIEN}>
              signalements du projet sur GitHub
              <span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
            </a>
            .
          </p>
        </Section>
      </div>
    </Vue>
  );
}
