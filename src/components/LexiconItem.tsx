import React from 'react';

interface LexiconItemProps {
    word: string;
    meaning: string;
}

// 사전 항목을 렌더링하는 순수 컴포넌트
const LexiconItem = ({ word, meaning }: LexiconItemProps) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-baseline py-4 border-b border-gold-border/20 dark:border-dark-border/50 last:border-0 hover:bg-gold-glow/10 dark:hover:bg-dark-surface/50 transition-all duration-300 rounded-lg px-4 -mx-4 group">
            <div className="w-full sm:w-1/3 mb-1 sm:mb-0">
                <span className="font-bold text-gold-primary dark:text-gold-light tracking-widest text-[14px] uppercase transition-colors group-hover:text-gold-muted">
                    {word}
                </span>
            </div>
            <div className="w-full sm:w-2/3">
                <span className="text-text-secondary dark:text-dark-text-secondary font-noto-kr text-[15px] leading-relaxed break-keep group-hover:text-text-primary dark:group-hover:text-dark-text-primary transition-colors">
                    {meaning}
                </span>
            </div>
        </div>
    );
};

export default React.memo(LexiconItem);
