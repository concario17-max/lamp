import type { ReactNode } from 'react';

interface VersePanelCardProps {
    label: string;
    children: ReactNode;
    navigationControls?: ReactNode;
    trailingAction?: ReactNode;
    shellClassName?: string;
    contentClassName?: string;
}

export const VersePanelCard = ({
    label,
    children,
    navigationControls,
    trailingAction,
    shellClassName = 'overflow-hidden rounded-[2rem] bg-[#fffdf8] shadow-[inset_0_1px_0_rgba(255,255,255,0.58),0_14px_40px_-34px_rgba(0,0,0,0.34)] dark:bg-[#14110e] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_40px_-34px_rgba(0,0,0,0.48)]',
    contentClassName = 'bg-[#f3e8d2] px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 dark:bg-[#1d1813]',
}: VersePanelCardProps) => (
    <section className={shellClassName}>
        <div className="flex items-center gap-2.5 border-b border-gold-border/8 bg-[#fffdf8] px-3 pb-3 pt-4 dark:border-dark-border/35 dark:bg-[#14110e] sm:px-4 sm:pb-3 sm:pt-5 lg:px-6">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-gold-primary/70 dark:text-gold-light/70">
                {label}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-gold-border/35 via-gold-border/15 to-transparent dark:from-dark-border/45 dark:via-dark-border/20" />
            <div className="ml-auto flex items-center gap-1">
                {navigationControls ? <div className="min-w-0 shrink-0">{navigationControls}</div> : null}
                {trailingAction ? <div className="shrink-0">{trailingAction}</div> : null}
            </div>
        </div>

        <div className={contentClassName}>{children}</div>
    </section>
);
