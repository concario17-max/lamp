import { CSSProperties, Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ThemeToggle from './components/ThemeToggle';
import { useUI } from './context/UIContext';
import { AppShell } from './components/ui/AppShell';
import { getDesktopVerseColumns } from './components/ui/desktopVerseLayout';
import { useYogaData } from './hooks/useYogaData';
import type { YogaChapter } from './types';

const VerseView = lazy(() => import('./pages/VerseView'));

const DefaultVerseRedirect = () => {
    const { chapters, loading } = useYogaData();

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-transparent">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold-primary border-t-transparent" />
            </div>
        );
    }

    const firstChapter = chapters[0];
    const firstVerse = firstChapter?.sutras[0];
    const chapterNum = firstChapter?.chapter ?? 1;
    const verseNum = firstVerse?.verse ?? Number.parseInt(firstVerse?.id.split('.')[1] ?? '1', 10);

    return <Navigate to={`/chapter/${chapterNum}/verse/${verseNum}`} replace />;
};

interface ContextPillPickerProps {
    chapterNum?: string;
    verseNum?: string;
    chapters: YogaChapter[];
    onCommitSelection: (chapter: string, verse: string) => void;
}

const ContextPillPicker = ({
    chapterNum,
    verseNum,
    chapters,
    onCommitSelection,
}: ContextPillPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

    useEffect(() => {
        setIsOpen(false);
    }, [chapterNum, verseNum]);

    useEffect(() => {
        if (isOpen && chapterNum) {
            const currentCh = chapters.find((c) => String(c.chapter) === chapterNum);
            if (currentCh) {
                const rawPath = currentCh.meta.name_english
                    ? currentCh.meta.name_english.split(' / ').map((s) => s.trim()).filter(Boolean)
                    : [];
                let chapterTitle = currentCh.meta.name_korean;
                if (rawPath.length >= 2) {
                    chapterTitle = rawPath[1];
                }
                setExpandedChapter(chapterTitle);
            }
        }
    }, [isOpen, chapterNum, chapters]);

    useLayoutEffect(() => {
        if (!isOpen || !triggerRef.current) {
            return;
        }

        const updatePosition = () => {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (!rect) {
                return;
            }

            const panelWidth = Math.min(380, window.innerWidth - 24);
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

    useEffect(() => {
        if (!isOpen) {
            return;
        }

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

    const activeChapter = chapters.find((c) => String(c.chapter) === chapterNum);
    const activeVerse = activeChapter?.sutras.find((s) => String(s.verse ?? Number.parseInt(s.id.split('.')[1], 10)) === verseNum);

    const fullPathLabel = useMemo(() => {
        if (!activeChapter) {
            return chapterNum ? `${chapterNum}장` : '';
        }
        const rawPath = activeChapter.meta.name_english
            ? activeChapter.meta.name_english.split(' / ').map((s) => s.trim()).filter(Boolean)
            : [];
        
        let categoryTitle = activeChapter.meta.description || '보리도등론';
        let chapterTitle = activeChapter.meta.name_korean;
        let verseTitle = activeVerse?.title || (verseNum ? `${verseNum}절` : '');

        if (rawPath.length >= 3) {
            categoryTitle = rawPath[0];
            chapterTitle = rawPath[1];
            if (!activeVerse?.title) {
                verseTitle = rawPath[2];
            }
        } else if (rawPath.length === 2) {
            categoryTitle = rawPath[0];
            chapterTitle = rawPath[1];
        } else if (rawPath.length === 1) {
            const singleTitle = rawPath[0];
            if (singleTitle.includes('편') || (activeChapter.meta.name_korean && activeChapter.meta.name_korean !== singleTitle)) {
                categoryTitle = singleTitle;
                chapterTitle = activeChapter.meta.name_korean;
            } else {
                categoryTitle = activeChapter.meta.description || '보리도등론';
                chapterTitle = singleTitle;
            }
        }

        return [categoryTitle, chapterTitle, verseTitle].filter(Boolean).join(' / ');
    }, [activeChapter, activeVerse, chapterNum, verseNum]);

    interface GroupedCategory {
        description: string;
        chapters: {
            title: string;
            chapterNums: number[];
            sutras: YogaChapter['sutras'];
        }[];
    }

    const groupedCategories = useMemo(() => {
        const categories: GroupedCategory[] = [];

        chapters.forEach((ch) => {
            const rawPath = ch.meta.name_english
                ? ch.meta.name_english.split(' / ').map((s) => s.trim()).filter(Boolean)
                : [];

            let categoryTitle = ch.meta.description || '보리도등론';
            let chapterTitle = ch.meta.name_korean;

            if (rawPath.length >= 3) {
                categoryTitle = rawPath[0];
                chapterTitle = rawPath[1];
            } else if (rawPath.length === 2) {
                categoryTitle = rawPath[0];
                chapterTitle = rawPath[1];
            } else if (rawPath.length === 1) {
                const singleTitle = rawPath[0];
                if (singleTitle.includes('편') || (ch.meta.name_korean && ch.meta.name_korean !== singleTitle)) {
                    categoryTitle = singleTitle;
                    chapterTitle = ch.meta.name_korean;
                } else {
                    categoryTitle = ch.meta.description || '보리도등론';
                    chapterTitle = singleTitle;
                }
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
                    sutras: [],
                };
                category.chapters.push(chapter);
            }

            chapter.chapterNums.push(ch.chapter);
            ch.sutras.forEach((sutra) => {
                if (!chapter.sutras.some((s) => s.id === sutra.id)) {
                    let finalTitle = sutra.title;
                    if (!finalTitle && rawPath.length >= 3) {
                        finalTitle = rawPath[2];
                    }
                    chapter.sutras.push({
                        ...sutra,
                        title: finalTitle,
                    });
                }
            });
        });

        return categories;
    }, [chapters]);

    const panel = isOpen ? (
        <div
            role="dialog"
            aria-label="Context picker"
            ref={panelRef}
            style={panelStyle ?? undefined}
            className="z-[60] flex flex-col rounded-[1.75rem] border border-gold-border/12 bg-[linear-gradient(180deg,rgba(255,251,241,0.98)_0%,rgba(252,247,237,0.96)_48%,rgba(245,238,228,0.92)_100%)] p-4 shadow-[0_26px_72px_-34px_rgba(0,0,0,0.58)] backdrop-blur-2xl dark:border-dark-border/70 dark:bg-[linear-gradient(180deg,rgba(24,20,15,0.98)_0%,rgba(20,17,13,0.96)_48%,rgba(15,13,10,0.92)_100%)] select-none"
        >
            <div className="mb-3.5 flex items-center gap-3 border-b border-gold-border/12 pb-3 dark:border-dark-border/55">
                <span className="rounded-full border border-gold-primary/18 bg-gold-primary/8 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-gold-primary dark:border-gold-light/18 dark:bg-gold-light/8 dark:text-gold-light">
                    CONTEXT
                </span>
                <span className="flex-1 truncate text-[10px] font-medium tracking-[0.1em] text-text-secondary dark:text-dark-text-secondary">
                    {fullPathLabel}
                </span>
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
                {groupedCategories.map((group) => (
                    <div key={group.description || 'other'} className="space-y-2">
                        {group.description && (
                            <div className="px-2 text-[10px] font-bold tracking-[0.12em] text-gold-primary/80 dark:text-gold-light/80 uppercase border-l-2 border-gold-primary/30 pl-2">
                                {group.description}
                            </div>
                        )}
                        <div className="space-y-2">
                            {group.chapters.map((ch) => {
                                const isCurrentChapter = ch.chapterNums.includes(Number(chapterNum));
                                const isExpanded = expandedChapter === ch.title;

                                return (
                                    <div
                                        key={ch.title}
                                        className={`rounded-[1.25rem] border transition-all duration-300 ${
                                            isExpanded
                                                ? 'border-gold-border/25 bg-white/40 dark:border-dark-border/80 dark:bg-white/5 shadow-[0_8px_20px_-12px_rgba(166,139,92,0.15)]'
                                                : 'border-gold-border/10 bg-white/12 hover:border-gold-border/20 hover:bg-white/25 dark:border-dark-border/40 dark:bg-white/2 dark:hover:bg-white/4'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setExpandedChapter(isExpanded ? null : ch.title)}
                                            className="flex w-full items-center justify-between px-4 py-3 text-left outline-none cursor-pointer"
                                        >
                                            <span className={`text-[12px] font-semibold tracking-[0.02em] transition-colors duration-250 ${
                                                isExpanded 
                                                    ? 'text-gold-primary dark:text-gold-light' 
                                                    : 'text-text-primary dark:text-dark-text-primary'
                                            }}`}>
                                                {ch.title}
                                            </span>
                                            <span className={`h-2 w-2 rounded-full transition-all duration-300 ${
                                                isCurrentChapter
                                                    ? 'bg-gold-primary dark:bg-gold-light scale-110 shadow-[0_0_8px_rgba(166,139,92,0.6)]'
                                                    : 'bg-gold-border/30 dark:bg-dark-border/40'
                                            }`} />
                                        </button>

                                        {isExpanded && (
                                            <div className="border-t border-gold-border/8 px-3 pb-3 pt-2.5 dark:border-dark-border/30">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {ch.sutras.map((sutra) => {
                                                        const vNum = String(sutra.verse ?? Number.parseInt(sutra.id.split('.')[1], 10));
                                                        const sutraChapterNum = sutra.chapter ?? ch.chapterNums[0];
                                                        const isCurrentVerse = String(sutraChapterNum) === chapterNum && vNum === verseNum;
                                                        return (
                                                            <button
                                                                key={sutra.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    onCommitSelection(String(sutraChapterNum), vNum);
                                                                    setIsOpen(false);
                                                                }}
                                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-200 outline-none cursor-pointer ${
                                                                    isCurrentVerse
                                                                        ? 'bg-gold-primary text-white shadow-[0_4px_12px_-4px_rgba(166,139,92,0.8)] dark:bg-gold-light dark:text-[#2a2116]'
                                                                        : 'bg-white/80 text-text-primary border border-gold-border/10 hover:border-gold-border/25 hover:bg-white hover:shadow-[0_4px_10px_-6px_rgba(0,0,0,0.15)] dark:bg-white/6 dark:text-dark-text-primary dark:border-dark-border/50 dark:hover:bg-white/10'
                                                                }`}
                                                            >
                                                                {sutra.title ? (
                                                                    <span className="truncate text-[11px] font-medium flex-1">
                                                                        {sutra.title}
                                                                    </span>
                                                                ) : (
                                                                    <>
                                                                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                                                            isCurrentVerse
                                                                                ? 'bg-white/20 text-white'
                                                                                : 'bg-gold-primary/8 text-gold-primary dark:bg-gold-light/8 dark:text-gold-light'
                                                                        }`}>
                                                                            {vNum}절
                                                                        </span>
                                                                        <span className="truncate text-[11px] font-medium flex-1">
                                                                            {vNum}절 본문
                                                                        </span>
                                                                    </>
                                                                )}
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
                    </div>
                ))}
            </div>
        </div>
    ) : null;

    const triggerText = fullPathLabel;

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

const MainLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { chapterNum, verseNum } = useParams<{ chapterNum?: string; verseNum?: string }>();
    const { chapters } = useYogaData();
    const isVerseView = location.pathname.includes('/chapter/') && location.pathname.includes('/verse/');
    const { isSidebarOpen, isDesktopSidebarOpen } = useUI();

    const desktopGridColumns = isVerseView ? getDesktopVerseColumns(isDesktopSidebarOpen, false) : undefined;
    const currentChapterNumber = isVerseView && chapterNum ? Number.parseInt(chapterNum, 10) : null;

    const selectionControls =
        isVerseView && chapters.length > 0 && currentChapterNumber !== null ? (
            <ContextPillPicker
                chapterNum={chapterNum}
                verseNum={verseNum}
                chapters={chapters}
                onCommitSelection={(nextChapter, nextVerse) => navigate(`/chapter/${nextChapter}/verse/${nextVerse}`)}
            />
        ) : undefined;

    return (
        <AppShell
            header={isVerseView ? <Header title="보리도등론" showSidebarToggle selectionControls={selectionControls} /> : undefined}
            sidebar={isVerseView ? <Sidebar /> : undefined}
            isMobilePanelOpen={isVerseView && isSidebarOpen}
            desktopGridColumns={desktopGridColumns}
            floatingAction={
                !isVerseView ? (
                    <ThemeToggle className="border border-gold-primary/20 bg-white/82 p-3 shadow-xl shadow-black/5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-gold-primary/40 active:scale-90 dark:border-gold-primary/10 dark:bg-[#111]/80 dark:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.6)]" />
                ) : undefined
            }
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="h-full"
                >
                    <Suspense
                        fallback={
                            <div className="flex h-full items-center justify-center bg-transparent">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold-primary border-t-transparent" />
                            </div>
                        }
                    >
                        <Outlet />
                    </Suspense>
                </motion.div>
            </AnimatePresence>
        </AppShell>
    );
};

function App() {
    return (
        <Router>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<DefaultVerseRedirect />} />
                    <Route path="/chapter/:chapterNum/verse/:verseNum" element={<VerseView />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
