import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SutraNavigationProps {
    onPrev: () => void;
    onNext: () => void;
    isPrevDisabled: boolean;
    isNextDisabled: boolean;
    className?: string;
}

export const SutraNavigation = ({
    onPrev,
    onNext,
    isPrevDisabled,
    isNextDisabled,
    className = '',
}: SutraNavigationProps) => (
    <div className={`inline-flex items-center rounded-full border border-gold-border/14 bg-shell-main/80 p-0.5 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)] backdrop-blur-sm dark:border-dark-border/70 dark:bg-shell-main-dark/82 ${className}`.trim()}>
        <button
            type="button"
            onClick={onPrev}
            disabled={isPrevDisabled}
            aria-label="Previous verse"
            className="grid h-8 w-8 place-items-center rounded-full text-[#5B7282] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/70 hover:text-[#31404b] disabled:cursor-not-allowed disabled:opacity-30 active:scale-95 dark:text-dark-text-secondary dark:hover:bg-[#1e1b17] dark:hover:text-dark-text-primary"
        >
            <ChevronLeft className="h-4 w-4 stroke-[1.5]" aria-hidden="true" />
        </button>
        <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            aria-label="Next verse"
            className="grid h-8 w-8 place-items-center rounded-full text-[#5B7282] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/70 hover:text-[#31404b] disabled:cursor-not-allowed disabled:opacity-30 active:scale-95 dark:text-dark-text-secondary dark:hover:bg-[#1e1b17] dark:hover:text-dark-text-primary"
        >
            <ChevronRight className="h-4 w-4 stroke-[1.5]" aria-hidden="true" />
        </button>
    </div>
);
