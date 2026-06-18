/**
 * Fix nancheoseok 2-2 mapping.
 *
 * Problem:
 *   The original update_nancheoseok_2_2.py script used the ODT source's own
 *   chapter numbering (11,12,13,14) for both the comic folder names and the
 *   commentary JSON keys.  But the app's internal chapter numbering is a
 *   sequential index over ALL flattened subchapters (1..33), so ODT "chapters
 *   11-14" actually map to app chapters 9, 10, 11.
 *
 * What this script does:
 *   1. Moves comic images into the correct chapter folders
 *      chapter-11/150-156  + chapter-12/157-173 + chapter-13/174-179  → chapter-9/
 *      chapter-13/180-214                                              → chapter-10/
 *      chapter-13/215-216  + chapter-14/217-228                        → chapter-11/
 *
 *   2. Remaps commentary keys in bodhi-commentary.json
 *      Old keys (11.8-11.14, 12.1-12.17, 13.1-13.43, 14.1-14.12)
 *      → New keys (9.1-9.30, 10.1-10.35, 11.1-11.14)
 */

const fs = require('fs');
const path = require('path');

const ROOT = 'c:/Users/roadsea/Desktop/bori-1';
const COMIC_ROOT = path.join(ROOT, 'src/assets/learning-comic');
const COMMENTARY_PATH = path.join(ROOT, 'public/bodhi-commentary.json');

// ─── 1. Build the verse-number → (old chapter, old file) → (new chapter) mapping ───

// From update_nancheoseok_2_2.py's get_commentary_key:
function getOldCommentaryKey(verseNum) {
    if (verseNum >= 150 && verseNum <= 156) return { ch: 11, key: `11.${verseNum - 143 + 1}` };
    if (verseNum >= 157 && verseNum <= 173) return { ch: 12, key: `12.${verseNum - 157 + 1}` };
    if (verseNum >= 174 && verseNum <= 216) return { ch: 13, key: `13.${verseNum - 174 + 1}` };
    if (verseNum >= 217 && verseNum <= 228) return { ch: 14, key: `14.${verseNum - 217 + 1}` };
    return null;
}

// App's actual chapter mapping for these verses:
//   ch9:  global verses 150-179  (30 paragraphs) → local 1-30
//   ch10: global verses 180-214  (35 paragraphs) → local 1-35
//   ch11: global verses 215-228  (14 paragraphs) → local 1-14
function getNewMapping(verseNum) {
    if (verseNum >= 150 && verseNum <= 179) {
        const localIdx = verseNum - 150 + 1;
        return { ch: 9, key: `9.${localIdx}` };
    }
    if (verseNum >= 180 && verseNum <= 214) {
        const localIdx = verseNum - 180 + 1;
        return { ch: 10, key: `10.${localIdx}` };
    }
    if (verseNum >= 215 && verseNum <= 228) {
        const localIdx = verseNum - 215 + 1;
        return { ch: 11, key: `11.${localIdx}` };
    }
    return null;
}

// ─── 2. Fix comic images ───

console.log('=== Step 1: Fix comic image locations ===\n');

// First pass: collect all moves needed
const moves = [];
for (let v = 150; v <= 228; v++) {
    const old = getOldCommentaryKey(v);
    const nw = getNewMapping(v);
    if (!old || !nw) continue;

    const srcFile = path.join(COMIC_ROOT, `chapter-${old.ch}`, `${v}.png`);
    const dstDir = path.join(COMIC_ROOT, `chapter-${nw.ch}`);
    const dstFile = path.join(dstDir, `${v}.png`);

    if (old.ch !== nw.ch) {
        moves.push({ src: srcFile, dstDir, dst: dstFile, verse: v, oldCh: old.ch, newCh: nw.ch });
    }
}

// Stage: copy everything to a temp dir first to avoid conflicts
// (chapter-11 currently has 150-156 but needs 215-228)
const stagingDir = path.join(COMIC_ROOT, '_staging');
if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

let staged = 0;
for (const m of moves) {
    if (fs.existsSync(m.src)) {
        const stageDst = path.join(stagingDir, `${m.verse}.png`);
        fs.copyFileSync(m.src, stageDst);
        staged++;
    } else {
        console.log(`  ⚠ Source not found: ${m.src}`);
    }
}
console.log(`Staged ${staged} images to temp directory\n`);

