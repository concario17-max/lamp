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

type ContextOption = {
    value: string;
    label: string;
};

type ChapterOutlineLeaf = {
    kind: 'leaf';
    key: string;
    chapterNum: string;
    label: string;
    verseCount: number;
    path: string[];
};

type ChapterOutlineBranch = {
    kind: 'branch';
    key: string;
    title: string;
    path: string[];
    children: ChapterOutlineNode[];
    leafCount: number;
};

type ChapterOutlineNode = ChapterOutlineLeaf | ChapterOutlineBranch;

type ChapterOutlineGroup = {
    title: string;
    nodes: ChapterOutlineNode[];
    leafCount: number;
};

interface ContextPillPickerProps {
    chapterNum?: string;
    verseNum?: string;
    outlineGroups: ChapterOutlineGroup[];
    verseOptionsByChapter: Record<string, ContextOption[]>;
    currentOutlinePath: string[];
    onCommitSelection: (chapter: string, verse: string) => void;
}

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

const insertOutlineLeaf = (nodes: ChapterOutlineNode[], branchPath: string[], leaf: ChapterOutlineLeaf) => {
    let currentNodes = nodes;
    const currentPath: string[] = [];

    branchPath.forEach((segment) => {
        currentPath.push(segment);
        const key = currentPath.join(' / ');
        let branch = currentNodes.find((node): node is ChapterOutlineBranch => node.kind === 'branch' && node.key === key);

        if (!branch) {
            branch = {
                kind: 'branch',
                key,
                title: segment,
                path: [...currentPath],
                children: [] as ChapterOutlineNode[],
                leafCount: 0,
            };
            currentNodes.push(branch);
        }

        currentNodes = branch.children;
    });

    currentNodes.push(leaf);
};

const countOutlineLeaves = (nodes: ChapterOutlineNode[]): number =>
    nodes.reduce((count: number, node: ChapterOutlineNode): number => {
        if (node.kind === 'leaf') {
            return count + 1;
        }

        const childCount = countOutlineLeaves(node.children);
        node.leafCount = childCount;
        return count + childCount;
    }, 0);

const buildOutlineGroups = (chapters: YogaChapter[]) => {
    const groups = new Map<string, ChapterOutlineGroup>();

    chapters.forEach((chapter) => {
        const groupTitle = chapter.meta.description || chapter.meta.name_korean || '보리도등론';
        const pathInfo = getChapterOutlinePath(chapter);
        const group: ChapterOutlineGroup = groups.get(groupTitle) ?? {
            title: groupTitle,
            nodes: [],
            leafCount: 0,
        };

        if (!groups.has(groupTitle)) {
            groups.set(groupTitle, group);
        }

        const leaf: ChapterOutlineLeaf = {
            kind: 'leaf',
            key: 'chapter-' + chapter.chapter,
            chapterNum: String(chapter.chapter),
            label: pathInfo.leafLabel,
            verseCount: chapter.meta.sutraCount,
            path: pathInfo.displayPath,
        };

        if (pathInfo.branchPath.length > 0) {
            insertOutlineLeaf(group.nodes, pathInfo.branchPath, leaf);
        } else {
            group.nodes.push(leaf);
        }
    });

    return [...groups.values()].map((group) => {
        group.leafCount = countOutlineLeaves(group.nodes);
        return group;
    });
};

const outlineNodeContainsChapter = (node: ChapterOutlineNode, chapterNum?: string): boolean => {
    if (!chapterNum) {
        return false;
    }

    if (node.kind === 'leaf') {
        return node.chapterNum === chapterNum;
    }

    return node.children.some((child) => outlineNodeContainsChapter(child, chapterNum));
};

