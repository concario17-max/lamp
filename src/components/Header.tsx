import { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenText, Flower2, ScrollText } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { getDesktopVerseColumns } from './ui/desktopVerseLayout';

interface HeaderProps {
    title?: ReactNode;
    targetUrl?: string;
    showSidebarToggle?: boolean;
    selectionControls?: ReactNode;
    rightContent?: ReactNode;
    className?: string;
}

const Header = ({
    title = 'Bhagavad Gita',
    targetUrl = '/',
    showSidebarToggle = false,
    selectionControls,
    rightContent,
    className = '',
}: HeaderProps) => {
    const { activeVerseContentMode, isDesktopSidebarOpen, setActiveVerseContentMode } = useUI();
    const desktopGridStyle = showSidebarToggle
        ? ({ '--desktop-verse-columns': getDesktopVerseColumns(isDesktopSidebarOpen, false) } as CSSProperties)
        : undefined;

    const renderVerseModeToggle = () =>
        showSidebarToggle ? (
            <div className="inline-flex items-center rounded-[1rem] border border-gold-border/14 bg-shell-main/80 p-0.5 backdrop-blur-sm dark:border-dark-border/70 dark:bg-shell-main-dark/82">
                {[
                    { mode: 'commentary' as const, label: '해설', icon: ScrollText },
                    { mode: 'body' as const, label: '심화', icon: BookOpenText },
                ].map((option) => {
                    const isActive = activeVerseContentMode === option.mode;
                    const Icon = option.icon;

                    return (
                        <button
                            key={option.mode}
                            type="button"
                            onClick={() => setActiveVerseContentMode(option.mode)}
                            aria-pressed={isActive}
                            className={`inline-flex min-w-[3.25rem] items-center justify-center gap-1.5 rounded-[0.85rem] px-2.5 py-1 text-[9px] font-semibold tracking-[0.14em] transition-all duration-300 sm:min-w-[3.45rem] sm:text-[10px] ${
                                isActive
                                    ? 'bg-gold-primary text-white shadow-[0_6px_16px_-8px_rgba(166,139,92,0.95)] dark:bg-gold-light dark:text-[#2a2116]'
                                    : 'text-gold-primary hover:bg-gold-surface/70 dark:text-gold-light dark:hover:bg-white/6'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            {option.label}
                        </button>
                    );
                })}
            </div>
        ) : null;

    return (
        <header className={`sticky top-0 z-50 w-full border-b border-gold-border/10 bg-shell-header shadow-none transition-colors duration-500 backdrop-blur-0 dark:border-dark-border/60 dark:bg-shell-header-dark ${className}`}>
            <div className="mx-auto w-full max-w-[1406px] px-4 py-2 sm:px-5 lg:hidden">
                <div className="flex min-w-0 items-center gap-2 text-text-primary dark:text-dark-text-primary">
                    <Link to={targetUrl} className="group flex min-w-0 items-center gap-2 truncate">
                        <span className="flex shrink-0 items-center justify-center text-gold-primary opacity-90 transition-transform duration-700 group-hover:rotate-6">
                            <Flower2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                        <span className="min-w-0 truncate font-display text-[14px] font-medium tracking-[0.02em] text-text-primary transition-colors group-hover:text-gold-primary sm:text-[15px] dark:text-dark-text-primary">
                            {title}
                        </span>
                    </Link>
                </div>

                <div className="mt-2 flex w-full flex-col gap-2 border-t border-gold-border/10 pt-2 dark:border-dark-border/50">
                    <div className="flex flex-wrap items-center gap-2">
                        {rightContent}
                        {selectionControls ? <div className="min-w-0 shrink-0">{selectionControls}</div> : null}
                        <div className="ml-auto flex items-center gap-2">{renderVerseModeToggle()}</div>
                    </div>
                </div>
            </div>

            <div
                className={`mx-auto hidden h-12 w-full max-w-[1406px] items-center lg:grid ${
                    showSidebarToggle ? 'lg:[grid-template-columns:var(--desktop-verse-columns)]' : 'lg:grid-cols-1'
                }`}
                style={desktopGridStyle}
            >
                <div className="flex min-w-0 items-center gap-3 px-5">
                    <Link to={targetUrl} className="group flex min-w-0 items-center gap-2 truncate text-text-primary dark:text-dark-text-primary">
                        <span className="flex shrink-0 items-center justify-center text-gold-primary opacity-90 transition-transform duration-700 group-hover:rotate-6">
                            <Flower2 className="h-5 w-5" />
                        </span>
                        <span className="truncate font-display text-[16px] font-medium tracking-[0.02em] text-text-primary transition-colors group-hover:text-gold-primary xl:text-[17px] dark:text-dark-text-primary">
                            {title}
                        </span>
                    </Link>
                </div>

                <div className="flex min-w-0 items-center justify-end gap-3 px-5">
                    <div className="flex items-center gap-1 rounded-[1rem] border border-gold-border/10 bg-shell-main/78 p-0.5 backdrop-blur-sm dark:border-dark-border/60 dark:bg-shell-main-dark/80">
                        {rightContent}
                        {selectionControls ? <div className="min-w-0 shrink-0">{selectionControls}</div> : null}
                        {renderVerseModeToggle()}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
