export interface WordMeaningEntry {
    word: string;
    meaning: string;
}

export type WordMeaning = WordMeaningEntry[];

export interface VerseWord {
    s: string;
    m: string;
}

export interface Grammar {
    [key: string]: string;
}

export interface Token {
    id: string;
    surface: string;
    lemma: string;
    pos: string;
    grammar: Grammar;
    meaning_ko: string;
    meaning_ko_short: string;
    etymology_ko?: string;
}

export interface CompoundToken {
    id: string;
    surface: string;
    lemma: string;
    pos: string;
    grammar: Grammar;
    meaning_ko: string;
}

export interface YogaSutra {
    id: string; // e.g., "1.1"
    chapter?: number;
    verse?: number;
    audio?: string;
    iast?: string;
    "6.bae_uu"?: string;
    "8. ox"?: string;
    pronunciation: string;
    pronunciation_kr: string;
    "2.english"?: string;
    "5.bae_jik"?: string;
    "9. ox-en"?: string;
    sanskrit: string;
    "3.korean-1"?: string;
    translation_en?: string;
    commentary_en?: string;
    korean_pronunciation?: string;
    translation_ham?: string;
    translation_gil?: string;
    translation_jimong?: string;
    translation_suk?: string;
    words?: VerseWord[];
    word_meanings?: WordMeaning;
    tokens?: Token[];
    compound_tokens_original?: CompoundToken[];
}

export interface ChapterMeta {
    chapter: number;
    name_korean: string;
    name_english: string;
    description: string;
    sutraCount: number;
}

export interface YogaChapter {
    chapter: number;
    meta: ChapterMeta;
    sutras: YogaSutra[];
}

export interface ReadingSnapshotText {
    tibetan: string;
    pronunciation: string;
    english: string;
    korean: string;
}

export interface ReadingSnapshotParagraph {
    id: string;
    title: string;
    paragraphNumber: number;
    chapterTitle: string;
    text: ReadingSnapshotText;
}

export interface ReadingSnapshotChapter {
    id: string;
    chapterName: string;
    title: string;
    paragraphs: ReadingSnapshotParagraph[];
}

export type ReadingSnapshot = ReadingSnapshotChapter[];
