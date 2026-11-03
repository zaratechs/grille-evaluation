import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { monterApp } from '../outils/monter';

const section = (nom: string) => screen.getByRole('region', { name: nom });

describe('Transparence', () => {
  it('un titre et quatre sections, dans l’ordre', () => {
    monterApp('/transparence');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Transparence');
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Développement de cet outil',
      'Vos données restent dans votre navigateur',
      'Contenus',
      'Signaler une erreur',
    ]);
  });

  it('développement : Claude Code, TDD, intégration continue, revue de code, logo, responsabilité', () => {
    monterApp('/transparence');
    const s = section('Développement de cet outil');
    for (const attendu of [
      'Claude Code',
      'Anthropic',
      'développement piloté par les tests (TDD)',
      'intégration continue',
      'revue de code',
      'proposée, relue et validée par l’auteur',
      'Nano Banana 2 de Gemini',
      'l’auteur conserve l’entière responsabilité du contenu final',
    ]) {
      expect(s).toHaveTextContent(attendu);
    }
    expect(within(s).getAllByRole('listitem')).toHaveLength(4);
  });

  it('aucune mention d’IA locale ni de la Loi 25', () => {
    monterApp('/transparence');
    const page = screen.getByRole('main');
    expect(page).not.toHaveTextContent(/IA locale|Loi 25|Ollama/);
  });

  it('données : rien n’est envoyé, ni témoins ni mesure d’audience ; lien vers Vos données', () => {
    monterApp('/transparence');
    const s = section('Vos données restent dans votre navigateur');
    expect(s).toHaveTextContent('Rien n’est envoyé à un serveur');
    expect(s).toHaveTextContent('ni témoins ni mesure d’audience');
    expect(s).toHaveTextContent('Vider les données du site');
    expect(within(s).getByRole('link', { name: 'Vos données' })).toHaveAttribute(
      'href',
      '/donnees',
    );
  });

  it('contenus : Paulo Mendonça, et la police des PDF avec sa licence', () => {
    monterApp('/transparence');
    const s = section('Contenus');
    expect(s).toHaveTextContent('Paulo Mendonça, Conseiller pédagogique TIC');
    expect(s).toHaveTextContent('Noto Sans');
    expect(s).toHaveTextContent('SIL Open Font License 1.1');
  });

  it('signaler une erreur : lien GitHub, nouvel onglet annoncé ; aucun courriel', () => {
    monterApp('/transparence');
    const lien = within(section('Signaler une erreur')).getByRole('link', {
      // jsdom retire l'espace au début du texte masqué ; un navigateur la garde.
      name: /^signalements du projet sur GitHub ?\(s’ouvre dans un nouvel onglet\)$/,
    });
    expect(lien).toHaveAttribute('href', 'https://github.com/zaratechs/grille-evaluation/issues');
    expect(lien).toHaveAttribute('target', '_blank');
    expect(lien).toHaveAttribute('rel', 'noopener noreferrer');
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});