const outlineNodesContainChapter = (nodes: ChapterOutlineNode[], chapterNum?: string) => nodes.some((node) => outlineNodeContainsChapter(node, chapterNum));

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
    outlineGroups,
    verseOptionsByChapter,
    currentOutlinePath,
    onCommitSelection,
}: ContextPillPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [draftChapterNum, setDraftChapterNum] = useState(chapterNum ?? '');
    const [draftVerseNum, setDraftVerseNum] = useState(verseNum ?? '');
    const [activeGroupTitle, setActiveGroupTitle] = useState('');
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const verseSelectRef = useRef<HTMLSelectElement>(null);
    const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

    const selectedGroupTitle = useMemo(() => {
        const matchedGroup = outlineGroups.find((group) => outlineNodesContainChapter(group.nodes, chapterNum));
        return matchedGroup?.title ?? outlineGroups[0]?.title ?? '';
    }, [chapterNum, outlineGroups]);

    useEffect(() => {
        setIsOpen(false);
    }, [chapterNum, verseNum]);

    useEffect(() => {
        if (!isOpen) {
            setActiveGroupTitle(selectedGroupTitle);
            setDraftChapterNum(chapterNum ?? '');
            setDraftVerseNum(verseNum ?? '');
        }
    }, [chapterNum, isOpen, selectedGroupTitle, verseNum]);

    useEffect(() => {
        if (!activeGroupTitle) {
            setActiveGroupTitle(outlineGroups[0]?.title ?? '');
        }
    }, [activeGroupTitle, outlineGroups]);

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

    useEffect(() => {
        const activeGroup = outlineGroups.find((group) => group.title === activeGroupTitle) ?? outlineGroups[0] ?? null;
        if (!activeGroup) {
            return;
        }

        const keys: string[] = [];
        const collectBranchKeys = (nodes: ChapterOutlineNode[]) => {
            nodes.forEach((node) => {
                if (node.kind === 'branch') {
                    keys.push(node.key);
                    collectBranchKeys(node.children);
                }
            });
        };

        collectBranchKeys(activeGroup.nodes);
        setExpandedKeys(keys);
    }, [activeGroupTitle, outlineGroups]);

    const activeGroup = outlineGroups.find((group) => group.title === activeGroupTitle) ?? outlineGroups[0] ?? null;
    const activeGroupLabel = activeGroup?.title ?? '보리도등론';
    const activeChapterLabel = currentOutlinePath.length > 0 ? currentOutlinePath.join(' / ') : activeGroupLabel;
    const activeVerseLabel = verseNum ?? '선택';
    const draftVerseOptions = draftChapterNum ? verseOptionsByChapter[draftChapterNum] ?? [] : [];

    const selectClassName =
        'h-11 w-full appearance-none rounded-[1rem] border border-gold-border/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.72)_100%)] px-3.5 pr-9 text-[11px] font-medium tracking-[0.08em] text-text-primary outline-none transition-all duration-300 hover:border-gold-border/25 hover:bg-white hover:shadow-[0_10px_28px_-22px_rgba(0,0,0,0.55)] focus:border-gold-primary/35 focus:bg-white focus:ring-1 focus:ring-gold-primary/15 dark:border-dark-border/60 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_100%)] dark:text-dark-text-primary dark:hover:bg-white/8 dark:focus:border-gold-light/30 dark:focus:bg-white/10';

    const handleChapterSelect = (nextChapter: string) => {
        setDraftChapterNum(nextChapter);
        setDraftVerseNum('');
        window.requestAnimationFrame(() => verseSelectRef.current?.focus());
    };

    const renderNodes = (nodes: ChapterOutlineNode[], depth = 0): React.ReactNode =>
        nodes.map((node) => {
            if (node.kind === 'branch') {
                const isSelected = outlineNodeContainsChapter(node, draftChapterNum);
                const isExpanded = expandedKeys.includes(node.key) || isSelected;

                return (
                    <section
                        key={node.key}
                        className={
                            'rounded-[1.35rem] border p-3 transition-all duration-300 ' +
                            (depth === 0
                                ? 'border-gold-primary/22 bg-gold-primary/6 shadow-[0_12px_28px_-22px_rgba(166,139,92,0.35)] dark:border-gold-light/20 dark:bg-gold-light/8'
                                : 'border-gold-border/12 bg-white/40 dark:border-dark-border/60 dark:bg-white/4')
                        }
                    >
                        <button
                            type="button"
                        onClick={() => {
                            setExpandedKeys((prev) =>
                                prev.includes(node.key) ? prev.filter((item) => item !== node.key) : [...prev, node.key],
                            );
                        }}
                            className="flex w-full items-start gap-3 text-left"
                        >
                            <div className="min-w-0 flex-1">
                                <span
                                    className={
                                        'block truncate font-semibold text-text-primary dark:text-dark-text-primary ' +
                                        (depth === 0 ? 'text-[14px] tracking-[0.03em]' : 'text-[13px] tracking-[0.02em]')
                                    }
                                >
                                    {node.title}
                                </span>
                            </div>
                            <ChevronDown
                                className={
                                    'shrink-0 h-4 w-4 text-gold-primary transition-transform duration-300 dark:text-gold-light ' +
                                    (isExpanded ? 'rotate-180' : '')
                                }
                            />
                        </button>

                        {isExpanded ? (
                            <div className={'mt-3 space-y-2 ' + (depth === 0 ? 'pl-1' : 'border-l border-gold-border/10 pl-3 dark:border-dark-border/50')}>
                                {renderNodes(node.children, depth + 1)}
                            </div>
                        ) : null}
                    </section>
                );
            }

            const isSelected = draftChapterNum === node.chapterNum;

            return (
                <button
                    key={node.key}
                    type="button"
                    onClick={() => handleChapterSelect(node.chapterNum)}
                    className={
                        'flex w-full items-center justify-between gap-3 rounded-[1rem] border px-3 py-2.5 text-left transition-all duration-300 ' +
                        (isSelected
                            ? 'border-gold-primary/24 bg-white/92 shadow-[0_10px_24px_-20px_rgba(166,139,92,0.6)] dark:border-gold-light/18 dark:bg-white/10'
                            : 'border-transparent bg-white/55 hover:border-gold-border/18 hover:bg-white/82 dark:bg-white/5 dark:hover:bg-white/8')
                    }
                >
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-text-primary dark:text-dark-text-primary">
                            {node.label}
                        </span>
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold tracking-[0.12em] text-gold-primary dark:text-gold-light">
                        {node.verseCount}
                    </span>
                </button>
            );
        });

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
                {outlineGroups.map((group) => {
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
                            <span className="block text-[9px] font-semibold uppercase tracking-[0.24em]">{group.title}</span>
                        </button>
                    );
                })}
            </div>

            <div className="max-h-[min(58vh,30rem)] space-y-3 overflow-y-auto pr-1">
                <section className="rounded-[1.35rem] border border-gold-primary/22 bg-gold-primary/6 p-2.5 shadow-[0_12px_28px_-22px_rgba(166,139,92,0.35)] transition-all duration-300 dark:border-gold-light/22 dark:bg-gold-light/8">
                    <div className="flex items-center justify-between gap-3 px-1.5 pt-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-primary dark:text-gold-light">
                            {activeGroupLabel}
                        </span>
                    </div>

                    <div className="mt-3 space-y-2.5">{activeGroup ? renderNodes(activeGroup.nodes) : null}</div>
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

    const outlineGroups = useMemo(() => buildOutlineGroups(chapters), [chapters]);

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

    const currentOutlinePath = useMemo(() => {
        if (!currentChapterNumber) {
            return [];
        }

        const currentChapter = chapters.find((chapter) => chapter.chapter === currentChapterNumber);
        if (!currentChapter) {
            return [];
        }

        return getChapterOutlinePath(currentChapter).displayPath;
    }, [chapters, currentChapterNumber]);

    const selectionControls =
        isVerseView && outlineGroups.length > 0 && currentChapterNumber !== null ? (
            <ContextPillPicker
                chapterNum={chapterNum}
                verseNum={verseNum}
                outlineGroups={outlineGroups}
                verseOptionsByChapter={verseOptionsByChapter}
                currentOutlinePath={currentOutlinePath}
                onCommitSelection={(nextChapter, nextVerse) => navigate('/chapter/' + nextChapter + '/verse/' + nextVerse)}
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
