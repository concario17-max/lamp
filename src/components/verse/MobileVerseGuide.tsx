import React from 'react';

interface MobileVerseGuideProps {
    chapterNum: string;
    verseNum: string;
    koreanText?: string;
}

export const MobileVerseGuide = React.memo(({ chapterNum, verseNum, koreanText }: MobileVerseGuideProps) => {
    // 좁은 가로 화면에서만 상단에 노출되는 미니 가이드 배너 (lg 이상에서는 숨김 처리)
    return (
        <section className="block w-full overflow-hidden rounded-[1.5rem] border border-gold-border/12 bg-[#fffdf8] p-4 shadow-[0_12px_24px_-16px_rgba(0,0,0,0.12)] dark:border-dark-border/45 dark:bg-[#14110e] lg:hidden">
            <div className="flex items-center gap-2.5 border-b border-gold-border/8 pb-2 dark:border-dark-border/30">
                <span className="inline-flex items-center rounded-full bg-gold-soft/90 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-gold-primary dark:bg-gold-soft/20 dark:text-gold-light">
                    Verse Guide
                </span>
                <span className="text-[10px] font-semibold tracking-[0.16em] text-text-secondary/75 dark:text-dark-text-secondary/70">
                    {chapterNum}장 / {isNaN(Number(verseNum)) ? verseNum : `${verseNum}절`}
                </span>
            </div>
            
            {koreanText && (
                <div className="mt-2.5 border-l-2 border-gold-primary/20 pl-3 dark:border-l-2 dark:border-gold-light/20">
                    <p className="font-sans text-[13px] leading-relaxed text-text-primary/90 dark:text-dark-text-primary/90 break-keep">
                        {koreanText}
                    </p>
                </div>
            )}
        </section>
    );
});
