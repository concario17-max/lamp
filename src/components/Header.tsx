import { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LampDesk } from 'lucide-react';
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
    title = '보리도등론(菩提道燈論)',
    targetUrl = '/',
    showSidebarToggle = false,
    selectionControls,
    rightContent,
    className = '',
}: HeaderProps) => {
    const { isDesktopSidebarOpen } = useUI();
    const desktopGridStyle = showSidebarToggle
        ? ({ '--desktop-verse-columns': getDesktopVerseColumns(isDesktopSidebarOpen, false) } as CSSProperties)
        : undefined;

    return (
        <header className={`sticky top-0 z-50 w-full border-b border-gold-border/10 bg-shell-header shadow-none transition-colors duration-500 backdrop-blur-0 dark:border-dark-border/60 dark:bg-shell-header-dark ${className}`}>
            <div className="mx-auto w-full max-w-[1406px] px-4 py-2 sm:px-5 lg:hidden">
                <div className="flex min-w-0 items-center gap-2 text-text-primary dark:text-dark-text-primary">
                    <Link to={targetUrl} className="group flex min-w-0 items-center gap-2 truncate">
                        <span className="flex shrink-0 items-center justify-center text-gold-primary opacity-90 transition-transform duration-700 group-hover:rotate-6">
                            <LampDesk className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                        <span className="min-w-0 truncate font-display text-[14px] font-medium tracking-[0.02em] text-text-primary transition-colors group-hover:text-gold-primary sm:text-[15px] dark:text-dark-text-primary">
                            {title}
                        </span>
                    </Link>
                </div>

                {selectionControls || showSidebarToggle ? (
                    <div className="mt-2 flex w-full items-center justify-end gap-2 border-t border-gold-border/10 pt-2 dark:border-dark-border/50">
                        {rightContent}
                        {selectionControls ? <div className="min-w-0 shrink-0">{selectionControls}</div> : null}
                    </div>
                ) : null}
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
                            <LampDesk className="h-5 w-5" />
                        </span>
                        <span className="truncate font-display text-[16px] font-medium tracking-[0.02em] text-text-primary transition-colors group-hover:text-gold-primary xl:text-[17px] dark:text-dark-text-primary">
                            {title}
                        </span>
                    </Link>
                </div>

                <div className="flex min-w-0 items-center justify-end gap-2.5 px-5">
                    {rightContent}
                    {selectionControls ? <div className="min-w-0 shrink-0">{selectionControls}</div> : null}
                </div>
            </div>
        </header>
    );
};

export default Header;
