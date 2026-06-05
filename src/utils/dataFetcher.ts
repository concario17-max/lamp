import { YogaChapter, YogaSutra } from '../types';

let cachedData: Record<number, YogaChapter> | null = null;
let pendingRequest: Promise<Record<number, YogaChapter>> | null = null;

const stripBom = (value: string) => (value.charCodeAt(0) === 0xfeff ? value.slice(1) : value);

type ReadingDataText = {
    tibetan?: string;
    pronunciation?: string;
    english?: string;
    korean?: string;
};

type ReadingDataParagraph = {
    id: string;
    title?: string;
    paragraphNumber?: number;
    chapterTitle?: string;
    text?: ReadingDataText;
};

type ReadingDataSubchapter = {
    id: string;
    chapterName?: string;
    title?: string;
    tocHeadings?: string[];
    tocActionLabel?: string;
    paragraphs?: ReadingDataParagraph[];
};

type ReadingDataGroup = {
    id: string;
    chapterName?: string;
    title?: string;
    isGroup?: boolean;
    subchapters?: ReadingDataSubchapter[];
    paragraphs?: ReadingDataParagraph[];
};

type ReadingDataSnapshot = {
    chapters?: ReadingDataGroup[];
    flatParagraphs?: ReadingDataParagraph[];
};

const getLocalVerseNumber = (paragraph: ReadingDataParagraph, paragraphIndex: number) => {
    const idParts = paragraph.id.split('.');
    const localId = idParts[idParts.length - 1];
    const localNumber = Number.parseInt(localId ?? '', 10);
    if (Number.isFinite(localNumber)) {
        return localNumber;
    }

    if (typeof paragraph.paragraphNumber === 'number' && Number.isFinite(paragraph.paragraphNumber)) {
        return paragraph.paragraphNumber;
    }

    return paragraphIndex + 1;
};

const getParagraphText = (paragraph: ReadingDataParagraph) => {
    const english = paragraph.text?.english?.trim();
    const korean = paragraph.text?.korean?.trim();
    return english || korean || '';
};

const serializeCommentarySection = (groupTitle: string, subchapter?: ReadingDataSubchapter) => {
    if (!subchapter?.paragraphs?.length) {
        return undefined;
    }

    const sections: string[] = [];
    const heading = subchapter.chapterName?.trim() || subchapter.title?.trim() || groupTitle.trim();
    if (heading) {
        sections.push(`# ${heading}`);
    }

    subchapter.paragraphs.forEach((paragraph) => {
        const text = getParagraphText(paragraph);
        if (text) {
            sections.push(text);
        }
    });

    return sections.filter(Boolean).join('\n\n');
};

const buildCommentaryLookup = (snapshot: ReadingDataSnapshot) => {
    const commentaryGroup = snapshot.chapters?.find((chapter) => chapter.id === 'commentary');
    const commentarySubchapters = commentaryGroup?.subchapters ?? [];

    return commentarySubchapters.reduce<Record<number, string>>((acc, subchapter, index) => {
        const chapterNumber = index + 1;
        const content = serializeCommentarySection(commentaryGroup?.title ?? commentaryGroup?.chapterName ?? 'Commentary', subchapter);
        if (content) {
            acc[chapterNumber] = content;
        }
        return acc;
    }, {});
};

const normalizeParagraph = (
    chapterNum: number,
    paragraph: ReadingDataParagraph,
    paragraphIndex: number,
    commentaryText?: string,
): YogaSutra => {
    const sourceText = paragraph.text ?? { tibetan: '', pronunciation: '', english: '', korean: '' };
    const verseNumber = getLocalVerseNumber(paragraph, paragraphIndex);

    return {
        id: `${chapterNum}.${verseNumber}`,
        chapter: chapterNum,
        verse: verseNumber,
        sanskrit: sourceText.tibetan ?? '',
        iast: sourceText.pronunciation ?? '',
        pronunciation: sourceText.pronunciation ?? '',
        pronunciation_kr: '',
        translation_en: sourceText.english || undefined,
        translation_ham: sourceText.korean || undefined,
        commentary_en: commentaryText || undefined,
        '2.english': sourceText.english || undefined,
        '3.korean-1': sourceText.korean || undefined,
    };
};

const normalizeSubchapter = (
    chapterNum: number,
    groupTitle: string,
    groupName: string,
    subchapter: ReadingDataSubchapter,
    commentaryText?: string,
): YogaChapter => {
    const sutras = (subchapter.paragraphs ?? []).map((paragraph, index) => normalizeParagraph(chapterNum, paragraph, index, commentaryText));

    return {
        chapter: chapterNum,
        meta: {
            chapter: chapterNum,
            name_korean: subchapter.chapterName || groupName || `Chapter ${chapterNum}`,
            name_english: subchapter.title || subchapter.chapterName || groupTitle || `Chapter ${chapterNum}`,
            description: groupTitle || subchapter.chapterName || '',
            sutraCount: sutras.length,
        },
        sutras,
    };
};

const flattenSubchapters = (snapshot: ReadingDataSnapshot) =>
    (snapshot.chapters ?? []).flatMap((group) =>
        (group.subchapters ?? []).map((subchapter) => ({
            group,
            subchapter,
        })),
    );

export const resetCache = () => {
    cachedData = null;
    pendingRequest = null;
};

export const fetchYogaData = async (): Promise<Record<number, YogaChapter>> => {
    if (cachedData) {
        return cachedData;
    }

    if (pendingRequest) {
        return pendingRequest;
    }

    pendingRequest = (async () => {
        try {
            const response = await fetch('/reading-data.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch reading data: ${response.status}`);
            }

            const snapshot = JSON.parse(stripBom(await response.text())) as ReadingDataSnapshot;
            const commentaryLookup = buildCommentaryLookup(snapshot);
            const structuredData = flattenSubchapters(snapshot).reduce<Record<number, YogaChapter>>((acc, entry, index) => {
                const chapterNumber = index + 1;
                const commentaryIndex = chapterNumber <= 2 ? chapterNumber : chapterNumber - 2;
                const commentaryText = commentaryLookup[commentaryIndex];
                acc[chapterNumber] = normalizeSubchapter(
                    chapterNumber,
                    entry.group.title || entry.group.chapterName || '',
                    entry.group.chapterName || entry.group.title || '',
                    entry.subchapter,
                    commentaryText,
                );
                return acc;
            }, {});

            cachedData = structuredData;
            return structuredData;
        } catch (error) {
            console.error('Error fetching reading data:', error);
            throw error instanceof Error ? error : new Error('Unknown reading data fetch failure');
        } finally {
            pendingRequest = null;
        }
    })();

    return pendingRequest;
};
