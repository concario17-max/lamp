import { YogaChapter } from '../types';

export interface SutraTarget {
    chapter: number;
    verse: string;
}

export const getPreviousSutraTarget = (
    allChapters: Record<number, YogaChapter> | null,
    chapterNum: string | undefined,
    currentIndex: number,
): SutraTarget | null => {
    if (!allChapters || !chapterNum) {
        return null;
    }

    const currentChapterNumber = parseInt(chapterNum, 10);
    const currentChapter = allChapters[currentChapterNumber];
    if (!currentChapter) {
        return null;
    }

    if (currentIndex > 0) {
        const prevSutra = currentChapter.sutras[currentIndex - 1];
        return {
            chapter: currentChapterNumber,
            verse: String(prevSutra.verse ?? prevSutra.id.split('.')[1]),
        };
    }

    if (currentChapterNumber > 1) {
        const previousChapter = allChapters[currentChapterNumber - 1];
        if (previousChapter?.sutras.length) {
            const lastSutra = previousChapter.sutras[previousChapter.sutras.length - 1];
            return {
                chapter: currentChapterNumber - 1,
                verse: String(lastSutra.verse ?? lastSutra.id.split('.')[1]),
            };
        }
    }

    return null;
};

export const getNextSutraTarget = (
    allChapters: Record<number, YogaChapter> | null,
    chapterNum: string | undefined,
    currentIndex: number,
): SutraTarget | null => {
    if (!allChapters || !chapterNum) {
        return null;
    }

    const currentChapterNumber = parseInt(chapterNum, 10);
    const currentChapter = allChapters[currentChapterNumber];
    if (!currentChapter) {
        return null;
    }

    if (currentIndex < currentChapter.sutras.length - 1) {
        const nextSutra = currentChapter.sutras[currentIndex + 1];
        return {
            chapter: currentChapterNumber,
            verse: String(nextSutra.verse ?? nextSutra.id.split('.')[1]),
        };
    }

    if (currentChapterNumber < Object.keys(allChapters).length) {
        const nextChapter = allChapters[currentChapterNumber + 1];
        if (nextChapter?.sutras.length) {
            const firstSutra = nextChapter.sutras[0];
            return {
                chapter: currentChapterNumber + 1,
                verse: String(firstSutra.verse ?? firstSutra.id.split('.')[1]),
            };
        }
    }

    return null;
};
