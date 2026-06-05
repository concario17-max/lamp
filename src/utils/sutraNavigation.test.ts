import { describe, expect, it } from 'vitest';
import { YogaChapter, YogaSutra } from '../types';
import { getNextSutraTarget, getPreviousSutraTarget } from './sutraNavigation';

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
        sutras: [createSutra('1.1'), createSutra('1.2')],
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

describe('sutraNavigation utilities', () => {
    it('moves to the previous sutra within a chapter', () => {
        expect(getPreviousSutraTarget(chapters, '1', 1)).toEqual({ chapter: 1, verse: '1' });
    });

    it('moves to the previous chapter when current index is first', () => {
        expect(getPreviousSutraTarget(chapters, '2', 0)).toEqual({ chapter: 1, verse: '2' });
    });

    it('moves to the next chapter at the end of a chapter', () => {
        expect(getNextSutraTarget(chapters, '1', 1)).toEqual({ chapter: 2, verse: '1' });
    });

    it('returns null when there is no next target', () => {
        expect(getNextSutraTarget(chapters, '2', 0)).toBeNull();
    });
});
