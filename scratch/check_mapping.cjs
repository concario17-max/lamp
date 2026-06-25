const d = require('../public/reading-data.json');
const bc = require('../public/bodhi-commentary.json');
const fs = require('fs');
const path = require('path');

const flat = [];
d.chapters.forEach(g => {
  (g.subchapters || []).forEach(sc => {
    flat.push({ group: g, sub: sc });
  });
});

// Simulate the counterContext logic from dataFetcher.ts
const counterContext = { runningCount: 0 };

console.log('=== Chapter 9, 10, 11 deep analysis ===\n');

for (let chNum = 9; chNum <= 11; chNum++) {
  const entry = flat[chNum - 1]; // 0-indexed
  const paras = entry.sub.paragraphs || [];
  console.log(`--- ch${chNum}: ${entry.sub.title} (${paras.length} paragraphs) ---`);

  // Reset counter for ch3
  if (chNum === 3) counterContext.runningCount = 70;

  paras.forEach((p, i) => {
    // getLocalVerseNumber logic
    const idParts = p.id.split('.');
    const localId = idParts[idParts.length - 1];
    const localNum = parseInt(localId, 10);
    const verseNum = isFinite(localNum) ? localNum : i + 1;

    // globalNum logic
    let globalNum = verseNum;
    if (chNum >= 3) {
      counterContext.runningCount += 1;
      globalNum = counterContext.runningCount;
    }

    // Commentary lookup key
    const lookupKey = chNum <= 2 ? `bodhi.${chNum}.${verseNum}` : `${chNum}.${verseNum}`;
    const hasCommentary = !!bc[lookupKey];

    // Comic lookup: uses chapterNum (string) and verseNum (globalNum)
    // getLearningComicImageUrl(String(chapter), String(globalNum))
    const comicDir = path.join(__dirname, '..', 'src', 'assets', 'learning-comic', `chapter-${chNum}`);
    const comicFile = path.join(comicDir, `${globalNum}.png`);
    const hasComic = fs.existsSync(comicFile);

    if (i < 5 || !hasCommentary || !hasComic) {
      console.log(`  verse[${i}] id:${p.id} local:${verseNum} global:${globalNum} | commentary[${lookupKey}]:${hasCommentary} | comic[chapter-${chNum}/${globalNum}.png]:${hasComic}`);
    }
  });
  console.log();
}

// Also check what the 난처석 2-1 script mapped
console.log('=== 난처석 2-1 script mapped to chapters 5,6,7,8 ===');
console.log('Verse 92-93 -> ch5, 94-95 -> ch6, 96-128 -> ch7, 129-149 -> ch8');
console.log('But these are global verse numbers for ch5(92-93), ch6(94-95), ch7(96-128), ch8(129-149)');
console.log();
console.log('=== 난처석 2-2 script mapped to chapters 11,12,13,14 ===');
console.log('Verse 150-156 -> ch11, 157-173 -> ch12, 174-216 -> ch13, 217-228 -> ch14');
console.log();

// Key question: ch9 global verses are 150-179, ch10 are 180-214
// But 난처석 2-1 only covers verse 92-149 (ch5-8)
// And 난처석 2-2 covers verse 150-228 but maps them to ch11-14 (NOT ch9-10)
// So ch9 (verse 150-179) and ch10 (verse 180-214) have NO comic images at all!

// Let's verify: what chapter does verse 150 belong to in the app?
console.log('=== Mismatch analysis ===');
console.log('App ch9 has global verses 150-179');
console.log('App ch10 has global verses 180-214');
console.log('App ch11 has global verses 215-228');
console.log();
console.log('But 난처석 2-2 script mapped:');
console.log('  verse 150-156 -> comic chapter-11 (NOT chapter-9!)');
console.log('  verse 157-173 -> comic chapter-12 (NOT chapter-9/10!)');
console.log('  verse 174-216 -> comic chapter-13 (NOT chapter-10!)');
console.log('  verse 217-228 -> comic chapter-14 (matches app ch14? NO - app ch14 is 289-382)');
console.log();
console.log('CONCLUSION: The 난처석 2-2 script used WRONG chapter numbers!');
console.log('It used the ODT source "chapter" numbering (11,12,13,14) instead of');
console.log('the app internal chapter numbering (9,10,11,...)');
