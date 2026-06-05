import { describe, expect, it } from 'vitest';
import {
    DESKTOP_VERSE_COLUMNS_DEFAULT,
    DESKTOP_VERSE_COLUMNS_FULL_WIDTH,
    DESKTOP_VERSE_COLUMNS_LEFT_CLOSED,
    DESKTOP_VERSE_COLUMNS_NO_RIGHT,
    getDesktopVerseColumns,
} from './desktopVerseLayout';

describe('getDesktopVerseColumns', () => {
    it('returns 440/966 when both panels are open', () => {
        expect(getDesktopVerseColumns(true, true)).toBe(DESKTOP_VERSE_COLUMNS_DEFAULT);
    });

    it('returns 0/full width when the left panel is closed and commentary is open', () => {
        expect(getDesktopVerseColumns(false, true)).toBe(DESKTOP_VERSE_COLUMNS_LEFT_CLOSED);
    });

    it('returns 440/966 when commentary is closed and the left panel remains open', () => {
        expect(getDesktopVerseColumns(true, false)).toBe(DESKTOP_VERSE_COLUMNS_NO_RIGHT);
    });

    it('returns 0/full width when both side panels are closed', () => {
        expect(getDesktopVerseColumns(false, false)).toBe(DESKTOP_VERSE_COLUMNS_FULL_WIDTH);
    });
});
