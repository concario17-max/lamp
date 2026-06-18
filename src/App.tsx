import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ThemeToggle from './components/ThemeToggle';
import { useUI } from './context/UIContext';
import { AppShell } from './components/ui/AppShell';
import { getDesktopVerseColumns } from './components/ui/desktopVerseLayout';
import { useYogaData } from './hooks/useYogaData';
import { TOCPicker } from './components/TOCPicker';

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

const MainLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { chapterNum, verseNum } = useParams<{ chapterNum?: string; verseNum?: string }>();
    const { chapters, allChapters } = useYogaData();
    const isVerseView = location.pathname.includes('/chapter/') && location.pathname.includes('/verse/');
    const { isSidebarOpen, isDesktopSidebarOpen } = useUI();

    const desktopGridColumns = isVerseView ? getDesktopVerseColumns(isDesktopSidebarOpen, false) : undefined;
    const currentChapterNumber = isVerseView && chapterNum ? Number.parseInt(chapterNum, 10) : null;

    const selectionControls =
        isVerseView && chapters.length > 0 && currentChapterNumber !== null ? (
            <TOCPicker
                chapterNum={chapterNum}
                verseNum={verseNum}
                chapters={chapters}
                allChapters={allChapters}
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
