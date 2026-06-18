/**
 * Post-fix verification: ensure that for every verse in app ch9, ch10, ch11,
 * both the commentary key AND the comic image file exist in the correct location.
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'c:/Users/roadsea/Desktop/bori-1';
const COMIC_ROOT = path.join(ROOT, 'src/assets/learning-comic');
const commentary = require(path.join(ROOT, 'public/bodhi-commentary.json'));

// App chapter mapping (ch9, ch10, ch11 are the ones affected by 난처석 2-2)
const chapters = [
    { ch: 9, title: '보리심의 일으킴', globalStart: 150, count: 30 },
    { ch: 10, title: '원심의 가르침', globalStart: 180, count: 35 },
    { ch: 11, title: '행심의 가르침', globalStart: 215, count: 14 },
];

let allGood = true;

for (const { ch, title, globalStart, count } of chapters) {
    console.log(`\n=== ch${ch}: ${title} (${count} verses, global ${globalStart}~${globalStart + count - 1}) ===`);
    
    let commOk = 0, commMissing = 0;
    let comicOk = 0, comicMissing = 0;
    
    for (let i = 0; i < count; i++) {
        const localVerse = i + 1;
        const globalVerse = globalStart + i;
        
        // Check commentary key
        const commKey = `${ch}.${localVerse}`;
        if (commentary[commKey]) {
            commOk++;
        } else {
            commMissing++;
            console.log(`  ❌ Commentary missing: ${commKey}`);
            allGood = false;
        }
        
        // Check comic image
        const comicFile = path.join(COMIC_ROOT, `chapter-${ch}`, `${globalVerse}.png`);
        if (fs.existsSync(comicFile)) {
            comicOk++;
        } else {
            comicMissing++;
            console.log(`  ❌ Comic missing: chapter-${ch}/${globalVerse}.png`);
            allGood = false;
        }
    }
    
    console.log(`  Commentary: ${commOk}/${count} ✅` + (commMissing > 0 ? ` (${commMissing} missing ❌)` : ''));
    console.log(`  Comics:     ${comicOk}/${count} ✅` + (comicMissing > 0 ? ` (${comicMissing} missing ❌)` : ''));
}

// Also verify existing chapters (ch3-ch8) still work
console.log('\n=== Verifying existing chapters (ch3~ch8) ===');
const existingChapters = [
    { ch: 3, globalStart: 71, count: 15 },
    { ch: 4, globalStart: 86, count: 6 },
    { ch: 5, globalStart: 92, count: 2 },
    { ch: 6, globalStart: 94, count: 2 },
    { ch: 7, globalStart: 96, count: 33 },
    { ch: 8, globalStart: 129, count: 21 },
];

for (const { ch, globalStart, count } of existingChapters) {
    let commOk = 0, comicOk = 0;
    for (let i = 0; i < count; i++) {
        const localVerse = i + 1;
        const globalVerse = globalStart + i;
        if (commentary[`${ch}.${localVerse}`]) commOk++;
        if (fs.existsSync(path.join(COMIC_ROOT, `chapter-${ch}`, `${globalVerse}.png`))) comicOk++;
    }
    const commStatus = commOk === count ? '✅' : `⚠️ ${commOk}/${count}`;
    const comicStatus = comicOk === count ? '✅' : `⚠️ ${comicOk}/${count}`;
    console.log(`  ch${ch}: commentary ${commStatus}, comics ${comicStatus}`);
    if (commOk !== count || comicOk !== count) allGood = false;
}

console.log(`\n${allGood ? '🎉 All verifications passed!' : '⚠️ Some issues found, see above.'}`);
