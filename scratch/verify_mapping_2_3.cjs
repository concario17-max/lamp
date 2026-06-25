const fs = require('fs');
const path = require('path');

const ROOT = 'c:/Users/roadsea/Desktop/bori-1';
const COMIC_ROOT = path.join(ROOT, 'src/assets/learning-comic');
const commentary = require(path.join(ROOT, 'public/bodhi-commentary.json'));

const updates = [
    { ch: 14, startLocal: 13, endLocal: 94, startGlobal: 229 },
    { ch: 15, startLocal: 1, endLocal: 2, startGlobal: 311 },
    { ch: 16, startLocal: 1, endLocal: 28, startGlobal: 313 },
    { ch: 17, startLocal: 1, endLocal: 28, startGlobal: 341 },
    { ch: 18, startLocal: 1, endLocal: 2, startGlobal: 369 },
    { ch: 19, startLocal: 1, endLocal: 12, startGlobal: 371 },
];

let allGood = true;

for (const { ch, startLocal, endLocal, startGlobal } of updates) {
    const count = endLocal - startLocal + 1;
    console.log(`\n=== ch${ch} 검증: 로컬 ${startLocal}~${endLocal}절 (글로벌 단락 ${startGlobal}~${startGlobal + count - 1}) ===`);
    
    let commOk = 0, commMissing = 0;
    let comicOk = 0, comicMissing = 0;
    
    for (let i = 0; i < count; i++) {
        const localVerse = startLocal + i;
        const globalVerse = startGlobal + i;
        
        const commKey = `${ch}.${localVerse}`;
        if (commentary[commKey]) {
            commOk++;
        } else {
            commMissing++;
            console.log(`  ❌ Commentary missing: ${commKey}`);
            allGood = false;
        }
        
        const comicFile = path.join(COMIC_ROOT, `chapter-${ch}`, `${globalVerse}.png`);
        if (fs.existsSync(comicFile)) {
            comicOk++;
        } else {
            comicMissing++;
            console.log(`  ❌ Comic missing: chapter-${ch}/${globalVerse}.png`);
            allGood = false;
        }
    }
    
    console.log(`  주석 데이터: ${commOk}/${count} ✅` + (commMissing > 0 ? ` (${commMissing} 누락 ❌)` : ''));
    console.log(`  만화 이미지: ${comicOk}/${count} ✅` + (comicMissing > 0 ? ` (${comicMissing} 누락 ❌)` : ''));
}

console.log(`\n${allGood ? '🎉 난처석 2-3 모든 검증 통과!' : '⚠️ 일부 문제가 발견되었습니다. 위 로그를 확인하세요.'}`);
