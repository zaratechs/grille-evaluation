/**
 * Couleurs des documents exportés, en RVB : les mêmes que l'écran. Un test vérifie que
 * chacune correspond à son jeton de `src/ui/tokens.css`, seul fichier qui écrit les
 * couleurs en hexadécimal.
 */
export type Rvb = readonly [number, number, number];

export const COULEURS = {
  marque: [12, 74, 110],
  texte: [22, 36, 44],
  texteAttenue: [86, 96, 104],
  bordure: [215, 224, 230],
  fondAttenue: [245, 247, 249],
  blanc: [255, 255, 255],
} as const satisfies Record<string, Rvb>;

/** Le jeton de `tokens.css` (sans « --color- ») dont chaque couleur est tirée. */
export const JETONS: Record<keyof typeof COULEURS, string> = {
  marque: 'marque-700',
  texte: 'texte',
  texteAttenue: 'texte-attenue',
  bordure: 'bordure',
  fondAttenue: 'surface-attenue',
  blanc: 'surface',
};

/** [12, 74, 110] → « 0C4A6E », la forme qu'attend Word. */
export const hexDocx = (rvb: Rvb): string =>
  rvb
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
