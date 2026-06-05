import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

export interface SidebarLayoutProps {
    isOpen: boolean;
    isDesktopOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    position?: 'left' | 'right';
    widthClass?: string;
    desktopWidthClass?: string;
    desktopMinWidthClass?: string;
}

export const SidebarLayout = React.memo(
    ({
        isOpen,
        isDesktopOpen,
        onClose,
        title,
        children,
        position = 'left',
        widthClass = 'w-80',
        desktopWidthClass = 'lg:w-[19rem]',
        desktopMinWidthClass = 'lg:min-w-[19rem]',
        }: SidebarLayoutProps) => {
        const isLeft = position === 'left';
        const placementClass = isLeft ? 'lg:left-0' : 'lg:right-0';
        const surfaceClass = isLeft ? 'bg-shell-rail dark:bg-shell-rail-dark' : 'bg-shell-commentary dark:bg-shell-commentary-dark';
        const mobileBorderClass = isLeft ? 'border-zinc-300/45 dark:border-white/8' : 'border-gold-border/10 dark:border-white/6';
        const desktopBorderClass = isLeft ? 'lg:border-r lg:border-zinc-300/40 dark:lg:border-white/8' : 'lg:border-l lg:border-gold-border/10 dark:lg:border-dark-border/45';
        const mobileStateClass = isOpen ? `flex min-h-0 ${widthClass} overflow-hidden border ${mobileBorderClass} ${surfaceClass}` : 'hidden';
        const desktopStateClass = isDesktopOpen
            ? `${desktopWidthClass} ${desktopMinWidthClass} lg:flex lg:min-h-0 lg:translate-x-0 lg:opacity-100 ${desktopBorderClass} ${surfaceClass}`
            : 'overflow-hidden p-0 px-0 lg:flex lg:w-0 lg:min-w-0 lg:translate-x-0 lg:opacity-0 lg:border-0';

        return (
            <>
                <aside
                    className={`relative z-50 h-auto min-h-0 flex-col overscroll-contain bg-transparent font-pretendard transition-all duration-300 lg:sticky lg:top-0 lg:h-full lg:min-h-0 ${placementClass}
                    ${mobileStateClass}
                    ${desktopStateClass}`}
                >
                    {title ? (
                        <div className="flex shrink-0 items-center gap-3 border-b border-gold-border/10 px-3 py-3 dark:border-white/6 lg:hidden">
                            <span className="inline-flex items-center rounded-full bg-gold-soft/90 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.34em] text-gold-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:bg-gold-soft/20 dark:text-gold-light">
                                {title}
                            </span>
                            <span className="h-px flex-1 bg-gold-border/35 dark:bg-dark-border/45" />
                            <button
                                type="button"
                                onClick={onClose}
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold-border/30 bg-shell-main/90 text-text-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors hover:bg-shell-header/90 dark:border-dark-border/55 dark:bg-dark-surface/90 dark:text-dark-text-secondary dark:hover:bg-white/5"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="absolute right-4 top-4 z-50 lg:hidden">
                            <button
                                type="button"
                                onClick={onClose}
                                className="grid h-9 w-9 place-items-center rounded-full border border-gold-border/30 bg-shell-main/90 text-text-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors hover:bg-shell-header/90 dark:border-dark-border/55 dark:bg-dark-surface/90 dark:text-dark-text-secondary dark:hover:bg-white/5"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex min-h-0 flex-1 basis-0 flex-col overflow-hidden pb-safe-offset-4">{children}</div>
                </aside>
            </>
        );
    },
);
