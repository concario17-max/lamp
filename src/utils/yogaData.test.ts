import { describe, expect, it } from 'vitest';
import { YogaChapter, YogaSutra } from '../types';
import { getChapterArray, getVerseInRangeFromChapters, getVerseRangeText } from './yogaData';

const createSutra = (id: string): YogaSutra => ({
    id,
    sanskrit: `Sanskrit ${id}`,
    pronunciation: `Pronunciation ${id}`,
    pronunciation_kr: '',
});

const chapters: Record<number, YogaChapter> = {
    1: {
        chapter: 1,
        meta: {
            chapter: 1,
            name_korean: '합일의 문제',
            name_english: 'Samadhi Pada',
            description: 'Chapter 1',
            sutraCount: 2,
        },
        sutras: [createSutra('1.1'), createSutra('1.3')],
    },
    2: {
        chapter: 2,
        meta: {
            chapter: 2,
            name_korean: '합일의 단계',
            name_english: 'Sadhana Pada',
            description: 'Chapter 2',
            sutraCount: 1,
        },
        sutras: [createSutra('2.1')],
    },
};

describe('yogaData utilities', () => {
    it('returns sorted chapter array', () => {
        expect(getChapterArray(chapters).map((chapter) => chapter.chapter)).toEqual([1, 2]);
    });

    it('maps ranged verse requests to the owning sutra', () => {
        const verse = getVerseInRangeFromChapters(chapters, '1', '2');
        expect(verse?.id).toBe('1.1');
    });

    it('returns the displayed verse range label', () => {
        expect(getVerseRangeText(chapters[1], chapters[1].sutras[0])).toBe('1-2');
        expect(getVerseRangeText(chapters[1], chapters[1].sutras[1])).toBe('3');
    });
});
