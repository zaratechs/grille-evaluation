import { describe, it, expect } from 'vitest';
import { TAILLE_MAX_IMPORT, exporterJSON, importerJSON } from '../../src/data-access/portabilite';
import { ajouterCritere, changerPoids } from '../../src/domain/criteres';
import { changerTitre, dossierVide } from '../../src/domain/dossier';
import { ajouterEtudiant, commenter, evaluer } from '../../src/domain/groupe';
import { enregistrerModele } from '../../src/domain/modeles';
import type { Dossier } from '../../src/domain/types';

const valide = <T>(r: { ok: true; valeur: T } | { ok: false; erreur: string }): T => {
  if (!r.ok) throw new Error(`échec inattendu : ${r.erreur}`);
  return r.valeur;
};

const compteur = () => {
  let i = 0;
  return () => `n${++i}`;
};

/** Dossier complet : titre, un critère, une personne évaluée et commentée, un modèle. */
function complet(): Dossier {
  let d = valide(changerTitre(dossierVide(), 'Session'));
  d = valide(ajouterCritere(d, 'c1'));
  d = valide(changerPoids(d, 'c1', 1000));
  d = valide(ajouterEtudiant(d, 'e1', 'Élise Roy'));
  d = valide(evaluer(d, 'e1', 'c1', 4));
  d = valide(commenter(d, 'e1', 'c1', 'Précis.'));
  return valide(enregistrerModele(d, 'm1', 'Mon modèle'));
}

/** Dossier courant d'une autre session : une autre grille, un autre groupe, un autre modèle. */
function courant(): Dossier {
  let d = valide(ajouterCritere(dossierVide(), 'x1'));
  d = valide(ajouterEtudiant(d, 'p1', 'Noé Roy'));
  d = valide(evaluer(d, 'p1', 'x1', 2));
  return valide(enregistrerModele(d, 'm9', 'Modèle à moi'));
}

const importer = (texte: string, base: Dossier = dossierVide()) =>
  importerJSON(texte, base, compteur());

describe('exporterJSON', () => {
  it('écrit tout le dossier, avec sa version, en JSON indenté', () => {
    const texte = exporterJSON(complet());
    expect(JSON.parse(texte)).toEqual(complet());
    expect(texte).toContain('\n  "version": 1');
  });

  it('décision 5 : « grille seule » retire les personnes étudiantes', () => {
    const texte = exporterJSON(complet(), { grilleSeule: true });
    const lu = JSON.parse(texte);
    expect(lu).not.toHaveProperty('etudiants');
    expect(texte).not.toContain('Élise');
    expect(lu.grille).toEqual(complet().grille);
    expect(lu.modelesPerso).toEqual(complet().modelesPerso);
  });
});

describe('importerJSON : aller-retour', () => {
  it('export puis import dans un dossier vide redonne exactement le même dossier', () => {
    const r = valide(importer(exporterJSON(complet())));
    expect(r).toEqual({
      dossier: complet(),
      modifie: false,
      bilan: expect.any(Object),
      grilleSeule: false,
      modelesAjoutes: 1,
    });
  });

  it('réimporter sa propre sauvegarde ne duplique pas ses modèles', () => {
    const r = valide(importer(exporterJSON(complet()), complet()));
    expect(r.dossier).toEqual(complet());
    expect(r.modelesAjoutes).toBe(0);
  });
});

describe('importerJSON : dossier complet', () => {
  it('décision 4 : remplace la grille et le groupe, fusionne les modèles personnels', () => {
    const r = valide(importer(exporterJSON(complet()), courant()));
    expect(r.dossier.grille).toEqual(complet().grille);
    expect(r.dossier.etudiants).toEqual(complet().etudiants);
    expect(r.dossier.modelesPerso.map((m) => m.nom)).toEqual(['Modèle à moi', 'Mon modèle']);
    expect(r.modelesAjoutes).toBe(1);
  });

  it('un groupe vide dans le fichier vide le groupe courant', () => {
    const vide = { ...complet(), etudiants: [] };
    expect(valide(importer(exporterJSON(vide), courant())).dossier.etudiants).toEqual([]);
  });
});

describe('importerJSON : grille seule', () => {
  it('garde le groupe courant, nettoie ses évaluations, garde les commentaires généraux', () => {
    const base = courant();
    base.etudiants[0] = { ...base.etudiants[0]!, commentaireGeneral: 'Bien.' };
    const r = valide(importer(exporterJSON(complet(), { grilleSeule: true }), base));
    expect(r.grilleSeule).toBe(true);
    expect(r.modifie).toBe(false);
    expect(r.dossier.grille).toEqual(complet().grille);
    expect(r.dossier.etudiants).toEqual([
      { id: 'p1', nom: 'Noé Roy', niveaux: {}, commentaires: {}, commentaireGeneral: 'Bien.' },
    ]);
  });
});

describe('importerJSON : fichier abîmé', () => {
  it('est réparé, avec le bilan', () => {
    const abime = { ...complet(), grille: { ...complet().grille, totalPoints: 'vingt' } };
    const r = valide(importer(JSON.stringify(abime)));
    expect(r.modifie).toBe(true);
    expect(r.bilan.parametresCorriges).toBe(1);
    expect(r.dossier.grille.totalPoints).toBe(100);
  });
});

describe('importerJSON : refus, sans rien modifier', () => {
  it.each([
    ['JSON invalide', '{ "version": 1,', 'json-invalide'],
    ['sans version', '{ "grille": {} }', 'version-inconnue'],
    ['version future', JSON.stringify({ ...complet(), version: 99 }), 'version-future'],
    ['pas un dossier', '{ "version": 1 }', 'pas-un-dossier'],
    ['une liste', '[]', 'version-inconnue'],
  ])('%s → %s', (_, texte, code) => {
    const base = courant();
    const copie = structuredClone(base);
    expect(importer(texte, base)).toEqual({ ok: false, erreur: code });
    expect(base).toEqual(copie);
  });

  it('décision 7 : refuse un texte de plus de 5 Mo sans le lire', () => {
    expect(TAILLE_MAX_IMPORT).toBe(5 * 1024 * 1024);
    const trop = `"${'é'.repeat(TAILLE_MAX_IMPORT / 2)}"`;
    expect(importer(trop)).toEqual({ ok: false, erreur: 'fichier-trop-gros' });
  });
});
