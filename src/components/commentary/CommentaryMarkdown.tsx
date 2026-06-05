import { createElement, type CSSProperties, type ReactNode } from 'react';

type CommentaryBlock =
    | { type: 'heading'; level: number; text: string }
    | { type: 'paragraph'; text: string }
    | { type: 'list'; ordered: boolean; items: string[] }
    | { type: 'table'; headers: string[]; rows: string[][] };

interface CommentaryMarkdownProps {
    content?: string | null;
    emptyMessage?: ReactNode;
}

const splitTableRow = (line: string) =>
    line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());

const parseTable = (lines: string[]): CommentaryBlock | null => {
    if (lines.length < 2 || !lines.every((line) => line.trim().startsWith('|'))) {
        return null;
    }

    const header = splitTableRow(lines[0]);
    const separatorLine = lines[1].trim();
    if (!/^\|?[:\-\s|]+\|?$/.test(separatorLine)) {
        return null;
    }

    const rows = lines.slice(2).filter((line) => line.trim().startsWith('|')).map(splitTableRow);
    return {
        type: 'table',
        headers: header,
        rows,
    };
};

const parseCommentaryBlocks = (content: string): CommentaryBlock[] => {
    const normalized = content.replace(/\r\n/g, '\n').trim();
    if (!normalized) {
        return [];
    }

    return normalized
        .split(/\n{2,}/)
        .map((rawBlock) => rawBlock.trim())
        .filter(Boolean)
        .map((block) => {
            const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
            const table = parseTable(lines);
            if (table) {
                return table;
            }

            const headingMatch = block.match(/^(#{1,6})\s+(.*)$/s);
            if (headingMatch) {
                return {
                    type: 'heading',
                    level: headingMatch[1].length,
                    text: headingMatch[2].trim(),
                } satisfies CommentaryBlock;
            }

            const listItems = lines.map((line) => line.replace(/^[-*·•]\s+/, '').trim());
            const ordered = lines.every((line) => /^\d+\.\s+/.test(line));
            const unordered = lines.every((line) => /^[-*·•]\s+/.test(line));
            if (lines.length > 1 && (ordered || unordered)) {
                return {
                    type: 'list',
                    ordered,
                    items: listItems,
                } satisfies CommentaryBlock;
            }

            return {
                type: 'paragraph',
                text: block,
            } satisfies CommentaryBlock;
        });
};

const renderTable = (headers: string[], rows: string[][]) => {
    const rowCellCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const columnCount = Math.max(headers.length, rowCellCount, 1);
    const gridStyle: CSSProperties = {
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
    };

    return (
        <div className="overflow-hidden border-y border-gold-border/12 dark:border-dark-border/45">
            <div className="grid border-b border-gold-border/12 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-primary dark:text-gold-light" style={gridStyle}>
                {Array.from({ length: columnCount }).map((_, index) => (
                    <div key={`header-${index}`} className={`px-4 py-2.5 ${index > 0 ? 'border-l border-gold-border/12 dark:border-dark-border/45' : ''}`}>
                        {headers[index] ?? ''}
                    </div>
                ))}
            </div>

            {rows.map((row, rowIndex) => {
                const paddedRow = Array.from({ length: columnCount }, (_, index) => row[index] ?? '');

                return (
                    <div key={`row-${rowIndex}`} className="grid border-b border-gold-border/10 last:border-b-0" style={gridStyle}>
                        {paddedRow.map((cell, cellIndex) => (
                            <div
                                key={`cell-${rowIndex}-${cellIndex}`}
                                className={`px-4 py-3.5 text-[15px] leading-relaxed ${
                                    cellIndex > 0 ? 'border-l border-gold-border/10 dark:border-dark-border/40' : ''
                                } ${cellIndex === 0 ? 'font-medium text-text-primary dark:text-dark-text-primary' : 'text-text-secondary dark:text-dark-text-secondary'}`}
                            >
                                {cell}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

const headingClassNameByLevel: Record<number, string> = {
    1: 'text-[22px] sm:text-[24px]',
    2: 'text-[19px] sm:text-[21px]',
    3: 'text-[17px] sm:text-[18px]',
    4: 'text-[16px] sm:text-[17px]',
};

export const CommentaryMarkdown = ({ content, emptyMessage }: CommentaryMarkdownProps) => {
    if (!content || !content.trim()) {
        return <>{emptyMessage ?? null}</>;
    }

    const blocks = parseCommentaryBlocks(content);

    return (
        <div className="space-y-4">
            {blocks.map((block, index) => {
                if (block.type === 'heading') {
                    const headingTag = `h${Math.min(block.level, 6)}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
                    return createElement(
                        headingTag,
                        {
                            key: `heading-${index}`,
                            className: `font-sans font-semibold leading-snug tracking-[0.01em] text-text-primary dark:text-dark-text-primary ${
                                headingClassNameByLevel[block.level] ?? 'text-[16px] sm:text-[17px]'
                            }`,
                        },
                        block.text,
                    );
                }

                if (block.type === 'list') {
                    return block.ordered ? (
                        <ol key={`list-${index}`} className="space-y-2 pl-5 font-sans text-[15px] leading-8 text-text-secondary dark:text-dark-text-secondary sm:text-[16px]">
                            {block.items.map((item, itemIndex) => (
                                <li key={`ordered-${index}-${itemIndex}`} className="list-decimal">
                                    {item}
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <ul key={`list-${index}`} className="space-y-2 pl-5 font-sans text-[15px] leading-8 text-text-secondary dark:text-dark-text-secondary sm:text-[16px]">
                            {block.items.map((item, itemIndex) => (
                                <li key={`unordered-${index}-${itemIndex}`} className="list-disc">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    );
                }

                if (block.type === 'table') {
                    return <div key={`table-${index}`}>{renderTable(block.headers, block.rows)}</div>;
                }

                return (
                    <p key={`paragraph-${index}`} className="whitespace-pre-line font-sans text-[15px] leading-8 text-text-secondary dark:text-dark-text-secondary sm:text-[16px]">
                        {block.text}
                    </p>
                );
            })}
        </div>
    );
};
