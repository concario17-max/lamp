import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchYogaData, resetCache } from './dataFetcher';

describe('fetchYogaData', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        resetCache();
    });

    it('loads and maps the nested reading data into sequential chapters and local verses', async () => {
        const snapshot = {
            chapters: [
                {
                    id: 'bodhi',
                    chapterName: 'Bodhi',
                    title: 'Bodhi',
                    subchapters: [
                        {
                            id: '1',
                            chapterName: 'Intro',
                            title: 'Intro',
                            paragraphs: [
                                {
                                    id: 'bodhi.1.1',
                                    title: 'Paragraph 1',
                                    paragraphNumber: 1,
                                    chapterTitle: 'Intro',
                                    text: {
                                        tibetan: 'Tibetan text',
                                        pronunciation: '',
                                        english: 'English intro',
                                        korean: 'Korean intro',
                                    },
                                },
                            ],
                        },
                        {
                            id: '2',
                            chapterName: 'Verse section',
                            title: 'Verse section',
                            paragraphs: [
                                {
                                    id: 'bodhi.2.1',
                                    title: 'Verse 1',
                                    paragraphNumber: 2,
                                    chapterTitle: 'Verse section',
                                    text: {
                                        tibetan: 'Second Tibetan text',
                                        pronunciation: '',
                                        english: 'English verse',
                                        korean: 'Korean verse',
                                    },
                                },
                                {
                                    id: 'bodhi.2.2',
                                    title: 'Verse 2',
                                    paragraphNumber: 3,
                                    chapterTitle: 'Verse section',
                                    text: {
                                        tibetan: 'Third Tibetan text',
                                        pronunciation: '',
                                        english: 'English verse 2',
                                        korean: 'Korean verse 2',
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'commentary',
                    chapterName: 'Commentary',
                    title: 'Commentary',
                    subchapters: [
                        {
                            id: '1',
                            chapterName: 'Commentary intro',
                            title: 'Commentary intro',
                            paragraphs: [
                                {
                                    id: 'commentary.1.1',
                                    title: 'Paragraph 1',
                                    paragraphNumber: 1,
                                    chapterTitle: 'Commentary intro',
                                    text: {
                                        tibetan: '',
                                        pronunciation: '',
                                        english: 'Commentary section 1',
                                        korean: 'Commentary section 1 KR',
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
            flatParagraphs: [],
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => `\ufeff${JSON.stringify(snapshot)}`,
        });

        const data = await fetchYogaData();

        expect(global.fetch).toHaveBeenCalledWith('/reading-data.json');
        expect(Object.keys(data).map(Number)).toEqual([1, 2, 3]);
        expect(data[1]).toBeDefined();
        expect(data[1].chapter).toBe(1);
        expect(data[1].meta.name_korean).toBe('Intro');
        expect(data[1].sutras[0].id).toBe('1.1');
        expect(data[1].sutras[0].verse).toBe(1);
        expect(data[1].sutras[0].sanskrit).toBe('Tibetan text');
        expect(data[1].sutras[0].translation_en).toBe('English intro');
        expect(data[1].sutras[0].translation_ham).toBe('Korean intro');
        expect(data[2].sutras[0].id).toBe('2.1');
        expect(data[2].sutras[1].verse).toBe(2);
        expect(data[3].sutras[0].commentary_en).toMatch(/Commentary section 1/);
    });

    it('throws on fetch failure', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
        });

        await expect(fetchYogaData()).rejects.toThrow('Failed to fetch reading data: 404');
    });
});