// Remove old images from wrong folders
for (const m of moves) {
    if (fs.existsSync(m.src)) {
        fs.unlinkSync(m.src);
    }
}

// Clean up empty old directories (chapter-12, chapter-13, chapter-14 should now be empty)
for (const ch of [12, 13, 14]) {
    const dir = path.join(COMIC_ROOT, `chapter-${ch}`);
    if (fs.existsSync(dir)) {
        const remaining = fs.readdirSync(dir);
        if (remaining.length === 0) {
            fs.rmdirSync(dir);
            console.log(`  Removed empty directory: chapter-${ch}/`);
        } else {
            console.log(`  chapter-${ch}/ still has ${remaining.length} files: ${remaining.join(', ')}`);
        }
    }
}

// Move from staging to correct locations
let moved = 0;
for (const m of moves) {
    const stageFile = path.join(stagingDir, `${m.verse}.png`);
    if (fs.existsSync(stageFile)) {
        fs.mkdirSync(m.dstDir, { recursive: true });
        fs.copyFileSync(stageFile, m.dst);
        moved++;
    }
}
console.log(`\nMoved ${moved} images to correct chapter folders:`);

// Verify final state
for (const ch of [9, 10, 11]) {
    const dir = path.join(COMIC_ROOT, `chapter-${ch}`);
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort((a, b) => {
            return parseInt(a) - parseInt(b);
        });
        console.log(`  chapter-${ch}/: ${files.length} files (${files[0]} ~ ${files[files.length - 1]})`);
    }
}

// Remove staging dir
fs.rmSync(stagingDir, { recursive: true });

// ─── 3. Fix commentary JSON keys ───

console.log('\n=== Step 2: Fix commentary JSON keys ===\n');

const commentary = JSON.parse(fs.readFileSync(COMMENTARY_PATH, 'utf-8'));

// Build old→new key map and collect old keys to remove
const keyMap = {};
const oldKeysToRemove = new Set();

for (let v = 150; v <= 228; v++) {
    const old = getOldCommentaryKey(v);
    const nw = getNewMapping(v);
    if (!old || !nw) continue;
    
    if (old.key !== nw.key) {
        keyMap[old.key] = nw.key;
        oldKeysToRemove.add(old.key);
    }
}

// Apply remapping
let remapped = 0;
let notFound = 0;
const newEntries = {};

for (const [oldKey, newKey] of Object.entries(keyMap)) {
    if (commentary[oldKey] !== undefined) {
        newEntries[newKey] = commentary[oldKey];
        remapped++;
    } else {
        console.log(`  ⚠ Old key not found in JSON: ${oldKey}`);
        notFound++;
    }
}

// Remove old keys
for (const k of oldKeysToRemove) {
    delete commentary[k];
}

// Add new keys
Object.assign(commentary, newEntries);

// Write back
fs.writeFileSync(COMMENTARY_PATH, JSON.stringify(commentary, null, 2), 'utf-8');

console.log(`Remapped ${remapped} commentary keys (${notFound} not found)`);
console.log('Key remapping examples:');
const examples = Object.entries(keyMap).slice(0, 5);
examples.forEach(([o, n]) => console.log(`  ${o} → ${n}`));
console.log('  ...');

// ─── 4. Verify final state ───

console.log('\n=== Step 3: Verification ===\n');

const finalComm = JSON.parse(fs.readFileSync(COMMENTARY_PATH, 'utf-8'));

for (const ch of [9, 10, 11]) {
    const chKeys = Object.keys(finalComm).filter(k => {
        const parts = k.split('.');
        return parts[0] === String(ch);
    }).sort((a, b) => {
        const va = parseInt(a.split('.')[1]);
        const vb = parseInt(b.split('.')[1]);
        return va - vb;
    });
    console.log(`Commentary ch${ch}: ${chKeys.length} keys (${chKeys[0] || 'none'} ~ ${chKeys[chKeys.length - 1] || 'none'})`);
}

// Verify no leftover wrong keys
for (const ch of [12, 13, 14]) {
    const chKeys = Object.keys(finalComm).filter(k => k.startsWith(`${ch}.`));
    if (chKeys.length > 0) {
        console.log(`⚠ Leftover keys in ch${ch}: ${chKeys.length} keys`);
    }
}

console.log('\n✅ Fix complete!');
