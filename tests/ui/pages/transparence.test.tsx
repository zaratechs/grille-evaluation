import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { monterApp } from '../outils/monter';

describe('Transparence', () => {
  it('nomme la police embarquée dans les PDF et sa licence', () => {
    monterApp('/transparence');
    const police = screen.getByRole('region', { name: 'Police des documents PDF' });
    expect(police).toHaveTextContent('Noto Sans');
    expect(police).toHaveTextContent('SIL Open Font License 1.1');
  });
});
