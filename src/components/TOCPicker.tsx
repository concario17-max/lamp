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

const getTabForCategory = (description: string) => {
    if (description.includes('난처석') || description.includes('주석')) {
        return 'commentary';
    }
    return 'original';
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
    const [activeTab, setActiveTab] = useState<'original' | 'commentary'>('original');
    const [selectedChapter, setSelectedChapter] = useState<GroupedChapter | null>(null);
    
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

            let categoryTitle = ch.meta.description || '보리도등론';
            if (branchPath.length >= 1) {
                categoryTitle = branchPath[0];
            }

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

    // 초기 로드 또는 현재 챕터 변경 시 탭 및 챕터 기본값 설정
    useEffect(() => {
        if (activeChapter && groupedCategories.length > 0) {
            const { branchPath } = getChapterOutlinePath(activeChapter);
            let categoryTitle = activeChapter.meta.description || '보리도등론';
            if (branchPath.length >= 1) {
                categoryTitle = branchPath[0];
            }
            const tab = getTabForCategory(categoryTitle);
            setActiveTab(tab);
            
            // 현재 활성화된 챕터(GroupedChapter)를 찾아서 selectedChapter로 기본 지정
            const category = groupedCategories.find(c => getTabForCategory(c.description) === tab);
            if (category) {
                const groupedCh = category.chapters.find(ch => ch.chapterNums.includes(Number(chapterNum)));
                if (groupedCh) {
                    setSelectedChapter(groupedCh);
                }
            }
        }
    }, [activeChapter, chapterNum, groupedCategories]);

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

    // 현재 탭에 필터링된 카테고리들
    const filteredCategories = useMemo(() => {
        return groupedCategories.filter((group) => getTabForCategory(group.description) === activeTab);
    }, [groupedCategories, activeTab]);

    // 선택된 챕터가 subchapter 형태인지 (절 그리드 대신 리스트로 그릴지) 판단
    const isSubchapterList = useMemo(() => {
        if (!selectedChapter) return false;
        return selectedChapter.buttons.some((b) => b.branchPathLength > 0);
    }, [selectedChapter]);

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

                            {/* 절 목록 영역 */}
                            <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar pb-2">
                                {isSubchapterList ? (
                                    // Subchapter 리스트인 경우 (세로 리스트 형태)
                                    <div className="space-y-1.5">
                                        {selectedChapter.buttons.map((btn) => {
                                            const isCurrent = String(btn.chapterNum) === chapterNum;
                                            return (
                                                <button
                                                    key={btn.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onCommitSelection(btn.chapterNum, btn.verseNum);
                                                        setIsOpen(false);
                                                    }}
                                                    className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                                                        isCurrent
                                                            ? 'bg-gold-primary/12 text-gold-primary dark:bg-gold-light/12 dark:text-gold-light font-bold border border-gold-primary/20 dark:border-gold-light/20'
                                                            : 'bg-white/40 text-text-primary border border-gold-border/8 hover:border-gold-border/20 hover:bg-white dark:bg-white/4 dark:text-dark-text-primary dark:border-dark-border/40 dark:hover:bg-white/8'
                                                    }`}
                                                >
                                                    <span className="text-[11px] truncate flex-1">{btn.title}</span>
                                                    {isCurrent && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-gold-primary dark:bg-gold-light animate-pulse" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    // 일반 개별 절 번호인 경우 (바둑판 그리드 형태)
                                    <div className="grid grid-cols-5 gap-2">
                                        {selectedChapter.buttons.map((btn) => {
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
                                )}
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
                            {/* 원문 / 주석(난처석) 토글 탭 */}
                            <div className="flex p-0.5 rounded-xl bg-gold-primary/8 dark:bg-dark-border/30 mb-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('original')}
                                    className={`flex-1 py-1.5 text-[10px] font-bold tracking-[0.05em] rounded-lg transition-all cursor-pointer ${
                                        activeTab === 'original'
                                            ? 'bg-white text-gold-primary shadow-sm dark:bg-white/10 dark:text-gold-light'
                                            : 'text-text-secondary/70 dark:text-dark-text-secondary/60 hover:text-text-primary dark:hover:text-dark-text-primary'
                                    }`}
                                >
                                    원문 (보리도등론)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('commentary')}
                                    className={`flex-1 py-1.5 text-[10px] font-bold tracking-[0.05em] rounded-lg transition-all cursor-pointer ${
                                        activeTab === 'commentary'
                                            ? 'bg-white text-gold-primary shadow-sm dark:bg-white/10 dark:text-gold-light'
                                            : 'text-text-secondary/70 dark:text-dark-text-secondary/60 hover:text-text-primary dark:hover:text-dark-text-primary'
                                    }`}
                                >
                                    주석 (난처석)
                                </button>
                            </div>

                            {/* 챕터 목록 영역 */}
                            <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-3 pb-2">
                                {filteredCategories.map((group) => (
                                    <div key={group.description} className="space-y-1">
                                        <div className="px-2 py-0.5 text-[9px] font-bold text-gold-primary/70 dark:text-gold-light/70 uppercase tracking-wider border-l border-gold-primary/30">
                                            {group.description}
                                        </div>
                                        <div className="space-y-1">
                                            {group.chapters.map((ch) => {
                                                const isCurrentChapter = ch.chapterNums.includes(Number(chapterNum));

                                                return (
                                                    <button
                                                        key={ch.title}
                                                        type="button"
                                                        onClick={() => setSelectedChapter(ch)}
                                                        className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                                                            isCurrentChapter
                                                                ? 'bg-white/70 border-gold-border/20 text-gold-primary dark:bg-white/8 dark:border-dark-border/80 dark:text-gold-light font-bold shadow-sm'
                                                                : 'bg-white/20 border-gold-border/4 text-text-primary hover:border-gold-border/15 hover:bg-white/50 dark:bg-white/2 dark:border-dark-border/30 dark:text-dark-text-primary dark:hover:bg-white/6'
                                                        }`}
                                                    >
                                                        <span className="text-[11px] truncate flex-1 pr-2">
                                                            {ch.title}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span className="text-[9px] font-medium text-text-secondary/50 dark:text-dark-text-secondary/50">
                                                                {ch.buttons.length}개
                                                            </span>
                                                            <span className={`h-1.5 w-1.5 rounded-full ${
                                                                isCurrentChapter
                                                                    ? 'bg-gold-primary dark:bg-gold-light animate-pulse scale-110 shadow-[0_0_6px_rgba(166,139,92,0.5)]'
                                                                    : 'bg-gold-border/20 dark:bg-dark-border/30'
                                                            }`} />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
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
