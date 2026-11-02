// Garde de neutralité : aucun nom d'établissement ni adresse courriel dans les fichiers livrés.
// Zones scannées : SCAN_DIRS et SCAN_ROOT_FILES ci-dessous.
// Hors périmètre : node_modules/, docs/superpowers/ (les specs nomment ce qu'elles proscrivent)
// et ce fichier lui-même (le garde doit nommer ce qu'il interdit). Les tests du garde
// assemblent les termes interdits à l'exécution pour rester scannés.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, relative, extname, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { argv, exit } from 'node:process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SELF = basename(fileURLToPath(import.meta.url));
const SCAN_DIRS = ['src', 'app', 'scripts', 'tests', 'public', '.github'];
const SCAN_ROOT_FILES = ['README.md', 'CHANGELOG.md', 'LICENSE', 'index.html'];
const IGNORED_DIRS = new Set(['node_modules', 'superpowers']);
const EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.html',
  '.css',
  '.svg', // un logo peut porter un nom d'établissement dans <title> ou <desc>
  '.txt',
]);

// Aucun drapeau `g` : RegExp.test() deviendrait dépendant de lastIndex.
export const FORBIDDEN = [
  { label: 'Marie-Victorin', re: /marie[-\s]?victorin/i },
  { label: 'CMV', re: /\bCMV\b/ },
  { label: 'CVM', re: /\bCVM\b/ },
  { label: 'Collège de Maisonneuve', re: /coll[èe]ge de maisonneuve/i },
  { label: 'André-Laurendeau', re: /andr[ée][-\s]?laurendeau/i },
  { label: 'claurendeau', re: /claurendeau/i },
  // Partie locale, @, domaine terminé par au moins deux lettres : « react@19.2.8 » ne
  // correspond pas, « @axe-core/playwright » non plus (rien avant le @).
  { label: 'Adresse courriel', re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}\b/i },
];

export function scan(content, file) {
  const hits = [];
  content.split(/\r?\n/).forEach((line, i) => {
    for (const { label, re } of FORBIDDEN) {
      if (re.test(line)) hits.push({ file, line: i + 1, label, text: line.trim().slice(0, 120) });
    }
  });
  return hits;
}

function walk(dir, acc) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc; // zone absente
  }
  for (const name of entries) {
    if (IGNORED_DIRS.has(name) || name === SELF) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue; // lien cassé ou fichier disparu entre readdir et stat
    }
    if (st.isDirectory()) walk(full, acc);
    else if (EXTS.has(extname(name))) acc.push(full);
  }
  return acc;
}

export function scanRepo(root = ROOT) {
  const files = [];
  for (const d of SCAN_DIRS) walk(resolve(root, d), files);
  for (const f of SCAN_ROOT_FILES) files.push(resolve(root, f));
  const hits = [];
  for (const f of files) {
    let content;
    try {
      content = readFileSync(f, 'utf8');
    } catch {
      continue; // fichier racine absent
    }
    hits.push(...scan(content, relative(root, f)));
  }
  return hits;
}

function main() {
  const hits = scanRepo();
  if (hits.length === 0) {
    console.log('check-neutralite : OK — aucune mention interdite dans les fichiers livrés.');
    return;
  }
  console.error('check-neutralite : ÉCHEC — mentions interdites :');
  for (const h of hits) console.error(`  ${h.file}:${h.line}  [${h.label}]  ${h.text}`);
  exit(1);
}

if (import.meta.url === pathToFileURL(argv[1] ?? '').href) {
  main();
}
