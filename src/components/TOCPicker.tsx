import { CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { YogaChapter } from '../types';
import { getPreviousSutraTarget, getNextSutraTarget } from '../utils/sutraNavigation';

interface TOCPickerProps {
    chapterNum?: string;
    verseNum?: string;
    chapters: YogaChapter[];
    allChapters: Record<number, YogaChapter> | null;
    onCommitSelection: (chapter: string, verse: string) => void;
}

export const TOCPicker = ({
    chapterNum,
    verseNum,
    chapters,
    allChapters,
    onCommitSelection,
}: TOCPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
    
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

    // active 챕터 및 절 구하기
    const activeChapter = useMemo(() => {
        return chapters.find((c) => String(c.chapter) === chapterNum);
    }, [chapters, chapterNum]);

    // 초기 로드 또는 현재 챕터 변경 시 탭 및 챕터 기본값 설정
    useEffect(() => {
        if (activeChapter) {
            setExpandedChapter(activeChapter.chapter);
        }
    }, [activeChapter]);

    // 패널 닫기 이벤트 핸들러
    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (
                rootRef.current &&
                !rootRef.current.contains(target) &&
                !panelRef.current?.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // 패널 위치 계산
    useLayoutEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const updatePosition = () => {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const panelWidth = Math.min(420, window.innerWidth - 24);
            const left = Math.min(Math.max(rect.left, 12), window.innerWidth - panelWidth - 12);
            const top = rect.bottom + 8;

            setPanelStyle({
                position: 'fixed',
                top: `${Math.round(top)}px`,
                left: `${Math.round(left)}px`,
                width: `${Math.round(panelWidth)}px`,
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    // 트리거 텍스트 계산
    const triggerText = useMemo(() => {
        if (!activeChapter) return '목차 선택';
        const formattedVerseNum = verseNum && !isNaN(Number(verseNum)) ? `${verseNum}절` : (verseNum || '');
        return formattedVerseNum ? `${activeChapter.chapter}. ${activeChapter.meta.name_korean} / ${formattedVerseNum}` : `${activeChapter.chapter}. ${activeChapter.meta.name_korean}`;
    }, [activeChapter, verseNum]);

    // 이전/다음 절 이동 타겟 구하기
    const activeVerseIndex = useMemo(() => {
        if (!activeChapter) return -1;
        return activeChapter.sutras.findIndex(
            (s) => String(s.verse ?? Number.parseInt(s.id.split('.')[1], 10)) === verseNum
        );
    }, [activeChapter, verseNum]);

    const prevTarget = useMemo(() => {
        return getPreviousSutraTarget(allChapters, chapterNum, activeVerseIndex);
    }, [allChapters, chapterNum, activeVerseIndex]);

    const nextTarget = useMemo(() => {
        return getNextSutraTarget(allChapters, chapterNum, activeVerseIndex);
    }, [allChapters, chapterNum, activeVerseIndex]);

    const totalVerses = activeChapter?.sutras.length || 0;

    const panel = isOpen ? (
        <div
            role="dialog"
            aria-label="TOC Picker"
            ref={panelRef}
            style={panelStyle ?? undefined}
            className="z-[60] flex flex-col max-h-[500px] rounded-[1.75rem] border border-gold-border/12 bg-[linear-gradient(180deg,rgba(255,251,241,0.98)_0%,rgba(252,247,237,0.96)_48%,rgba(245,238,228,0.92)_100%)] p-4 shadow-[0_26px_72px_-34px_rgba(0,0,0,0.58)] backdrop-blur-2xl dark:border-dark-border/70 dark:bg-[linear-gradient(180deg,rgba(24,20,15,0.98)_0%,rgba(20,17,13,0.96)_48%,rgba(15,13,10,0.92)_100%)] select-none overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gold-border/8 pb-3 mb-3 dark:border-dark-border/30 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-gold-primary/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-gold-primary dark:bg-gold-light/10 dark:text-gold-light">
                        Sutra Picker
                    </span>
                    <span className="text-[10px] font-semibold tracking-[0.06em] text-text-secondary/75 dark:text-dark-text-secondary/70">
                        Chapter {chapterNum} / Sutra {verseNum}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1.5 hover:bg-gold-primary/8 dark:hover:bg-gold-light/8 text-text-secondary/60 dark:text-dark-text-secondary/50 transition-colors cursor-pointer"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Accordion List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar pb-2">
                {chapters.map((ch) => {
                    const isExpanded = expandedChapter === ch.chapter;
                    return (
                        <div
                            key={ch.chapter}
                            className="overflow-hidden rounded-2xl border border-gold-border/12 bg-white/45 shadow-sm transition-all duration-300 dark:border-dark-border/45 dark:bg-white/2"
                        >
                            <button
                                type="button"
                                onClick={() => setExpandedChapter(isExpanded ? null : ch.chapter)}
                                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-gold-primary/5 dark:hover:bg-gold-light/5 cursor-pointer"
                            >
                                <span className="text-[12px] font-bold text-text-primary dark:text-dark-text-primary">
                                    {ch.chapter}. {ch.meta.name_korean}
                                </span>
                                <ChevronDown
                                    className={`h-4 w-4 text-gold-primary/70 dark:text-gold-light/70 transition-transform duration-300 ${
                                        isExpanded ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            {isExpanded && (
                                <div className="border-t border-gold-border/8 bg-[#FAF8F5]/50 p-3 dark:border-dark-border/20 dark:bg-[#1E1A16]/30">
                                    <div className="grid grid-cols-6 gap-2">
                                        {ch.sutras.map((sutra) => {
                                            const vNum = String(sutra.verse ?? Number.parseInt(sutra.id.split('.')[1], 10));
                                            const isCurrent = String(ch.chapter) === chapterNum && String(vNum) === verseNum;
                                            return (
                                                <button
                                                    key={sutra.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onCommitSelection(String(ch.chapter), vNum);
                                                        setIsOpen(false);
                                                    }}
                                                    className={`h-10 rounded-xl flex items-center justify-center text-[11px] font-semibold border transition-all duration-200 cursor-pointer ${
                                                        isCurrent
                                                            ? 'bg-gold-primary/10 border-gold-primary text-gold-primary dark:bg-gold-light/10 dark:border-gold-light dark:text-gold-light font-bold shadow-[0_2px_8px_-2px_rgba(166,139,92,0.25)]'
                                                            : 'bg-white/50 border-gold-border/8 text-text-primary hover:border-gold-border/25 hover:bg-white dark:bg-white/4 dark:border-dark-border/40 dark:text-dark-text-primary dark:hover:bg-white/8'
                                                    }`}
                                                >
                                                    {vNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Stepper Footer */}
            <div className="mt-3 border-t border-gold-border/12 pt-3 dark:border-dark-border/55 flex items-center justify-between shrink-0">
                <button
                    type="button"
                    disabled={!prevTarget}
                    onClick={() => {
                        if (prevTarget) {
                            onCommitSelection(String(prevTarget.chapter), prevTarget.verse);
                        }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold-border/15 dark:border-dark-border/50 text-[10px] font-semibold text-text-primary dark:text-dark-text-primary hover:bg-gold-primary/5 dark:hover:bg-gold-light/5 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    이전 절
                </button>

                <div className="flex items-center gap-1 text-[11px] font-bold text-gold-primary dark:text-gold-light">
                    <span>{verseNum}</span>
                    <span className="text-text-secondary/50 dark:text-dark-text-secondary/50 font-normal">/</span>
                    <span className="text-text-secondary/80 dark:text-dark-text-secondary/80 font-normal">{totalVerses}</span>
                </div>

                <button
                    type="button"
                    disabled={!nextTarget}
                    onClick={() => {
                        if (nextTarget) {
                            onCommitSelection(String(nextTarget.chapter), nextTarget.verse);
                        }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold-border/15 dark:border-dark-border/50 text-[10px] font-semibold text-text-primary dark:text-dark-text-primary hover:bg-gold-primary/5 dark:hover:bg-gold-light/5 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                    다음 절
                    <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    ) : null;

    return (
        <div ref={rootRef} className="relative shrink-0">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                className="inline-flex items-center rounded-full border border-gold-border/14 bg-shell-main/82 p-0.5 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.32)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-border/24 hover:bg-shell-main/92 active:translate-y-0 dark:border-dark-border/70 dark:bg-shell-main-dark/82 dark:hover:bg-shell-main-dark/88 cursor-pointer"
            >
                <span className="inline-flex items-center gap-2.5 rounded-full bg-transparent px-4 py-1.5 text-[11px] font-semibold tracking-[0.02em] text-gold-primary dark:text-gold-light">
                    <span className="max-w-[170px] sm:max-w-[280px] md:max-w-[340px] truncate whitespace-nowrap">{triggerText}</span>
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {isOpen ? createPortal(panel, document.body) : null}
        </div>
    );
};
