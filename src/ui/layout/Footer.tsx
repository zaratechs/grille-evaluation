import { Link } from 'react-router';

// __APP_VERSION__ est injecté par vite.config.ts et vitest.config.ts (version de package.json).
const VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
const LICENCE = 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr';

export function Footer() {
  return (
    <footer className="border-t border-bordure bg-surface px-4 py-4 text-center text-xs text-texte-attenue">
      <p>
        © 2026-2027 — Réda Hamza, Développeur technopédagogique — Modèles de grilles : Paulo
        Mendonça — Licence{' '}
        <a
          href={LICENCE}
          target="_blank"
          rel="noopener noreferrer"
          className="text-marque-700 underline"
        >
          CC BY-NC-SA 4.0<span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
        </a>{' '}
        — Version {VERSION} ·{' '}
        <Link to="/transparence" className="text-marque-700 underline">
          Transparence
        </Link>
      </p>
    </footer>
  );
}
