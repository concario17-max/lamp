import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface GlassCardProps {
    href?: string;
    onClick?: () => void;
    icon?: ReactNode;
    subtitle?: string;
    title: ReactNode;
    description?: string;
    className?: string;
}

/**
 * 범용 Glassmorphism 카드 (Zero Monolith)
 * - 프리미엄 다크/골드 테마 글래스 카드 
 * - 호버 그래디언트 및 그림자 트랜지션 내장
 */
export const GlassCard = React.memo(({
    href,
    onClick,
    icon,
    subtitle,
    title,
    description,
    className = ""
}: GlassCardProps) => {

    const content = (
        <>
            {/* Inner Hover Gradient Spotlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent dark:from-white/[0.03] dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0 pointer-events-none"></div>

            {icon && (
                <div className="w-6 h-6 flex items-center justify-center text-gold-primary/60 mb-4 group-hover:scale-110 transition-transform relative z-10">
                    {icon}
                </div>
            )}

            <div className="relative z-10 w-full mb-auto flex flex-col items-center">
                {subtitle && (
                    <span className="block mb-2 text-[10px] font-black tracking-[0.3em] uppercase text-gold-primary/90 dark:text-gold-light/90 drop-shadow-sm">
                        {subtitle}
                    </span>
                )}

                <h2 className="font-bold tracking-wide mb-4 text-text-primary dark:text-dark-text-primary font-noto-kr flex flex-col gap-2 mt-1 px-2">
                    {title}
                </h2>

                <div className="w-12 h-[1px] bg-gold-border/80 mx-auto my-4 group-hover:w-20 transition-all duration-500"></div>

                {description && (
                    <p className="text-[13px] text-text-secondary dark:text-dark-text-secondary font-sans font-medium max-w-[260px] mx-auto opacity-80 leading-[1.7] px-1">
                        {description}
                    </p>
                )}
            </div>
        </>
    );

    const baseStyle = `group relative flex flex-col items-center justify-start overflow-hidden rounded-3xl border border-gold-border/20 bg-white/60 p-5 pt-10 text-center shadow-xl shadow-gold-primary/5 backdrop-blur-xl transition-all duration-700 ease-[0.2,0,0,1] hover:border-gold-primary/40 hover:shadow-[0_20px_50px_rgba(184,134,11,0.15)] active:scale-[0.98] dark:bg-dark-surface/60 dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-h-[380px] sm:min-h-[440px] sm:p-6 sm:pt-14 lg:min-h-[300px] lg:p-4 lg:pt-7 ${className}`;

    if (href) {
        return (
            <Link to={href} className={baseStyle} onClick={onClick}>
                {content}
            </Link>
        );
    }

    return (
        <button className={baseStyle} onClick={onClick}>
            {content}
        </button>
    );
});
