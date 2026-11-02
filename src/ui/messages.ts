import type { Avertissement } from '../data-access';
import type { BilanReparation, CodeErreur } from '../domain';

/**
 * Un texte pour chaque code du domaine et de l'accès aux données. Le type `Record` oblige à
 * en écrire un pour tout nouveau code : TypeScript refuse un oubli.
 */
export const MESSAGES_ERREUR: Record<CodeErreur, string> = {
  'poids-invalide': 'Le poids doit être un nombre de 0 à 100, au dixième près.',
  'total-points-invalide': 'Le total de points doit être un nombre entier de 1 à 1000.',
  'niveaux-minimum': 'Une grille compte au moins 3 niveaux.',
  'niveaux-maximum': 'Une grille compte au plus 10 niveaux.',
  'niveau-invalide': 'Ce niveau n’existe pas dans la grille.',
  'nom-vide': 'Le nom ne peut pas être vide.',
  'nom-trop-long': 'Ce nom est trop long.',
  'nom-en-double': 'Ce nom est déjà utilisé (les accents et les majuscules sont ignorés).',
  'critere-introuvable': 'Ce critère n’existe plus.',
  'etudiant-introuvable': 'Cette personne étudiante n’existe plus.',
  'identifiant-en-double': 'Un élément porte déjà cet identifiant.',
  'modele-introuvable': 'Ce modèle n’existe plus.',
  'version-inconnue': 'Ce fichier ne vient pas de l’application Grille d’évaluation.',
  'pas-un-dossier': 'Ce fichier ne contient pas de grille.',
  'ecriture-impossible': 'La dernière modification n’a pas pu être enregistrée dans ce navigateur.',
  'fichier-trop-gros': 'Ce fichier dépasse 5 Mo : ce n’est pas une sauvegarde de grille.',
  'fichier-illisible': 'Ce fichier n’a pas pu être lu.',
  'json-invalide': 'Ce fichier est abîmé ou n’est pas au format JSON.',
  'version-future':
    'Ce fichier vient d’une version plus récente de l’application : mettez la page à jour.',
};

export const MESSAGES_AVERTISSEMENT: Record<Avertissement, string> = {
  repare: 'Votre sauvegarde était abîmée ; elle a été réparée.',
  illisible: 'Votre sauvegarde n’a pas pu être lue. Une copie est gardée.',
  'version-future':
    'Votre sauvegarde vient d’une version plus récente de l’application. Une copie est gardée.',
  'lecture-impossible':
    'Ce navigateur refuse l’enregistrement : vos modifications seront perdues en fermant la page.',
};

/** Singulier, pluriel, pour chaque type de correction du bilan. */
const LIBELLES_BILAN: Record<keyof BilanReparation, [string, string]> = {
  parametresCorriges: ['paramètre corrigé', 'paramètres corrigés'],
  niveauxCorriges: ['niveau corrigé', 'niveaux corrigés'],
  criteresEcartes: ['critère écarté', 'critères écartés'],
  identifiantsRemplaces: ['identifiant remplacé', 'identifiants remplacés'],
  nomsCorriges: ['nom corrigé', 'noms corrigés'],
  poidsCorriges: ['poids corrigé', 'poids corrigés'],
  descripteursCorriges: ['descripteur corrigé', 'descripteurs corrigés'],
  personnesEcartees: ['personne étudiante écartée', 'personnes étudiantes écartées'],
  evaluationsEcartees: ['évaluation écartée', 'évaluations écartées'],
  modelesEcartes: ['modèle écarté', 'modèles écartés'],
};

/** Le bilan d'une réparation en phrases courtes (« 2 poids corrigés ») ; rien s'il est vide. */
export function phrasesBilan(bilan: BilanReparation): string[] {
  return (Object.keys(LIBELLES_BILAN) as (keyof BilanReparation)[])
    .filter((cle) => bilan[cle] > 0)
    .map((cle) => {
      const [un, plusieurs] = LIBELLES_BILAN[cle];
      return `${bilan[cle]} ${bilan[cle] > 1 ? plusieurs : un}`;
    });
}
