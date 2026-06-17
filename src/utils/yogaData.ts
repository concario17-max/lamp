import { YogaChapter, YogaSutra } from '../types';

export const getChapterArray = (allChapters: Record<number, YogaChapter> | null): YogaChapter[] => {
    if (!allChapters) {
        return [];
    }

    return Object.values(allChapters).sort((left, right) => left.chapter - right.chapter);
};

export const getVerseInRangeFromChapters = (
    allChapters: Record<number, YogaChapter> | null,
    chapterNum: string,
    verseNum: string,
): YogaSutra | null => {
    if (!allChapters) {
        return null;
    }

    const chapter = allChapters[parseInt(chapterNum, 10)];
    if (!chapter) {
        return null;
    }

    // 만약 verseNum이 숫자가 아니라면 ('도입부', '결어' 등), 정확히 일치하는 sutra를 찾아서 리턴함
    if (isNaN(Number(verseNum))) {
        const found = chapter.sutras.find((s) => String(s.verse) === verseNum);
        if (found) {
            return found;
        }
    }

    const targetVerseNum = parseInt(verseNum, 10);
    const firstSutra = chapter.sutras[0];
    const firstSutraNum = firstSutra && typeof firstSutra.verse === 'number' ? firstSutra.verse : 1;
    if (!isNaN(targetVerseNum) && targetVerseNum < firstSutraNum) {
        const sutra = chapter.sutras[targetVerseNum - 1];
        if (sutra) {
            return sutra;
        }
    }

    const verseIndex = chapter.sutras.findIndex((sutra, index, sutras) => {
        const sutraNum = typeof sutra.verse === 'number' ? sutra.verse : parseInt(sutra.id.split('.')[1], 10);
        const nextSutra = sutras[index + 1];
        if (nextSutra) {
            const nextNum = typeof nextSutra.verse === 'number' ? nextSutra.verse : parseInt(nextSutra.id.split('.')[1], 10);
            return sutraNum <= targetVerseNum && targetVerseNum < nextNum;
        }

        return sutraNum <= targetVerseNum;
    });

    return verseIndex !== -1 ? chapter.sutras[verseIndex] : null;
};

export const getVerseRangeText = (chapter: YogaChapter, sutra: YogaSutra): string => {
    const currentIndex = chapter.sutras.findIndex((entry) => entry.id === sutra.id);
    const nextSutra = chapter.sutras[currentIndex + 1];
    
    const verseVal = sutra.verse ?? parseInt(sutra.id.split('.')[1], 10);
    if (typeof verseVal === 'string') {
        return verseVal;
    }

    const currentNum = verseVal;

    if (nextSutra) {
        const nextVerseVal = nextSutra.verse ?? parseInt(nextSutra.id.split('.')[1], 10);
        if (typeof nextVerseVal === 'number') {
            if (nextVerseVal > currentNum + 1) {
                return `${currentNum}-${nextVerseVal - 1}`;
            }
        }
    }

    return currentNum.toString();
};
