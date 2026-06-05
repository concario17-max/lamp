interface SutraContentProps {
    sanskrit: string;
    pronunciation: string;
    pronunciationKr?: string;
}

export const SutraContent = ({ sanskrit, pronunciation, pronunciationKr }: SutraContentProps) => {
    const cleanPronunciation = pronunciation?.replace(/\|+/g, '').replace(/\s+/g, ' ').trim();
    const cleanPronunciationKr = pronunciationKr?.replace(/\s+/g, ' ').trim();

    return (
        <section className="mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div className="border-b border-gold-border/10 pb-5 text-center dark:border-dark-border/45">
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-gold-primary/70 dark:text-gold-light/70">
                    Source text
                </p>
                <p className="mt-4 whitespace-pre-line break-keep font-display text-[clamp(1.55rem,1.3rem+1.1vw,2.65rem)] leading-[1.26] tracking-[0.015em] text-sanskrit-accent dark:text-sanskrit-accent">
                    {sanskrit}
                </p>
            </div>

            <div className="mt-4 space-y-3 text-center">
                {cleanPronunciation ? (
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-text-secondary/60 dark:text-dark-text-secondary/65">
                            Pronunciation
                        </p>
                        <p className="mt-2 whitespace-pre-line break-keep font-sans text-[11px] uppercase tracking-[0.18em] text-text-secondary dark:text-dark-text-secondary sm:text-[12px]">
                            {cleanPronunciation}
                        </p>
                    </div>
                ) : null}

                {cleanPronunciationKr ? (
                    <p className="whitespace-pre-line break-keep font-sans text-[13px] leading-8 tracking-[0.04em] text-text-secondary dark:text-dark-text-secondary sm:text-[14px]">
                        {cleanPronunciationKr}
                    </p>
                ) : null}
            </div>
        </section>
    );
};

