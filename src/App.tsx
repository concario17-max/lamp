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

const VerseView = lazy(() => import('./pages/VerseView'));

type ContextOption = {
    value: string;
    label: string;
};

type ChapterGroupOption = {
    value: string;
    label: string;
    count: number;
};

type ChapterGroup = {
    title: string;
    chapters: ChapterGroupOption[];
};

interface ContextPillPickerProps {
    chapterNum?: string;
    verseNum?: string;
    chapterGroups: ChapterGroup[];
    verseOptionsByChapter: Record<string, ContextOption[]>;
    onCommitSelection: (chapter: string, verse: string) => void;
}

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

    return <Navigate to={'/chapter/' + chapterNum + '/verse/' + verseNum} replace />;
};

const ContextPillPicker = ({
    chapterNum,
    verseNum,
    chapterGroups,
    verseOptionsByChapter,
    onCommitSelection,
}: ContextPillPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [draftChapterNum, setDraftChapterNum] = useState(chapterNum ?? '');
    const [draftVerseNum, setDraftVerseNum] = useState(verseNum ?? '');
    const [activeGroupTitle, setActiveGroupTitle] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const verseSelectRef = useRef<HTMLSelectElement>(null);
    const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

    useEffect(() => {
        setIsOpen(false);
    }, [chapterNum, verseNum]);

    useEffect(() => {
        const groupTitle = chapterGroups.find((group) => group.chapters.some((chapter) => chapter.value === chapterNum))?.title ?? chapterGroups[0]?.title ?? '';
        if (!isOpen) {
            setActiveGroupTitle(groupTitle);
            setDraftChapterNum(chapterNum ?? '');
            setDraftVerseNum(verseNum ?? '');
        }
    }, [chapterGroups, chapterNum, isOpen, verseNum]);

    useEffect(() => {
        if (!activeGroupTitle) {
            setActiveGroupTitle(chapterGroups[0]?.title ?? '');
        }
    }, [activeGroupTitle, chapterGroups]);

    useLayoutEffect(() => {
        if (!isOpen || !triggerRef.current) {
            return;
        }

        const updatePosition = () => {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (!rect) {
                return;
            }

            const panelWidth = Math.min(448, window.innerWidth - 16);
            const left = Math.min(Math.max(rect.left, 8), window.innerWidth - panelWidth - 8);
            const top = rect.bottom + 8;

            setPanelStyle({
                position: 'fixed',
                top: Math.round(top) + 'px',
                left: Math.round(left) + 'px',
                width: Math.round(panelWidth) + 'px',
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
                !panelRef.current?.contains(target) &&
                !verseSelectRef.current?.contains(target)
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

    const activeGroup = chapterGroups.find((group) => group.title === activeGroupTitle) ?? chapterGroups[0] ?? null;
    const activeGroupLabel = activeGroup?.title ?? '?????';
    const activeChapterLabel = chapterNum ? activeGroupLabel + ' ? ' + chapterNum + '?' : 'Select chapter';
    const activeVerseLabel = verseNum ? verseNum + '?' : 'Select verse';
    const draftVerseOptions = draftChapterNum ? verseOptionsByChapter[draftChapterNum] ?? [] : [];

    const selectClassName =
        'h-11 w-full appearance-none rounded-[1rem] border border-gold-border/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.72)_100%)] px-3.5 pr-9 text-[11px] font-medium tracking-[0.08em] text-text-primary outline-none transition-all duration-300 hover:border-gold-border/25 hover:bg-white hover:shadow-[0_10px_28px_-22px_rgba(0,0,0,0.55)] focus:border-gold-primary/35 focus:bg-white focus:ring-1 focus:ring-gold-primary/15 dark:border-dark-border/60 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_100%)] dark:text-dark-text-primary dark:hover:bg-white/8 dark:focus:border-gold-light/30 dark:focus:bg-white/10';

    const handleChapterSelect = (nextChapter: string) => {
        setDraftChapterNum(nextChapter);
        setDraftVerseNum('');
        window.requestAnimationFrame(() => verseSelectRef.current?.focus());
    };

    const visibleGroupChapters = activeGroup?.chapters ?? [];

    const panel = isOpen ? (
        <div
            ref={panelRef}
            role="dialog"
            aria-label="Context picker"
            style={panelStyle ?? undefined}
            className="z-[60] rounded-[1.75rem] border border-gold-border/12 bg-[linear-gradient(180deg,rgba(255,251,241,0.98)_0%,rgba(252,247,237,0.96)_48%,rgba(245,238,228,0.92)_100%)] p-3.5 shadow-[0_26px_72px_-34px_rgba(0,0,0,0.58)] backdrop-blur-2xl dark:border-dark-border/70 dark:bg-[linear-gradient(180deg,rgba(24,20,15,0.98)_0%,rgba(20,17,13,0.96)_48%,rgba(15,13,10,0.92)_100%)]"
        >
            <div className="mb-3 flex items-center gap-2.5 border-b border-gold-border/12 pb-2.5 dark:border-dark-border/55">
                <span className="rounded-full border border-gold-primary/18 bg-gold-primary/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-gold-primary dark:border-gold-light/18 dark:bg-gold-light/10 dark:text-gold-light">
                    Context
                </span>
                <span className="flex-1 text-[10px] font-medium tracking-[0.14em] text-text-secondary/75 dark:text-dark-text-secondary/70">
                    {activeChapterLabel} / {activeVerseLabel}
                </span>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 rounded-[1.25rem] border border-gold-border/10 bg-white/30 p-1.5 dark:border-dark-border/60 dark:bg-white/4">
                {chapterGroups.map((group) => {
                    const isSelected = group.title === activeGroupLabel;

                    return (
                        <button
                            key={group.title}
                            type="button"
                            onClick={() => setActiveGroupTitle(group.title)}
                            aria-pressed={isSelected}
                            className={
                                'rounded-[0.95rem] px-3 py-2 text-left transition-all duration-300 ' +
                                (isSelected
                                    ? 'bg-white/92 text-gold-primary shadow-[0_10px_24px_-20px_rgba(166,139,92,0.7)] dark:bg-white/10 dark:text-gold-light'
                                    : 'text-text-secondary/75 hover:bg-white/72 hover:text-text-primary dark:text-dark-text-secondary dark:hover:bg-white/8 dark:hover:text-dark-text-primary')
                            }
                        >
                            <span className="block text-[9px] font-semibold uppercase tracking-[0.24em]">
                                {group.title}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-medium tracking-[0.08em] opacity-80">
                                {group.chapters.length}?
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="max-h-[min(58vh,30rem)] space-y-3 overflow-y-auto pr-1">
                <section className="rounded-[1.35rem] border p-2.5 transition-all duration-300 border-gold-primary/22 bg-gold-primary/6 shadow-[0_12px_28px_-22px_rgba(166,139,92,0.35)] dark:border-gold-light/22 dark:bg-gold-light/8">
                    <div className="flex items-center justify-between gap-3 px-1.5 pt-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-primary dark:text-gold-light">
                            {activeGroupLabel}
                        </span>
                        <span className="rounded-full border border-gold-primary/18 bg-gold-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold-primary dark:border-gold-light/20 dark:bg-gold-light/10 dark:text-gold-light">
                            {visibleGroupChapters.length}?
                        </span>
                    </div>

                    <div className="mt-2 space-y-1.5">
                        {visibleGroupChapters.map((chapter) => {
                            const isSelected = draftChapterNum === chapter.value;

                            return (
                                <button
                                    key={chapter.value}
                                    type="button"
                                    onClick={() => handleChapterSelect(chapter.value)}
                                    className={
                                        'flex w-full items-center justify-between gap-3 rounded-[1rem] border px-3 py-2 text-left transition-all duration-300 ' +
                                        (isSelected
                                            ? 'border-gold-primary/24 bg-white/92 shadow-[0_10px_24px_-20px_rgba(166,139,92,0.6)] dark:border-gold-light/18 dark:bg-white/10'
                                            : 'border-transparent bg-white/55 hover:border-gold-border/18 hover:bg-white/82 dark:bg-white/5 dark:hover:bg-white/8')
                                    }
                                >
                                    <span className="min-w-0">
                                        <span className="block text-[9px] font-semibold uppercase tracking-[0.24em] text-text-secondary/72 dark:text-dark-text-secondary/70">
                                            Chapter {chapter.value}
                                        </span>
                                        <span className="mt-0.5 block truncate text-[13px] font-medium text-text-primary dark:text-dark-text-primary">
                                            {chapter.label}
                                        </span>
                                    </span>
                                    <span className="shrink-0 rounded-full border border-gold-border/18 bg-gold-surface/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-gold-primary dark:border-dark-border/60 dark:bg-white/5 dark:text-gold-light">
                                        {chapter.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            <div className="mt-3 space-y-2.5 border-t border-gold-border/12 pt-3 dark:border-dark-border/55">
                <label className="block rounded-[1.1rem] border border-gold-border/10 bg-white/48 p-2.5 transition-all duration-300 hover:border-gold-border/18 hover:bg-white/60 dark:border-dark-border/60 dark:bg-white/5 dark:hover:bg-white/8">
                    <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.24em] text-text-secondary/78 dark:text-dark-text-secondary/78">
                        Verse
                    </span>
                    <select
                        ref={verseSelectRef}
                        value={draftVerseNum}
                        onChange={(event) => {
                            const nextVerse = event.target.value;
                            if (nextVerse && draftChapterNum) {
                                onCommitSelection(draftChapterNum, nextVerse);
                                setIsOpen(false);
                            }
                        }}
                        className={selectClassName}
                        disabled={!draftChapterNum}
                    >
                        <option value="" disabled>
                            {draftChapterNum ? 'Select verse' : 'Select chapter first'}
                        </option>
                        {draftVerseOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
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
                className="inline-flex items-center gap-1.5 rounded-full border border-gold-border/14 bg-[linear-gradient(180deg,rgba(255,251,241,0.92)_0%,rgba(248,241,228,0.82)_100%)] px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-gold-primary shadow-[0_12px_32px_-24px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-primary/30 hover:bg-white/90 active:translate-y-0 dark:border-dark-border/70 dark:bg-[linear-gradient(180deg,rgba(28,23,18,0.92)_0%,rgba(20,17,13,0.82)_100%)] dark:text-gold-light dark:hover:bg-white/8"
            >
                <span className="whitespace-nowrap">{activeChapterLabel + ' / ' + activeVerseLabel}</span>
                <ChevronDown className={isOpen ? 'h-3.5 w-3.5 rotate-180 transition-transform duration-300' : 'h-3.5 w-3.5 transition-transform duration-300'} />
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

    const chapterGroups = useMemo(
        () =>
            chapters.reduce<ChapterGroup[]>((groups, chapter) => {
                const groupTitle = chapter.meta.description || chapter.meta.name_korean || ('Chapter ' + chapter.chapter);
                const lastGroup = groups[groups.length - 1];

                if (!lastGroup || lastGroup.title !== groupTitle) {
                    groups.push({
                        title: groupTitle,
                        chapters: [],
                    });
                }

                groups[groups.length - 1].chapters.push({
                    value: String(chapter.chapter),
                    label: chapter.meta.name_korean,
                    count: chapter.meta.sutraCount,
                });

                return groups;
            }, []),
        [chapters],
    );

    const verseOptionsByChapter = useMemo(
        () =>
            chapters.reduce<Record<string, ContextOption[]>>((acc, chapter) => {
                acc[String(chapter.chapter)] = chapter.sutras.map((sutra, index) => {
                    const verseNumberText = String(sutra.verse ?? Number.parseInt(sutra.id.split('.')[1], 10));
                    const verseNumber = Number.parseInt(verseNumberText, 10);
                    const nextSutra = chapter.sutras[index + 1];
                    const nextVerseNumber = nextSutra
                        ? Number.parseInt(String(nextSutra.verse ?? Number.parseInt(nextSutra.id.split('.')[1], 10)), 10)
                        : null;
                    const label = nextVerseNumber && nextVerseNumber > verseNumber + 1 ? verseNumberText + '-' + (nextVerseNumber - 1) : verseNumberText;

                    return {
                        value: verseNumberText,
                        label: label,
                    };
                });

                return acc;
            }, {}),
        [chapters],
    );

    const selectionControls =
        isVerseView && chapterGroups.length > 0 && currentChapterNumber !== null ? (
            <ContextPillPicker
                chapterNum={chapterNum}
                verseNum={verseNum}
                chapterGroups={chapterGroups}
                verseOptionsByChapter={verseOptionsByChapter}
                onCommitSelection={(nextChapter, nextVerse) => navigate('/chapter/' + nextChapter + '/verse/' + nextVerse)}
            />
        ) : undefined;

    return (
        <AppShell
            header={isVerseView ? <Header title="?????(?????)" showSidebarToggle selectionControls={selectionControls} /> : undefined}
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
