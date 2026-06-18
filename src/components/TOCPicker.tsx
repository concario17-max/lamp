import { CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { YogaChapter } from '../types';
import { getPreviousSutraTarget, getNextSutraTarget } from '../utils/sutraNavigation';

const normalizeOutlineSegment = (value: string) => value.trim().replace(/\s+/g, ' ');

const getChapterOutlinePath = (chapter: YogaChapter) => {
    const englishTitle = chapter.meta.name_english?.trim() ?? '';
    const koreanTitle = chapter.meta.name_korean?.trim() ?? '';
    const rawPath = englishTitle
        .split(' / ')
        .map(normalizeOutlineSegment)
        .filter(Boolean);

    const isSingleStructuralHeading = rawPath.length === 1 && englishTitle && koreanTitle && englishTitle !== koreanTitle;
    const branchPath = rawPath.length > 1 ? rawPath.slice(0, -1) : isSingleStructuralHeading ? [englishTitle] : [];
    const leafLabel = rawPath.length > 1 ? rawPath[rawPath.length - 1] : isSingleStructuralHeading ? koreanTitle || englishTitle : koreanTitle || englishTitle;
    const displayPath = rawPath.length > 0 ? rawPath : [leafLabel];

    return {
        branchPath,
        displayPath,
        leafLabel,
    };
};

interface TOCPickerProps {
    chapterNum?: string;
    verseNum?: string;
    chapters: YogaChapter[];
    allChapters: Record<number, YogaChapter> | null;
    onCommitSelection: (chapter: string, verse: string) => void;
}

interface PickerButton {
    id: string;
    title: string;
    chapterNum: string;
    verseNum: string;
    branchPathLength: number;
}

interface TOCItem {
    type: 'category' | 'heading' | 'subchapter';
    title: string;
    level: number;
    sutraCount?: number;
    chapterNum?: string;
    buttons?: PickerButton[];
}

export const TOCPicker = ({
    chapterNum,
    verseNum,
    chapters,
    allChapters,
    onCommitSelection,
}: TOCPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState<TOCItem | null>(null);
    
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const activeItemRef = useRef<HTMLButtonElement>(null);
    const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

    // active 챕터 및 절 구하기
    const activeChapter = useMemo(() => {
        return chapters.find((c) => String(c.chapter) === chapterNum);
    }, [chapters, chapterNum]);

    const activeVerse = useMemo(() => {
        if (!activeChapter) return null;
        return activeChapter.sutras.find(
            (s) => String(s.verse ?? Number.parseInt(s.id.split('.')[1], 10)) === verseNum
        );
    }, [activeChapter, verseNum]);

    // 전체 목차 아이템 플랫 생성
    const tocItems = useMemo(() => {
        const items: TOCItem[] = [];
        const seenCategory = new Set<string>();
        const seenHeading = new Set<string>();
        const seenSubchapter = new Set<string>();

        chapters.forEach((ch) => {
            const { branchPath, leafLabel } = getChapterOutlinePath(ch);
            
            // 1. 대분류 결정
            let categoryTitle = ch.meta.description || '보리도등론';
            if (branchPath.length >= 1) {
                categoryTitle = branchPath[0];
            }

            if (!seenCategory.has(categoryTitle)) {
                seenCategory.add(categoryTitle);
                items.push({
                    type: 'category',
                    title: categoryTitle,
                    level: 0,
                });
            }

            // 2. 중간 헤딩(편, 장 등) 추가
            if (branchPath.length > 1) {
                for (let i = 1; i < branchPath.length; i++) {
                    const headingTitle = branchPath[i];
                    const headingKey = `${categoryTitle}-${headingTitle}`;
                    if (!seenHeading.has(headingKey)) {
                        seenHeading.add(headingKey);
                        items.push({
                            type: 'heading',
                            title: headingTitle,
                            level: i,
                        });
                    }
                }
            } else if (branchPath.length === 1 && categoryTitle !== branchPath[0]) {
                const headingTitle = branchPath[0];
                const headingKey = `${categoryTitle}-${headingTitle}`;
                if (!seenHeading.has(headingKey)) {
                    seenHeading.add(headingKey);
                    items.push({
                        type: 'heading',
                        title: headingTitle,
                        level: 1,
                    });
                }
            }

            // 3. 최종 subchapter (리프 노드) 추가
            const subchapterKey = `${ch.chapter}-${leafLabel}`;
            if (!seenSubchapter.has(subchapterKey)) {
                seenSubchapter.add(subchapterKey);

                const buttons: PickerButton[] = [];
                ch.sutras.forEach((sutra) => {
                    const vNum = String(sutra.verse ?? Number.parseInt(sutra.id.split('.')[1], 10));
                    buttons.push({
                        id: sutra.id,
                        title: sutra.title || `${vNum}절`,
                        chapterNum: String(ch.chapter),
                        verseNum: vNum,
                        branchPathLength: 0,
                    });
                });

                let itemLevel = 1;
                if (branchPath.length > 0) {
                    itemLevel = branchPath.length;
                }

                items.push({
                    type: 'subchapter',
                    title: leafLabel,
                    level: itemLevel,
                    sutraCount: ch.sutras.length,
                    chapterNum: String(ch.chapter),
                    buttons,
                });
            }
        });

        return items;
    }, [chapters]);

    // 현재 선택된 챕터 매칭 설정
    useEffect(() => {
        if (activeChapter && tocItems.length > 0) {
            const currentItem = tocItems.find(
                (item) => item.type === 'subchapter' && item.chapterNum === chapterNum
            );
            if (currentItem) {
                setSelectedChapter(currentItem);
            }
        }
    }, [activeChapter, chapterNum, tocItems]);

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

    // 활성화된 챕터로 스크롤 이동
    useEffect(() => {
        if (isOpen && !selectedChapter && activeItemRef.current) {
            activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [isOpen, selectedChapter]);

    // 트리거 텍스트 계산
    const triggerText = useMemo(() => {
        if (!activeChapter) return '목차 선택';
        
        const { leafLabel } = getChapterOutlinePath(activeChapter);
        let verseTitle = activeVerse?.title || (verseNum ? `${verseNum}절` : '');
        
        if (!activeVerse?.title || activeVerse.title.startsWith('문단 ')) {
            verseTitle = leafLabel;
        }

        const formattedVerseNum = verseNum && !isNaN(Number(verseNum)) ? `${verseNum}절` : (verseNum || '');
        return formattedVerseNum ? `${verseTitle} · ${formattedVerseNum}` : verseTitle;
    }, [activeChapter, activeVerse, verseNum]);

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

    const getIndentClass = (level: number) => {
        switch (level) {
            case 0: return 'pl-0';
            case 1: return 'pl-2.5';
            case 2: return 'pl-5';
            case 3: return 'pl-8';
            default: return 'pl-8';
        }
    };

    const panel = isOpen ? (
        <div
            role="dialog"
            aria-label="TOC Picker"
            ref={panelRef}
            style={panelStyle ?? undefined}
            className="z-[60] flex flex-col min-h-[380px] max-h-[520px] rounded-[1.5rem] border border-gold-border/12 bg-[linear-gradient(180deg,rgba(255,251,241,0.98)_0%,rgba(252,247,237,0.96)_48%,rgba(245,238,228,0.92)_100%)] p-4 shadow-[0_26px_72px_-34px_rgba(0,0,0,0.58)] backdrop-blur-2xl dark:border-dark-border/70 dark:bg-[linear-gradient(180deg,rgba(24,20,15,0.98)_0%,rgba(20,17,13,0.96)_48%,rgba(15,13,10,0.92)_100%)] select-none overflow-hidden"
        >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between border-b border-gold-border/12 pb-2.5 dark:border-dark-border/55 shrink-0">
                <div className="flex items-center gap-2">
                    <Menu className="h-4 w-4 text-gold-primary dark:text-gold-light" />
                    <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-text-primary dark:text-dark-text-primary">
                        목차 (TOC)
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1 hover:bg-gold-primary/8 dark:hover:bg-gold-light/8 text-text-secondary dark:text-dark-text-secondary transition-colors cursor-pointer"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Content Body with slide animation */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                <AnimatePresence mode="wait" initial={false}>
                    {selectedChapter ? (
                        <motion.div
                            key="verses"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="flex-1 flex flex-col overflow-hidden"
                        >
                            {/* 뒤로가기 헤더 */}
                            <div className="flex items-center gap-2 mb-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setSelectedChapter(null)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gold-primary/8 hover:bg-gold-primary/14 dark:bg-gold-light/8 dark:hover:bg-gold-light/14 text-[10px] font-bold text-gold-primary dark:text-gold-light transition-all cursor-pointer"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    목차로
                                </button>
                                <span className="text-[11px] font-bold text-text-primary dark:text-dark-text-primary truncate flex-1 pl-1">
                                    {selectedChapter.title}
                                </span>
                            </div>

                            {/* 절 목록 영역 (바둑판 그리드 형태) */}
                            <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar pb-2">
                                <div className="grid grid-cols-5 gap-2">
                                    {selectedChapter.buttons?.map((btn) => {
                                        const isCurrent = String(btn.chapterNum) === chapterNum && String(btn.verseNum) === verseNum;
                                        return (
                                            <button
                                                key={btn.id}
                                                type="button"
                                                onClick={() => {
                                                    onCommitSelection(btn.chapterNum, btn.verseNum);
                                                    setIsOpen(false);
                                                }}
                                                className={`h-10 rounded-xl flex items-center justify-center text-[11px] font-semibold border transition-all duration-200 cursor-pointer ${
                                                    isCurrent
                                                        ? 'bg-gold-primary border-gold-primary text-white shadow-[0_4px_12px_-4px_rgba(166,139,92,0.6)] dark:bg-gold-light dark:border-gold-light dark:text-[#2a2116] font-bold'
                                                        : 'bg-white/40 border-gold-border/8 text-text-primary hover:border-gold-border/25 hover:bg-white dark:bg-white/4 dark:border-dark-border/40 dark:text-dark-text-primary dark:hover:bg-white/8'
                                                }`}
                                            >
                                                {btn.verseNum}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chapters"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="flex-1 flex flex-col overflow-hidden"
                        >
                            {/* 단일 스크롤 목차 트리 영역 */}
                            <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar pb-2 space-y-1">
                                {tocItems.map((item, index) => {
                                    if (item.type === 'category') {
                                        return (
                                            <div
                                                key={`cat-${item.title}-${index}`}
                                                className="mt-3.5 mb-1.5 bg-[#FAF7F0] dark:bg-[#201C18] px-3.5 py-2.5 rounded-2xl block shrink-0"
                                            >
                                                <span className="text-[#A68B5C] font-extrabold text-[12px] tracking-wide">
                                                    {item.title}
                                                </span>
                                            </div>
                                        );
                                    }

                                    if (item.type === 'heading') {
                                        const indent = getIndentClass(item.level);
                                        return (
                                            <div
                                                key={`head-${item.title}-${index}`}
                                                className={`py-1 text-[#A68B5C] font-bold text-[11px] tracking-wide ${indent}`}
                                            >
                                                {item.title}
                                            </div>
                                        );
                                    }

                                    // subchapter 리프 노드
                                    const indent = getIndentClass(item.level);
                                    const isCurrent = item.chapterNum === chapterNum;

                                    return (
                                        <button
                                            key={`sub-${item.title}-${index}`}
                                            ref={isCurrent ? activeItemRef : undefined}
                                            type="button"
                                            onClick={() => setSelectedChapter(item)}
                                            className={`flex w-full items-center justify-between px-3 py-2 rounded-xl text-left border transition-all duration-200 cursor-pointer ${indent} ${
                                                isCurrent
                                                    ? 'bg-[#A68B5C]/8 border-[#A68B5C]/15 text-[#A68B5C] font-semibold dark:bg-[#A68B5C]/12'
                                                    : 'bg-transparent border-transparent text-[#334E68] hover:bg-[#FAF7F0]/80 hover:text-[#A68B5C] dark:text-[#BAC7D5] dark:hover:bg-[#2B231B]'
                                            }`}
                                        >
                                            <span className="text-[11px] truncate flex-1 pr-4">
                                                {item.title}
                                            </span>
                                            {item.sutraCount !== undefined && (
                                                <span className="text-[#A68B5C] font-bold text-[10px] pr-2.5 shrink-0">
                                                    {item.sutraCount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
