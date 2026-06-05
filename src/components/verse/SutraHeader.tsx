import { BookOpenText } from 'lucide-react';

export const SutraHeader = () => (
    <header className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 border-b border-gold-border/10 pb-3 dark:border-dark-border/45">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center text-gold-primary dark:text-gold-light">
                <BookOpenText className="h-4 w-4" />
            </div>

            <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.36em] text-gold-primary/70 dark:text-gold-light/70">
                    Reading
                </p>
                <p className="mt-1 font-display text-[15px] font-semibold tracking-[0.08em] text-text-primary dark:text-dark-text-primary sm:text-[16px]">
                    Verse view
                </p>
            </div>
        </div>
    </header>
);
