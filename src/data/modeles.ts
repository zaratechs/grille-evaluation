/**
 * Les 25 modèles de grilles de Paulo Mendonça, Conseiller pédagogique TIC, sous licence
 * CC BY-NC-SA 4.0. Repris tels quels de l'outil d'origine (noms sans numérotation) ;
 * descripteurs du niveau 1 (le plus faible) au niveau 5.
 */
import { NIVEAUX_PAR_DEFAUT } from '../domain/niveaux';
import { egaliserPoids } from '../domain/poids';
import type { Modele } from '../domain/types';

export const AUTEUR_MODELES = 'Paulo Mendonça';
export const LICENCE_MODELES = 'CC BY-NC-SA 4.0';

type Source = { id: string; nom: string; criteres: [string, string[]][] };

const SOURCES: Source[] = [
  {
    id: 'EtudeCas',
    nom: 'Étude de cas',
    criteres: [
      [
        'Analyse de la situation',
        [
          'Analyse superficielle ou hors sujet, sans prise en compte des éléments clés.',
          'Analyse partielle, laissant de côté plusieurs aspects importants du cas.',
          'Analyse adéquate couvrant les éléments de base avec quelques liens pertinents.',
          'Analyse solide couvrant les éléments essentiels et les principaux liens conceptuels.',
          'Analyse exhaustive, reliant clairement tous les éléments du cas à des concepts théoriques avancés.',
        ],
      ],
      [
        'Pertinence des solutions proposées',
        [
          'Solutions inadéquates, irréalistes ou absentes.',
          'Solutions peu adaptées ou incomplètes.',
          'Propose des solutions fonctionnelles mais parfois générales ou limitées.',
          'Propose des solutions solides et généralement adaptées aux enjeux.',
          'Propose des solutions créatives, réalistes et parfaitement alignées sur les enjeux du cas.',
        ],
      ],
      [
        'Mobilisation des ressources théoriques',
        [
          'Absence de références ou utilisation incorrecte des concepts.',
          'Mobilisation théorique faible ou peu adéquate.',
          "S'appuie sur quelques notions théoriques, parfois de manière limitée.",
          'Fait des liens théoriques pertinents et généralement bien utilisés.',
          'Intègre des références théoriques de façon rigoureuse et parfaitement contextualisée.',
        ],
      ],
      [
        'Justification des choix',
        [
          'Absence de justification ou argumentation non fondée.',
          'Justifications limitées ou peu cohérentes.',
          'Justifications présentes mais parfois superficielles.',
          'Justifications généralement claires et bien argumentées.',
          'Justifications détaillées, logiques et convaincantes, fondées sur des preuves solides.',
        ],
      ],
      [
        'Clarté de la structure du document',
        [
          'Document désorganisé ou difficile à suivre.',
          'Organisation faible nuisant à la compréhension.',
          'Structure compréhensible mais parfois irrégulière ou redondante.',
          'Structure claire comportant quelques légères irrégularités.',
          'Structure impeccable, logique et fluide facilitant la compréhension globale.',
        ],
      ],
    ],
  },
  {
    id: 'PresOrale',
    nom: 'Présentation orale',
    criteres: [
      [
        'Expression orale et articulation',
        [
          'Expression difficile à comprendre.',
          'Débit irrégulier ou articulation insuffisante.',
          'Expression adéquate mais parfois monotone ou hésitante.',
          'Expression claire avec quelques légères hésitations.',
          'Débit fluide, articulation précise et ton maîtrisé favorisant une écoute active.',
        ],
      ],
      [
        'Maîtrise du contenu',
        [
          'Maîtrise insuffisante du contenu présenté.',
          'Connaissances partielles ou lacunaires.',
          'Maîtrise suffisante mais limitée en profondeur.',
          'Bonne maîtrise du contenu avec de rares imprécisions.',
          'Maîtrise complète, démontrant une compréhension approfondie et nuancée.',
        ],
      ],
      [
        'Interaction avec le public',
        [
          'Aucune interaction ou attitude fermée.',
          "Peu d'efforts d'interaction.",
          'Interaction minimale mais présente.',
          'Bonne interaction avec quelques limites.',
          "Gère activement l'audience, capte l'attention et s'adapte aux réactions.",
        ],
      ],
      [
        'Qualité du support visuel',
        [
          'Absence ou mauvaise qualité du support.',
          'Support confus, peu lisible ou peu utile.',
          'Support acceptable mais parfois surchargé ou incomplet.',
          'Support clair avec quelques éléments améliorables.',
          'Support professionnel, clair, épuré et parfaitement aligné avec la présentation.',
        ],
      ],
      [
        'Gestion du temps',
        [
          'Gestion du temps non maîtrisée.',
          'Dépassements ou raccourcis affectant la qualité.',
          'Gestion du temps acceptable mais perfectible.',
          'Légers écarts, sans impact majeur.',
          'Respect impeccable du temps, rythme parfaitement équilibré.',
        ],
      ],
    ],
  },
  {
    id: 'TravailEcrit',
    nom: 'Travail écrit',
    criteres: [
      [
        "Qualité de l'argumentation",
        [
          "Absence d'argumentation structurée.",
          'Argumentation faible ou incohérente.',
          'Argumentation présente mais parfois superficielle.',
          'Argumentation cohérente et bien soutenue.',
          'Argumentation rigoureuse, nuancée et solidement appuyée.',
        ],
      ],
      [
        'Structure et cohérence du texte',
        [
          'Désorganisation générale.',
          'Organisation déficiente.',
          'Structure fonctionnelle mais parfois lourde.',
          'Structure claire malgré quelques légères irrégularités.',
          'Texte parfaitement structuré avec transitions fluides.',
        ],
      ],
      [
        "Qualité de l'écriture",
        [
          'Texte difficile à lire.',
          'Faiblesses stylistiques importantes.',
          'Écriture adéquate mais parfois répétitive ou imprécise.',
          'Écriture correcte avec quelques maladresses.',
          'Style soigné, vocabulaire précis et phrases maîtrisées.',
        ],
      ],
      [
        'Respect des normes de citation',
        [
          'Aucune norme respectée.',
          'Plusieurs erreurs importantes.',
          'Application acceptable mais partiellement maîtrisée.',
          'Quelques rares erreurs mineures.',
          'Normes appliquées de manière impeccable.',
        ],
      ],
      [
        'Pertinence du contenu',
        [
          'Pertinence faible ou inexistante.',
          'Contenu faible ou hors sujet.',
          'Contenu satisfaisant mais parfois général.',
          'Très bon contenu, bien ciblé.',
          'Contenu hautement pertinent, précis et complet.',
        ],
      ],
    ],
  },
  {
    id: 'RapportPro',
    nom: 'Rapport professionnel',
    criteres: [
      [
        'Analyse professionnelle',
        [
          'Analyse insuffisante.',
          'Analyse partielle.',
          'Analyse correcte mais peu approfondie.',
          'Très bonne analyse avec un regard professionnel pertinent.',
          'Analyse approfondie adoptant clairement une posture professionnelle.',
        ],
      ],
      [
        'Recommandations professionnelles',
        [
          'Recommandations inadéquates.',
          'Recommandations limitées.',
          'Recommandations utiles mais générales.',
          'Recommandations pertinentes.',
          'Recommandations solides, réalistes et adaptées au contexte du milieu.',
        ],
      ],
      [
        'Structure professionnelle',
        [
          'Structure inadéquate.',
          'Structure peu professionnelle.',
          'Structure acceptable mais inégale.',
          'Structure professionnelle avec quelques variations.',
          'Conformité parfaite aux standards professionnels.',
        ],
      ],
      [
        'Analyse de données / observations',
        [
          'Analyse incorrecte ou absente.',
          'Analyse faible.',
          'Interprétation limitée mais correcte.',
          'Interprétation pertinente.',
          'Interprétation fine des données avec mises en relation solides.',
        ],
      ],
      [
        'Qualité rédactionnelle',
        [
          'Rédaction inadéquate.',
          'Rédaction insuffisante.',
          'Rédaction acceptable.',
          'Rédaction correcte avec quelques maladresses.',
          'Rédaction claire, précise et adaptée au milieu professionnel.',
        ],
      ],
    ],
  },
  {
    id: 'TeamWork',
    nom: "Travail d'équipe",
    criteres: [
      [
        'Collaboration',
        [
          'Absence de collaboration.',
          'Participation faible.',
          'Collaboration fonctionnelle mais variable.',
          'Bonne collaboration avec quelques limites.',
          'Collaboration exemplaire favorisant la réussite collective.',
        ],
      ],
      [
        'Répartition des tâches',
        [
          'Aucune répartition claire.',
          'Répartition inégale.',
          'Répartition globalement correcte.',
          'Répartition adéquate.',
          'Répartition équitable et respectée par tous.',
        ],
      ],
      [
        'Qualité du climat de travail',
        [
          'Climat conflictuel.',
          'Climat problématique.',
          'Climat adéquat mais parfois tendu.',
          'Climat généralement bon.',
          'Climat positif favorisant la collaboration.',
        ],
      ],
      [
        'Contribution au contenu',
        [
          'Contribution insuffisante.',
          'Contribution faible.',
          'Contribution acceptable.',
          'Bonne contribution.',
          'Contribution substantielle et pertinente.',
        ],
      ],
      [
        'Gestion du processus',
        [
          'Gestion inadéquate.',
          'Gestion faible.',
          'Gestion acceptable.',
          'Bonne gestion du processus.',
          'Processus parfaitement géré avec outils et méthodes appropriés.',
        ],
      ],
    ],
  },
  {
    id: 'Portfolio',
    nom: 'Portfolio',
    criteres: [
      [
        "Qualité des preuves d'apprentissage",
        [
          'Absence de preuves significatives.',
          'Preuves incomplètes ou peu liées aux compétences.',
          'Preuves adéquates mais parfois limitées ou peu diversifiées.',
          'Preuves pertinentes et bien choisies, avec quelques manques mineurs.',
          'Preuves variées, pertinentes et clairement alignées avec les compétences visées.',
        ],
      ],
      [
        'Organisation du portfolio',
        [
          "Portfolio désorganisé ou difficile d'accès.",
          'Organisation faible nuisant à la compréhension.',
          'Organisation acceptable mais parfois confuse.',
          'Organisation généralement claire avec quelques sections moins fluides.',
          'Organisation très claire, logique et facile à naviguer.',
        ],
      ],
      [
        'Réflexion sur les apprentissages',
        [
          'Absence de réflexion ou descriptions factuelles seulement.',
          'Réflexions faibles ou peu développées.',
          'Réflexions présentes mais limitées.',
          'Réflexions pertinentes, parfois légèrement superficielles.',
          'Réflexions profondes et bien articulées intégrant théorie et pratique.',
        ],
      ],
      [
        'Pertinence des éléments sélectionnés',
        [
          'Choix non pertinents.',
          'Choix peu appropriés ou hors cible.',
          'Choix adéquats mais inégaux.',
          'Choix pertinents mais parfois redondants.',
          'Choix hautement judicieux illustrant parfaitement les apprentissages.',
        ],
      ],
      [
        'Progression démontrée',
        [
          'Aucune progression démontrée.',
          'Peu de progression observable.',
          'Progression perceptible mais limitée.',
          'Bonne progression avec quelques zones moins explicitées.',
          'Progression claire, significative et bien expliquée.',
        ],
      ],
    ],
  },
  {
    id: 'ProjetIntegrateur',
    nom: 'Projet intégrateur',
    criteres: [
      [
        'Planification du projet',
        [
          'Absence de planification structurée.',
          'Planification limitée ou imprécise.',
          'Planification fonctionnelle mais partielle.',
          'Planification solide mais avec quelques éléments à préciser.',
          'Planification complète incluant objectifs, étapes, ressources et risques.',
        ],
      ],
      [
        'Mobilisation des ressources',
        [
          'Aucune ressource mobilisée adéquatement.',
          'Difficulté à mobiliser les ressources.',
          'Mobilisation correcte mais incomplète.',
          'Bonne mobilisation avec quelques manques mineurs.',
          'Mobilisation efficace et pertinente de toutes les ressources nécessaires.',
        ],
      ],
      [
        'Créativité et innovation',
        [
          'Aucune créativité ou solution standard inadaptée.',
          'Peu de créativité observée.',
          'Quelques éléments créatifs mais limités.',
          'Bonne créativité avec des idées pertinentes.',
          'Approche hautement créative, originale et adaptée au contexte.',
        ],
      ],
      [
        'Qualité du livrable final',
        [
          'Livrable inadéquat.',
          "Livrable faible ou manquant d'essentiel.",
          'Livrable acceptable mais incomplet.',
          'Livrable de qualité avec quelques améliorations possibles.',
          'Livrable complet, professionnel et parfaitement aligné au mandat.',
        ],
      ],
      [
        'Gestion du projet',
        [
          'Gestion absente ou désorganisée.',
          'Gestion inefficace.',
          'Gestion acceptable avec quelques lacunes.',
          'Bonne gestion globale.',
          'Gestion exemplaire incluant suivi, communication et ajustements.',
        ],
      ],
    ],
  },
  {
    id: 'ExamenPratique',
    nom: 'Examen pratique',
    criteres: [
      [
        'Maîtrise technique',
        [
          'Incompétence technique manifeste.',
          'Maîtrise limitée ou mal assurée.',
          'Maîtrise correcte mais parfois hésitante.',
          'Très bonne maîtrise avec quelques imperfections mineures.',
          'Exécution impeccable démontrant une maîtrise totale du geste professionnel.',
        ],
      ],
      [
        'Application des procédures',
        [
          'Procédures non respectées.',
          'Plusieurs erreurs ou omissions.',
          'Application partielle.',
          'Application adéquate avec quelques oublis mineurs.',
          'Application rigoureuse et complète des procédures prescrites.',
        ],
      ],
      [
        'Sécurité',
        [
          'Aucune considération pour la sécurité.',
          'Écarts significatifs menaçant la sécurité.',
          'Respect acceptable avec quelques écarts.',
          'Respect global adéquat.',
          'Respect impeccable et proactif des normes de sécurité.',
        ],
      ],
      [
        "Efficacité de l'exécution",
        [
          'Exécution très inefficace.',
          'Exécution lente ou mal organisée.',
          'Efficacité correcte mais irrégulière.',
          'Exécution efficace avec quelques ralentissements.',
          'Exécution rapide, fluide et optimisée.',
        ],
      ],
      [
        'Précision',
        [
          'Résultats incorrects.',
          'Précision faible.',
          'Précision acceptable.',
          'Bonne précision.',
          "Très haute précision avec marges d'erreur minimes.",
        ],
      ],
    ],
  },
  {
    id: 'ExamenTheorique',
    nom: 'Examen théorique',
    criteres: [
      [
        'Connaissances',
        [
          'Connaissances insuffisantes.',
          'Connaissances partielles.',
          'Connaissances adéquates.',
          'Connaissances solides.',
          'Connaissances complètes et parfaitement maîtrisées.',
        ],
      ],
      [
        'Exactitude des réponses',
        [
          'Réponses majoritairement incorrectes.',
          'Plusieurs erreurs importantes.',
          'Quelques erreurs mineures.',
          "Très peu d'erreurs.",
          'Aucune erreur, réponses précises et bien formulées.',
        ],
      ],
      [
        'Compréhension des concepts',
        [
          'Incompréhension.',
          'Compréhension limitée.',
          'Compréhension de base.',
          'Bonne compréhension générale.',
          'Compréhension approfondie démontrant des liens pertinents.',
        ],
      ],
      [
        'Rigueur des justifications',
        [
          'Absence de justification.',
          'Justifications faibles.',
          'Justifications présentes mais limitées.',
          'Justifications pertinentes.',
          'Justifications solides et logiques.',
        ],
      ],
      [
        'Cohérence globale',
        [
          'Incohérence générale.',
          'Cohérence faible.',
          'Cohérence acceptable.',
          'Bonne cohérence.',
          'Cohérence parfaite.',
        ],
      ],
    ],
  },
  {
    id: 'JournalReflexif',
    nom: 'Journal réflexif',
    criteres: [
      [
        'Profondeur de la réflexion',
        [
          'Absence de réflexion.',
          'Réflexion superficielle.',
          'Réflexion présente mais limitée.',
          'Réflexion pertinente mais moins approfondie.',
          "Réflexion riche, introspective, démontrant un haut niveau d'analyse personnelle.",
        ],
      ],
      [
        'Lien théorie-pratique',
        [
          'Aucun lien établi.',
          'Lien faible.',
          'Lien présent mais simple.',
          'Lien généralement bien fait.',
          'Lien clair, cohérent et bien expliqué.',
        ],
      ],
      [
        'Authenticité du discours',
        [
          'Texte impersonnel.',
          "Très peu d'éléments personnels.",
          'Authenticité acceptable mais parfois factuelle.',
          'Ton personnel authentique avec quelques passages généraux.',
          'Expression personnelle authentique, nuancée et sincère.',
        ],
      ],
      [
        'Structure du texte',
        [
          'Structure absente.',
          'Structure faible.',
          'Structure acceptable.',
          'Structure généralement fluide.',
          'Structure claire facilitant la lecture.',
        ],
      ],
      [
        'Évolution de la pensée',
        [
          'Aucune évolution.',
          "Peu d'évolution.",
          'Évolution présente mais limitée.',
          'Bonne évolution observable.',
          'Évolution claire et explicite des réflexions au fil du journal.',
        ],
      ],
    ],
  },
  {
    id: 'Simulation',
    nom: 'Simulation',
    criteres: [
      [
        'Qualité du jeu de rôle',
        [
          'Jeu de rôle absent, inapproprié ou hors situation.',
          'Interprétation peu crédible ou peu engagée.',
          'Jeu de rôle acceptable mais parfois mécanique.',
          'Interprétation généralement réaliste avec quelques éléments moins naturels.',
          'Interprétation totalement crédible, cohérente et adaptée au contexte professionnel.',
        ],
      ],
      [
        'Réalisme des actions',
        [
          'Actions irréalistes ou inadéquates.',
          'Actions peu réalistes ou mal alignées avec le contexte.',
          'Actions fonctionnelles mais parfois éloignées du réel.',
          'Actions globalement réalistes avec quelques écarts mineurs.',
          'Actions parfaitement conformes aux pratiques réelles du milieu.',
        ],
      ],
      [
        'Réactivité aux imprévus',
        [
          "Aucune capacité d'adaptation.",
          'Difficulté à réagir aux imprévus.',
          'Réactivité acceptable mais limitée.',
          'Bonne réactivité malgré quelques hésitations.',
          'Réactions rapides, pertinentes et adaptées aux changements.',
        ],
      ],
      [
        'Application des connaissances',
        [
          'Aucune application des connaissances pertinentes.',
          'Application faible ou inadéquate.',
          'Application correcte mais parfois superficielle.',
          'Bonne application avec quelques limites mineures.',
          'Application exemplaire et nuancée des connaissances mobilisées.',
        ],
      ],
      [
        'Communication en situation',
        [
          'Communication inadéquate ou absente.',
          'Communication peu efficace.',
          'Communication suffisante mais irrégulière.',
          'Communication adéquate.',
          'Communication claire, professionnelle et parfaitement adaptée au contexte.',
        ],
      ],
    ],
  },
  {
    id: 'DemoTech',
    nom: 'Démonstration technique',
    criteres: [
      [
        'Qualité de la gestuelle',
        [
          'Gestuelle incorrecte ou dangereuse.',
          'Gestuelle peu assurée.',
          'Gestuelle correcte mais parfois maladroite.',
          'Gestuelle bonne mais avec quelques hésitations mineures.',
          'Gestes parfaitement maîtrisés, précis et fluides.',
        ],
      ],
      [
        'Respect des normes de sécurité',
        [
          'Normes non respectées.',
          'Plusieurs écarts importants.',
          'Respect acceptable avec quelques oublis.',
          'Respect généralement adéquat.',
          "Respectant en tout temps l'ensemble des normes avec vigilance proactive.",
        ],
      ],
      [
        'Exactitude des techniques',
        [
          'Techniques incorrectes.',
          'Techniques incomplètes ou erronées.',
          'Techniques adéquates mais parfois approximatives.',
          'Techniques généralement justes.',
          'Techniques exécutées avec une précision parfaite.',
        ],
      ],
      [
        'Clarté des explications',
        [
          'Explications absentes ou incohérentes.',
          'Explications peu claires.',
          'Explications fonctionnelles.',
          'Explications claires avec quelques imprécisions.',
          "Explications limpides, structurées et adaptées à l'audience.",
        ],
      ],
      [
        "Efficacité de l'exécution",
        [
          'Exécution inefficace.',
          'Exécution lente ou désorganisée.',
          'Efficacité moyenne.',
          'Efficacité généralement bonne.',
          'Exécution rapide, fluide et optimisée.',
        ],
      ],
    ],
  },
  {
    id: 'CapsuleVideo',
    nom: 'Capsule vidéo',
    criteres: [
      [
        'Clarté visuelle',
        [
          'Qualité visuelle très faible.',
          'Problèmes visuels fréquents affectant la compréhension.',
          'Image acceptable mais parfois instable ou sombre.',
          'Image claire malgré quelques imperfections mineures.',
          'Image nette, cadrage professionnel, transitions fluides.',
        ],
      ],
      [
        'Qualité sonore',
        [
          'Son inutilisable.',
          'Son faible, saturé ou difficile à entendre.',
          'Son compréhensible mais irrégulier.',
          'Bon son malgré quelques légers bruits.',
          'Son clair, constant et exempt de bruits parasites.',
        ],
      ],
      [
        'Pertinence du contenu',
        [
          'Contenu hors sujet.',
          'Contenu peu ciblé ou incomplet.',
          'Contenu adéquat.',
          'Contenu pertinent mais avec quelques longueurs.',
          'Contenu parfaitement ciblé, pertinent et bien structuré.',
        ],
      ],
      [
        'Créativité ou originalité',
        [
          'Vidéo sans originalité.',
          'Peu de créativité.',
          'Quelques efforts de créativité.',
          'Quelques éléments créatifs bien intégrés.',
          'Vidéo innovante, originale et captivante.',
        ],
      ],
      [
        'Structure de la vidéo',
        [
          'Structure désorganisée.',
          'Structure faible.',
          'Structure acceptable.',
          'Structure efficace malgré quelques irrégularités.',
          'Structure claire, cohérente et bien rythmée.',
        ],
      ],
    ],
  },
  {
    id: 'Infographie',
    nom: 'Infographie',
    criteres: [
      [
        'Lisibilité',
        [
          'Infographie illisible.',
          'Lisibilité faible ou confuse.',
          'Lisibilité acceptable mais parfois surchargée.',
          'Lisibilité bonne malgré quelques éléments denses.',
          'Mise en page très claire, lisible et professionnelle.',
        ],
      ],
      [
        'Pertinence des informations',
        [
          'Informations incorrectes.',
          'Informations limitées.',
          'Informations adéquates mais parfois générales.',
          'Bon niveau de pertinence.',
          'Informations pertinentes, exactes et parfaitement synthétisées.',
        ],
      ],
      [
        'Organisation visuelle',
        [
          'Organisation inadéquate.',
          'Organisation confuse.',
          'Organisation acceptable.',
          'Bonne organisation malgré quelques zones denses.',
          'Organisation impeccable favorisant la compréhension immédiate.',
        ],
      ],
      [
        'Créativité graphique',
        [
          'Design absent ou incohérent.',
          'Design faible ou peu adapté.',
          'Quelques efforts de design.',
          'Design intéressant mais légèrement inégal.',
          'Design original, professionnel et harmonieux.',
        ],
      ],
      [
        'Exactitude des données',
        [
          'Données incorrectes.',
          'Données vagues ou pauvres.',
          'Données adéquates.',
          'Quelques imprécisions mineures.',
          'Données parfaitement exactes et bien intégrées.',
        ],
      ],
    ],
  },
  {
    id: 'QuizFormatif',
    nom: 'Quiz formatif',
    criteres: [
      [
        'Exactitude des réponses',
        [
          'Presque toutes les réponses incorrectes.',
          'Plusieurs erreurs importantes.',
          'Quelques erreurs mineures.',
          "Très peu d'erreurs.",
          'Toutes les réponses exactes et bien justifiées.',
        ],
      ],
      [
        'Compréhension des notions',
        [
          'Incompréhension.',
          'Compréhension limitée.',
          'Compréhension suffisante.',
          'Bonne compréhension.',
          'Compréhension claire et complète.',
        ],
      ],
      [
        'Application des connaissances',
        [
          'Aucune application adéquate.',
          'Applications faibles.',
          'Applications présentes mais partielles.',
          'Applications globalement correctes.',
          'Applications justes, logiques et adaptées.',
        ],
      ],
      [
        'Rigueur dans le raisonnement',
        [
          'Raisonnement incohérent.',
          'Raisonnement confus.',
          'Raisonnement suffisant.',
          'Raisonnement solide avec quelques hésitations.',
          'Raisonnement logique et structuré.',
        ],
      ],
      [
        'Gestion du temps',
        [
          'Temps non respecté.',
          'Gestion faible.',
          'Gestion acceptable.',
          'Très bon respect du temps.',
          'Temps parfaitement géré.',
        ],
      ],
    ],
  },
  {
    id: 'EntrevueSim',
    nom: 'Entrevue simulée',
    criteres: [
      [
        'Communication verbale',
        [
          'Communication confuse ou inadaptée au contexte professionnel.',
          'Communication hésitante ou difficile à suivre.',
          'Communication adéquate mais parfois monotone ou imprécise.',
          'Communication généralement fluide avec quelques légères hésitations.',
          'Expression claire, articulée et professionnelle, avec un ton adapté en tout temps.',
        ],
      ],
      [
        'Professionnalisme',
        [
          'Attitude inadéquate ou non professionnelle.',
          'Attitude peu professionnelle ou inadaptée par moments.',
          'Attitude correcte mais parfois inconstante.',
          'Attitude professionnelle solide avec quelques écarts mineurs.',
          'Attitude exemplaire démontrant maturité, respect et tenue professionnelle.',
        ],
      ],
      [
        'Pertinence des réponses',
        [
          'Réponses hors sujet ou insuffisantes.',
          'Réponses limitées ou peu adaptées.',
          'Réponses adéquates mais parfois générales.',
          'Réponses pertinentes malgré quelques zones moins développées.',
          'Réponses précises, pertinentes et alignées avec les attentes du rôle.',
        ],
      ],
      [
        'Écoute active',
        [
          "Absence d'écoute ou interruptions fréquentes.",
          'Difficulté à écouter ou à comprendre certaines questions.',
          'Écoute acceptable mais parfois superficielle.',
          'Bonne écoute avec une compréhension adéquate.',
          'Écoute attentive, reformulations appropriées et prise en compte claire des questions.',
        ],
      ],
      [
        'Gestion du stress',
        [
          "Stress non maîtrisé compromettant l'entrevue.",
          'Stress visible affectant les réponses.',
          'Gestion correcte mais parfois déstabilisée.',
          'Bonne gestion du stress avec quelques signes mineurs de tension.',
          'Gestion calme, stable et professionnelle, même en situation difficile.',
        ],
      ],
    ],
  },
  {
    id: 'ResolProbleme',
    nom: 'Résolution de problème',
    criteres: [
      [
        'Analyse du problème',
        [
          'Aucune analyse ou analyse hors sujet.',
          'Analyse partielle ou incorrecte.',
          'Analyse acceptable mais superficielle.',
          'Analyse solide mais parfois moins nuancée.',
          'Analyse complète, précise et bien articulée identifiant toutes les causes possibles.',
        ],
      ],
      [
        'Stratégie proposée',
        [
          'Absence de stratégie ou stratégie inappropriée.',
          'Stratégie faible ou imprécise.',
          'Stratégie fonctionnelle mais générale.',
          'Bonne stratégie malgré quelques limites mineures.',
          'Stratégie rigoureuse, réaliste et cohérente avec les données.',
        ],
      ],
      [
        'Justification des choix',
        [
          'Absence de justification.',
          'Justifications faibles ou mal fondées.',
          'Justifications adéquates mais limitées.',
          'Justifications pertinentes mais parfois moins approfondies.',
          'Justifications logiques, détaillées et bien appuyées.',
        ],
      ],
      [
        'Exactitude de la solution',
        [
          'Solution incorrecte.',
          'Solution faible ou insuffisante.',
          'Solution acceptable mais partielle.',
          "Solution juste dans l'ensemble avec quelques imprécisions.",
          'Solution parfaitement juste et adaptée.',
        ],
      ],
      [
        'Pertinence du raisonnement',
        [
          'Raisonnement incohérent.',
          'Raisonnement confus ou incomplet.',
          'Raisonnement parfois superficiel.',
          "Raisonnement solide dans l'ensemble.",
          'Raisonnement clair, rigoureux et structuré.',
        ],
      ],
    ],
  },
  {
    id: 'Labo',
    nom: 'Laboratoire',
    criteres: [
      [
        'Manipulation du matériel',
        [
          'Manipulation incorrecte ou dangereuse.',
          'Manipulation peu sécuritaire ou maladroite.',
          'Manipulation correcte mais parfois hésitante.',
          'Manipulation bonne avec quelques légers ajustements nécessaires.',
          'Manipulation précise, sécuritaire et parfaitement maîtrisée.',
        ],
      ],
      [
        'Respect des normes de sécurité',
        [
          'Normes de sécurité non respectées.',
          'Plusieurs écarts importants.',
          'Respect acceptable mais irrégulier.',
          'Respect global adéquat avec quelques écarts mineurs.',
          'Respect strict et constant de toutes les normes.',
        ],
      ],
      [
        'Observation et mesures',
        [
          'Observations erronées.',
          'Observations parfois incorrectes.',
          'Observations adéquates.',
          'Observations justes malgré quelques écarts mineurs.',
          'Observations précises, rigoureuses et bien documentées.',
        ],
      ],
      [
        'Rigueur dans le protocole',
        [
          'Protocole non respecté.',
          'Protocole incomplet ou mal appliqué.',
          'Protocole respecté mais parfois approximatif.',
          'Protocole globalement bien suivi.',
          'Protocole suivi avec exactitude et discipline scientifique.',
        ],
      ],
      [
        'Résultats obtenus',
        [
          'Résultats incorrects.',
          'Résultats faibles ou incohérents.',
          'Résultats acceptables.',
          'Résultats fiables malgré quelques écarts.',
          'Résultats justes, clairs et alignés avec les objectifs expérimentaux.',
        ],
      ],
    ],
  },
  {
    id: 'MicroEns',
    nom: 'Micro-enseignement',
    criteres: [
      [
        'Clarté des explications',
        [
          'Explications incohérentes ou absentes.',
          'Explications peu claires.',
          'Explications adéquates.',
          'Explications claires mais parfois trop rapides ou inégales.',
          'Explications limpides, structurées et adaptées au niveau du public.',
        ],
      ],
      [
        'Interaction avec les apprenants',
        [
          'Aucune interaction.',
          "Peu d'interaction.",
          'Interaction acceptable mais minimaliste.',
          "Bonne interaction dans l'ensemble.",
          'Interaction dynamique, stimulante et bien gérée.',
        ],
      ],
      [
        'Qualité pédagogique',
        [
          'Aucune intention pédagogique claire.',
          'Choix limités ou inadéquats.',
          'Choix pédagogiques suffisants.',
          'Bon choix pédagogique.',
          'Approches pédagogiques pertinentes, variées et cohérentes.',
        ],
      ],
      [
        'Structure du mini-cours',
        [
          'Absence de structure.',
          'Structure faible.',
          'Structure acceptable.',
          'Bonne structure malgré quelques irrégularités.',
          'Structure parfaitement logique et fluide.',
        ],
      ],
      [
        'Dynamique et présence',
        [
          'Présence faible ou inefficace.',
          'Présence peu engageante.',
          'Présence suffisante mais discrète.',
          'Bonne présence malgré quelques moments plus faibles.',
          'Présence engageante, énergique et professionnelle.',
        ],
      ],
    ],
  },
  {
    id: 'CarteConcept',
    nom: 'Carte conceptuelle',
    criteres: [
      [
        'Organisation des concepts',
        [
          'Organisation incohérente.',
          'Organisation confuse.',
          'Organisation acceptable.',
          'Organisation généralement cohérente.',
          'Organisation logique, hiérarchique et très claire.',
        ],
      ],
      [
        'Liens conceptuels',
        [
          'Liens absents ou incorrects.',
          'Liens faibles.',
          'Liens présents mais parfois superficiels.',
          "Bons liens conceptuels dans l'ensemble.",
          'Liens pertinents, nombreux et bien justifiés.',
        ],
      ],
      [
        'Exactitude des concepts',
        [
          'Concepts erronés.',
          'Concepts parfois incorrects.',
          'Concepts acceptables mais incomplets.',
          'Concepts globalement justes.',
          'Concepts justes, précis et bien définis.',
        ],
      ],
      [
        'Clarté visuelle',
        [
          'Carte difficile à lire.',
          'Lisibilité faible.',
          'Lisibilité moyenne.',
          "Lisibilité bonne dans l'ensemble.",
          'Carte très lisible, épurée et bien structurée.',
        ],
      ],
      [
        'Pertinence du contenu',
        [
          'Contenu hors sujet.',
          'Contenu limité.',
          'Contenu adéquat.',
          'Bon contenu malgré quelques longueurs.',
          'Contenu parfaitement aligné avec les objectifs.',
        ],
      ],
    ],
  },
  {
    id: 'PlanAction',
    nom: "Plan d'action",
    criteres: [
      [
        'Définition des objectifs',
        [
          "Absence d'objectifs clairs.",
          'Objectifs vagues ou peu réalistes.',
          'Objectifs adéquats mais parfois trop généraux.',
          'Objectifs bien définis malgré quelques imprécisions mineures.',
          'Objectifs clairs, mesurables, réalistes et parfaitement alignés avec les besoins identifiés.',
        ],
      ],
      [
        'Cohérence du plan',
        [
          'Plan incohérent.',
          'Plan difficile à suivre.',
          'Cohérence acceptable mais inégale.',
          'Plan généralement cohérent.',
          'Plan cohérent, logique et bien structuré.',
        ],
      ],
      [
        'Faisabilité des actions',
        [
          'Actions irréalistes ou inapplicables.',
          'Actions peu réalistes.',
          'Actions réalisables mais manquant de précision.',
          'Actions généralement faisables.',
          'Actions très réalistes, bien définies et réalisables.',
        ],
      ],
      [
        'Précision des étapes',
        [
          'Étapes absentes ou désorganisées.',
          'Étapes floues ou insuffisamment détaillées.',
          'Étapes présentes mais parfois générales.',
          'Étapes bien présentées malgré quelques lacunes.',
          'Étapes détaillées, claires et ordonnées.',
        ],
      ],
      [
        'Pertinence des indicateurs de suivi',
        [
          "Absence d'indicateurs pertinents.",
          'Indicateurs faibles ou peu utiles.',
          'Indicateurs acceptables mais parfois vagues.',
          'Bons indicateurs avec quelques améliorations possibles.',
          'Indicateurs précis, mesurables et parfaitement adaptés au suivi du plan.',
        ],
      ],
    ],
  },
  {
    id: 'AnalyseDonnees',
    nom: 'Analyse de données',
    criteres: [
      [
        'Qualité de la collecte',
        [
          'Collecte inadéquate.',
          'Collecte partielle ou mal structurée.',
          'Collecte correcte mais parfois incomplète.',
          'Collecte solide malgré quelques limites mineures.',
          'Collecte rigoureuse, méthodique et parfaitement documentée.',
        ],
      ],
      [
        'Traitement des données',
        [
          'Erreurs importantes dans le traitement.',
          'Traitement incomplet ou imprécis.',
          'Traitement acceptable.',
          'Bon traitement global.',
          'Traitement précis, structuré et conforme aux méthodes appropriées.',
        ],
      ],
      [
        'Interprétation',
        [
          'Interprétation incorrecte ou absente.',
          'Interprétation faible.',
          'Interprétation adéquate mais limitée.',
          'Interprétation généralement solide.',
          'Interprétation fine, pertinente et bien argumentée.',
        ],
      ],
      [
        'Visualisation des données',
        [
          'Visualisations incorrectes ou absentes.',
          'Visualisations peu claires.',
          'Visualisations correctes mais génériques.',
          'Visualisations efficaces avec quelques lacunes.',
          'Graphiques clairs, pertinents et bien présentés.',
        ],
      ],
      [
        'Rigueur scientifique',
        [
          'Absence de rigueur ou erreurs majeures.',
          'Rigueur faible.',
          'Rigueur acceptable.',
          'Rigueur généralement bonne.',
          'Excellent respect des principes scientifiques et méthodologiques.',
        ],
      ],
    ],
  },
  {
    id: 'Debat',
    nom: 'Débat',
    criteres: [
      [
        'Argumentation',
        [
          "Absence d'argumentation sérieuse.",
          'Arguments faibles ou mal soutenus.',
          'Arguments acceptables mais parfois généraux.',
          'Bons arguments avec quelques limites mineures.',
          'Arguments solides, nuancés, bien démontrés et convaincants.',
        ],
      ],
      [
        'Écoute des autres',
        [
          "Interruption ou absence d'écoute.",
          "Peu d'écoute des autres.",
          'Écoute correcte mais inconstante.',
          "Bonne écoute malgré quelques moments d'inattention.",
          'Écoute active, respectueuse et constructive.',
        ],
      ],
      [
        'Pertinence des interventions',
        [
          'Interventions hors sujet.',
          'Interventions peu pertinentes.',
          'Interventions adéquates mais parfois hors propos.',
          "Interventions pertinentes dans l'ensemble.",
          'Interventions hautement pertinentes et bien intégrées au débat.',
        ],
      ],
      [
        'Interaction avec les opposants',
        [
          'Interaction inadéquate ou agressive.',
          'Difficulté à gérer le désaccord.',
          'Interaction correcte mais parfois rigide.',
          'Bonne gestion du désaccord.',
          'Interaction constructive, respectueuse et bien gérée.',
        ],
      ],
      [
        'Gestion du temps de parole',
        [
          'Temps non respecté.',
          'Gestion inégale.',
          'Gestion acceptable.',
          'Bonne gestion globale.',
          'Gestion exemplaire, équilibrée et respectueuse du cadre.',
        ],
      ],
    ],
  },
  {
    id: 'DiscussionDir',
    nom: 'Discussion dirigée',
    criteres: [
      [
        'Participation',
        [
          'Absence de participation.',
          'Participation minimaliste.',
          'Participation correcte mais limitée.',
          "Bonne participation dans l'ensemble.",
          'Participation active, constructive et constante.',
        ],
      ],
      [
        'Pertinence des propos',
        [
          'Propos hors sujet.',
          'Propos peu pertinents.',
          'Propos acceptables.',
          'Propos généralement pertinents.',
          'Contributions très pertinentes, cohérentes et enrichissantes.',
        ],
      ],
      [
        'Écoute et respect',
        [
          'Attitude irrespectueuse.',
          'Écoute limitée.',
          'Respect acceptable.',
          'Bon respect malgré quelques écarts mineurs.',
          'Écoute active, respect mutuel exemplaire.',
        ],
      ],
      [
        'Interaction entre pairs',
        [
          'Aucune interaction.',
          'Interaction faible.',
          'Interaction acceptable.',
          'Interaction solide.',
          'Très bonne capacité à relancer, questionner et enrichir les échanges.',
        ],
      ],
      [
        "Capacité d'analyse",
        [
          'Analyse absente.',
          'Analyse limitée.',
          'Analyse suffisante.',
          'Bonne analyse générale.',
          'Analyse fine et pertinente des idées discutées.',
        ],
      ],
    ],
  },
  {
    id: 'EtudeCompar',
    nom: 'Étude comparative',
    criteres: [
      [
        'Définition des critères de comparaison',
        [
          'Absence de critères pertinents.',
          'Critères partiels ou mal définis.',
          'Critères adéquats.',
          'Critères pertinents malgré quelques imprécisions.',
          'Critères clairs, pertinents et parfaitement justifiés.',
        ],
      ],
      [
        'Analyse comparative',
        [
          'Analyse incorrecte ou absente.',
          'Analyse faible.',
          'Analyse correcte.',
          'Analyse bonne mais moins nuancée.',
          'Analyse rigoureuse mettant en évidence les différences et similarités de manière précise.',
        ],
      ],
      [
        'Pertinence des exemples',
        [
          'Exemples hors sujet.',
          'Exemples limités.',
          'Exemples adéquats.',
          'Exemples pertinents.',
          "Exemples très pertinents renforçant l'analyse.",
        ],
      ],
      [
        'Structure du texte comparatif',
        [
          'Structure désorganisée.',
          'Structure confuse.',
          'Structure acceptable.',
          'Structure adéquate.',
          'Structure logique, fluide et très claire.',
        ],
      ],
      [
        'Conclusion comparative',
        [
          'Conclusion absente ou inadéquate.',
          'Conclusion faible.',
          'Conclusion adéquate.',
          'Conclusion pertinente.',
          'Conclusion solide, synthétique et bien appuyée.',
        ],
      ],
    ],
  },
];

export const MODELES_FOURNIS: readonly Modele[] = SOURCES.map(({ id, nom, criteres }) => {
  const poids = egaliserPoids(criteres.length);
  return {
    id,
    nom,
    niveaux: [...NIVEAUX_PAR_DEFAUT],
    criteres: criteres.map(([nomCritere, descripteurs], i) => ({
      nom: nomCritere,
      poids: poids[i] ?? 0,
      descripteurs: [...descripteurs],
    })),
  };
});
