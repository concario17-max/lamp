import type { ReactNode } from 'react';

interface TranslationSectionProps {
    english?: string;
    ham?: string;
    gil?: string;
    jimong?: string;
    suk?: string;
}

const Block = ({ label, children }: { label: string; children: ReactNode }) => (
    <section className="border-t border-gold-border/10 pt-4 dark:border-dark-border/45">
        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-gold-primary/70 dark:text-gold-light/70">{label}</p>
        <div className="mt-3 space-y-3">{children}</div>
    </section>
);

export const TranslationSection = ({ english, ham, gil, jimong, suk }: TranslationSectionProps) => {
    const hasTranslations = Boolean(english || ham || gil || jimong || suk);

    if (!hasTranslations) {
        return null;
    }

    return (
        <section className="mx-auto w-full space-y-4 px-4 sm:px-6 lg:px-8">
            {english ? (
                <Block label="English text">
                    <p className="whitespace-pre-line break-keep font-sans text-[15px] leading-8 text-text-primary dark:text-dark-text-primary sm:text-[16px]">
                        {english}
                    </p>
                </Block>
            ) : null}

            {ham || gil || jimong || suk ? (
                <Block label="Korean text">
                    {ham ? (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-text-secondary/65 dark:text-dark-text-secondary/65">
                                Ham
                            </p>
                            <p className="whitespace-pre-line break-keep font-sans text-[15px] leading-8 text-text-primary dark:text-dark-text-primary sm:text-[16px]">
                                {ham}
                            </p>
                        </div>
                    ) : null}
                    {gil ? (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-text-secondary/65 dark:text-dark-text-secondary/65">
                                Gil
                            </p>
                            <p className="whitespace-pre-line break-keep font-sans text-[15px] leading-8 text-text-primary dark:text-dark-text-primary sm:text-[16px]">
                                {gil}
                            </p>
                        </div>
                    ) : null}
                    {jimong ? (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-text-secondary/65 dark:text-dark-text-secondary/65">
                                Jimong
                            </p>
                            <p className="whitespace-pre-line break-keep font-sans text-[15px] leading-8 text-text-primary dark:text-dark-text-primary sm:text-[16px]">
                                {jimong}
                            </p>
                        </div>
                    ) : null}
                    {suk ? (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-text-secondary/65 dark:text-dark-text-secondary/65">
                                Suk
                            </p>
                            <p className="whitespace-pre-line break-keep font-sans text-[15px] leading-8 text-text-primary dark:text-dark-text-primary sm:text-[16px]">
                                {suk}
                            </p>
                        </div>
                    ) : null}
                </Block>
            ) : null}
        </section>
    );
};
