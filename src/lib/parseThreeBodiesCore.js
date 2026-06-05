/** @typedef {import('../types').ReadingSnapshotChapter} ReadingSnapshotChapter */
/** @typedef {import('../types').ReadingSnapshotParagraph} ReadingSnapshotParagraph */

/**
 * @typedef {{ number: number; tibetan: string; korean: string }} ParsedKoreanEntry
 */

/**
 * @typedef {{ title: string; start: number; end: number }} ParsedTocEntry
 */

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeWhitespace(value) {
  return value.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
}

/**
 * @param {string} title
 * @returns {string}
 */
export function compactChapterLabel(title) {
  const match = title.match(/^제\s*(\d+)\s*장\s*(.+)$/);
  if (!match) {
    return title;
  }

  const rest = match[2].replace(/\s*\(.*$/, '').trim();
  return `${match[1]}장 ${rest}`;
}

/**
 * @param {string} source
 * @returns {ParsedKoreanEntry[]}
 */
export function parseKoreanEntries(source) {
  const pattern = /(\d+)\.\s*\[티벳어 원문\]\s*([\s\S]*?)\s*\[한국어 번역\]\s*([\s\S]*?)(?=\n\d+\.\s*\[티벳어 원문\]|\s*$)/g;
  /** @type {ParsedKoreanEntry[]} */
  const entries = [];
  let match;

  while ((match = pattern.exec(source)) !== null) {
    entries.push({
      number: Number(match[1]),
      tibetan: normalizeWhitespace(match[2]),
      korean: normalizeWhitespace(match[3]),
    });
  }

  return entries;
}

/**
 * @param {string} source
 * @returns {Map<number, string>}
 */
export function parseEnglishEntries(source) {
  const pattern = /(\d+)\s*문단:\s*([\s\S]*?)(?=\n\s*\d+\s*문단:|\s*$)/g;
  const entries = new Map();
  let match;

  while ((match = pattern.exec(source)) !== null) {
    entries.set(Number(match[1]), normalizeWhitespace(match[2]));
  }

  return entries;
}

/**
 * @param {string} source
 * @returns {ParsedTocEntry[]}
 */
export function parseToc(source) {
  const pattern = /^(.+?)\s*\(문단\s*(\d+)(?:\s*~\s*문단\s*(\d+))?\)\s*$/gm;
  /** @type {ParsedTocEntry[]} */
  const chapters = [];
  let match;

  while ((match = pattern.exec(source)) !== null) {
    chapters.push({
      title: normalizeWhitespace(match[1]),
      start: Number(match[2]),
      end: match[3] ? Number(match[3]) : Number(match[2]),
    });
  }

  return chapters;
}

/**
 * @param {ParsedTocEntry[]} chapters
 * @returns {ParsedTocEntry[]}
 */
export function normalizeReadingToc(chapters) {
  if (chapters.length < 2) {
    return chapters;
  }

  const [firstChapter, secondChapter, ...restChapters] = chapters;
  if (!firstChapter.title.includes('귀의')) {
    return chapters;
  }

  return [
    {
      ...secondChapter,
      start: firstChapter.start,
    },
    ...restChapters,
  ];
}

/**
 * @param {ParsedKoreanEntry[]} koreanEntries
 * @param {Map<number, string>} englishEntries
 * @param {ParsedTocEntry[]} toc
 * @returns {ReadingSnapshotChapter[]}
 */
export function createReadingData(koreanEntries, englishEntries, toc) {
  return toc.map((chapter, chapterIndex) => {
    const chapterNumber = chapterIndex + 1;
    const paragraphs = koreanEntries
      .filter((entry) => entry.number >= chapter.start && entry.number <= chapter.end)
      .map(
        /**
         * @param {ParsedKoreanEntry} entry
         * @returns {ReadingSnapshotParagraph}
         */
        (entry) => ({
          id: `${chapterNumber}.${entry.number - chapter.start + 1}`,
          title: `Paragraph ${entry.number}`,
          paragraphNumber: entry.number,
          chapterTitle: chapter.title,
          text: {
            tibetan: entry.tibetan,
            pronunciation: '',
            english: englishEntries.get(entry.number) ?? '',
            korean: entry.korean,
          },
        }),
      );

    return {
      id: String(chapterNumber),
      chapterName: compactChapterLabel(chapter.title),
      title: chapter.title,
      paragraphs,
    };
  });
}

/**
 * @param {ReadingSnapshotChapter[]} chapters
 * @returns {ReadingSnapshotParagraph[]}
 */
export function flattenParagraphs(chapters) {
  return chapters.flatMap((chapter) => chapter.paragraphs);
}
