export const DESKTOP_VERSE_COLUMNS_DEFAULT = '440px minmax(0, 966px)';
export const DESKTOP_VERSE_COLUMNS_LEFT_CLOSED = '0px minmax(0, 1fr)';
export const DESKTOP_VERSE_COLUMNS_NO_RIGHT = '440px minmax(0, 966px)';
export const DESKTOP_VERSE_COLUMNS_FULL_WIDTH = '0px minmax(0, 1fr)';

export const getDesktopVerseColumns = (isDesktopSidebarOpen: boolean, isDesktopRightPanelOpen: boolean) => {
    // Keep the left rail fixed to the design reference when it is open.
    const hasSidebarRail = isDesktopSidebarOpen;
    const hasRightRail = isDesktopRightPanelOpen;

    if (!hasRightRail) {
        return hasSidebarRail ? DESKTOP_VERSE_COLUMNS_NO_RIGHT : DESKTOP_VERSE_COLUMNS_FULL_WIDTH;
    }

    return hasSidebarRail ? DESKTOP_VERSE_COLUMNS_DEFAULT : DESKTOP_VERSE_COLUMNS_LEFT_CLOSED;
};
