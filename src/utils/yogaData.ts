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

    const targetVerseNum = parseInt(verseNum, 10);
    const verseIndex = chapter.sutras.findIndex((sutra, index, sutras) => {
        const sutraNum = sutra.verse ?? parseInt(sutra.id.split('.')[1], 10);
        const nextSutra = sutras[index + 1];
        if (nextSutra) {
            const nextNum = nextSutra.verse ?? parseInt(nextSutra.id.split('.')[1], 10);
            return sutraNum <= targetVerseNum && targetVerseNum < nextNum;
        }

        return sutraNum <= targetVerseNum;
    });

    return verseIndex !== -1 ? chapter.sutras[verseIndex] : null;
};

export const getVerseRangeText = (chapter: YogaChapter, sutra: YogaSutra): string => {
    const currentIndex = chapter.sutras.findIndex((entry) => entry.id === sutra.id);
    const nextSutra = chapter.sutras[currentIndex + 1];
    const currentNum = sutra.verse ?? parseInt(sutra.id.split('.')[1], 10);

    if (nextSutra) {
        const nextNum = nextSutra.verse ?? parseInt(nextSutra.id.split('.')[1], 10);
        if (nextNum > currentNum + 1) {
            return `${currentNum}-${nextNum - 1}`;
        }
    }

    return currentNum.toString();
};
