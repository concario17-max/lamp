import { CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Menu, X, ChevronLeft } from 'lucide-react';
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

interface GroupedChapter {
    title: string;
    chapterNums: number[];
    buttons: PickerButton[];
}

interface GroupedCategory {
    description: string;
    chapters: GroupedChapter[];
}

export const TOCPicker = ({
    chapterNum,
    verseNum,
    chapters,
    allChapters,
    onCommitSelection,
}: TOCPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
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

    // 카테고리 그룹화
    const groupedCategories = useMemo(() => {
        const categories: GroupedCategory[] = [];

        chapters.forEach((ch) => {
            const { branchPath, leafLabel } = getChapterOutlinePath(ch);

            // 1. 대분류 결정
            let categoryTitle = ch.meta.description || '보리도등론';
            if (branchPath.length >= 1) {
                categoryTitle = branchPath[0];
            }

            // 2. 중분류 결정
            let chapterTitle = leafLabel;
            if (branchPath.length >= 2) {
                chapterTitle = branchPath[1];
            } else if (branchPath.length === 1) {
                chapterTitle = branchPath[0];
            }

            let category = categories.find((c) => c.description === categoryTitle);
            if (!category) {
                category = { description: categoryTitle, chapters: [] };
                categories.push(category);
            }

            let chapter = category.chapters.find((c) => c.title === chapterTitle);
            if (!chapter) {
                chapter = {
                    title: chapterTitle,
                    chapterNums: [],
                    buttons: [],
                };
                category.chapters.push(chapter);
            }

            if (!chapter.chapterNums.includes(ch.chapter)) {
                chapter.chapterNums.push(ch.chapter);
            }

            // 3. 소분류 (버튼) 추가
            if (branchPath.length > 0) {
                const firstSutra = ch.sutras[0];
                const firstVerseNum = firstSutra
                    ? String(firstSutra.verse ?? Number.parseInt(firstSutra.id.split('.')[1], 10))
                    : '1';
                
                if (!chapter.buttons.some((b) => b.id === `subchapter-${ch.chapter}`)) {
                    chapter.buttons.push({
                        id: `subchapter-${ch.chapter}`,
                        title: leafLabel,
                        chapterNum: String(ch.chapter),
                        verseNum: firstVerseNum,
                        branchPathLength: branchPath.length,
                    });
                }
            } else {
                ch.sutras.forEach((sutra) => {
                    const vNum = String(sutra.verse ?? Number.parseInt(sutra.id.split('.')[1], 10));
                    if (!chapter.buttons.some((b) => b.id === sutra.id)) {
                        chapter.buttons.push({
                            id: sutra.id,
                            title: sutra.title || `${vNum}절`,
                            chapterNum: String(ch.chapter),
                            verseNum: vNum,
                            branchPathLength: 0,
                        });
                    }
                });
            }
        });

        return categories;
    }, [chapters]);

    // 초기 로드 시 현재 속해있는 카테고리는 펼치기
    useEffect(() => {
        if (activeChapter) {
            const { branchPath } = getChapterOutlinePath(activeChapter);
            let categoryTitle = activeChapter.meta.description || '보리도등론';
            if (branchPath.length >= 1) {
                categoryTitle = branchPath[0];
            }
            setCollapsedCategories(prev => {
                const next = { ...prev };
                // 명시적으로 펼쳐짐 상태로 두기 위해 collapsed = false로 만듦
                next[categoryTitle] = false;
                return next;
            });
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

            const panelWidth = Math.min(400, window.innerWidth - 24);
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

    // 카테고리 접기/펼치기 토글
    const toggleCategory = (categoryTitle: string) => {
        setCollapsedCategories((prev) => ({
            ...prev,
            [categoryTitle]: !prev[categoryTitle],
        }));
    };

    const panel = isOpen ? (
        <div
            role="dialog"
            aria-label="TOC Picker"
            ref={panelRef}
            style={panelStyle ?? undefined}
            className="z-[60] flex flex-col max-h-[500px] rounded-[1.5rem] border border-gold-border/12 bg-[linear-gradient(180deg,rgba(255,251,241,0.98)_0%,rgba(252,247,237,0.96)_48%,rgba(245,238,228,0.92)_100%)] p-4 shadow-[0_26px_72px_-34px_rgba(0,0,0,0.58)] backdrop-blur-2xl dark:border-dark-border/70 dark:bg-[linear-gradient(180deg,rgba(24,20,15,0.98)_0%,rgba(20,17,13,0.96)_48%,rgba(15,13,10,0.92)_100%)] select-none"
        >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between border-b border-gold-border/12 pb-2.5 dark:border-dark-border/55">
                <div className="flex items-center gap-2">
                    <Menu className="h-4 w-4 text-gold-primary dark:text-gold-light" />
                    <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-text-primary dark:text-dark-text-primary">
                        목차 (TOC)
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1 hover:bg-gold-primary/8 dark:hover:bg-gold-light/8 text-text-secondary dark:text-dark-text-secondary transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* TOC List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar max-h-[350px]">
                {groupedCategories.map((group) => {
                    const isCollapsed = collapsedCategories[group.description] ?? false;

                    return (
                        <div key={group.description} className="space-y-1">
                            {/* Category Header */}
                            <button
                                type="button"
                                onClick={() => toggleCategory(group.description)}
                                className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gold-primary/5 dark:hover:bg-gold-light/5 text-left transition-colors"
                            >
                                <span className="text-[11px] font-bold tracking-[0.05em] text-gold-primary/90 dark:text-gold-light/90 uppercase pl-1">
                                    {group.description}
                                </span>
                                <ChevronDown
                                    className={`h-3.5 w-3.5 text-gold-primary/60 dark:text-gold-light/60 transition-transform duration-250 ${
                                        isCollapsed ? '-rotate-90' : ''
                                    }`}
                                />
                            </button>

                            {/* Category Chapters/Buttons (Collapsible) */}
                            {!isCollapsed && (
                                <div className="space-y-1 pl-1.5 border-l border-gold-border/10 dark:border-dark-border/20 ml-2">
                                    {group.chapters.map((ch) => {
                                        const showChapterTitle = ch.title !== group.description;

                                        return (
                                            <div key={ch.title} className="space-y-0.5">
                                                {/* Chapter Title (if it's distinct from Category) */}
                                                {showChapterTitle && (
                                                    <div className="px-2.5 py-1 text-[10px] font-semibold text-text-secondary/70 dark:text-dark-text-secondary/70">
                                                        {ch.title}
                                                    </div>
                                                )}

                                                {/* Items */}
                                                <div className={`space-y-0.5 ${showChapterTitle ? 'pl-2' : ''}`}>
                                                    {ch.buttons.map((btn) => {
                                                        const isCurrent = btn.branchPathLength > 0
                                                            ? String(btn.chapterNum) === chapterNum
                                                            : String(btn.chapterNum) === chapterNum && String(btn.verseNum) === verseNum;

                                                        return (
                                                            <button
                                                                key={btn.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    onCommitSelection(btn.chapterNum, btn.verseNum);
                                                                    setIsOpen(false);
                                                                }}
                                                                className={`flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all duration-200 ${
                                                                    isCurrent
                                                                        ? 'bg-gold-primary/10 text-gold-primary dark:bg-gold-light/10 dark:text-gold-light font-semibold'
                                                                        : 'text-text-primary hover:bg-gold-primary/5 dark:text-dark-text-primary dark:hover:bg-gold-light/5'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2 truncate">
                                                                    {/* Current Position Dot indicator */}
                                                                    {isCurrent && (
                                                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-primary dark:bg-gold-light animate-pulse" />
                                                                    )}
                                                                    
                                                                    {btn.branchPathLength === 0 && (
                                                                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                                                            isCurrent
                                                                                ? 'bg-gold-primary/20 text-gold-primary dark:bg-gold-light/20 dark:text-gold-light'
                                                                                : 'bg-gold-primary/8 text-gold-primary dark:bg-gold-light/8 dark:text-gold-light'
                                                                        }`}>
                                                                            {isNaN(Number(btn.verseNum)) ? btn.verseNum : `${btn.verseNum}절`}
                                                                        </span>
                                                                    )}
                                                                    <span className="truncate text-[11px]">
                                                                        {btn.title}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Stepper Footer */}
            <div className="mt-3 border-t border-gold-border/12 pt-3 dark:border-dark-border/55 flex items-center justify-between">
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
