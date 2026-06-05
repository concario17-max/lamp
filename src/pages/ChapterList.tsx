import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { BookOpenText, Cloud, Sparkles, Target, Zap } from 'lucide-react';
import { useYogaData } from '../hooks/useYogaData';
import { GlassCard } from '../components/ui/GlassCard';

const CompendiumModal = lazy(() => import('../components/CompendiumModal'));
const LexiconModal = lazy(() => import('../components/LexiconModal'));

const getChapterIcon = (chapter: number) => {
    switch (chapter) {
        case 1:
            return <Target className="h-5 w-5" />;
        case 2:
            return <Zap className="h-5 w-5" />;
        case 3:
            return <Sparkles className="h-5 w-5" />;
        case 4:
            return <Cloud className="h-5 w-5" />;
        default:
            return <BookOpenText className="h-5 w-5" />;
    }
};

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.8,
            ease: 'easeOut',
        },
    },
};

const renderChapterTitle = (title: string) => title.split(' ').filter(Boolean).map((line, index) => (
    <span key={`${line}-${index}`} className="block">
        {line}
    </span>
));

const ChapterList = () => {
    const navigate = useNavigate();
    const { chapters, loading, error } = useYogaData();
    const [isCompendiumOpen, setIsCompendiumOpen] = useState<boolean>(false);
    const [isLexiconOpen, setIsLexiconOpen] = useState<boolean>(false);
    const [selectedChapter, setSelectedChapter] = useState<string>('');
    const [selectedVerse, setSelectedVerse] = useState<string>('');

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold-primary border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center px-6">
                <div className="max-w-lg rounded-2xl border border-gold-border/30 bg-white/75 p-6 text-center shadow-lg backdrop-blur-sm dark:bg-dark-surface/75">
                    <h1 className="mb-3 font-display text-2xl text-text-primary dark:text-dark-text-primary">Unable to load Three Bodies</h1>
                    <p className="text-sm leading-relaxed text-text-secondary dark:text-dark-text-secondary">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-[52rem] flex-col px-4 py-6 transition-colors duration-500 md:px-6 md:py-8 lg:h-full lg:overflow-hidden lg:py-4">
            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mb-8 flex flex-col items-center text-center md:mb-10 lg:mb-4 lg:flex-none">
                <motion.div variants={itemVariants} className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-gold-border bg-gold-surface/50 dark:border-dark-border dark:bg-dark-surface lg:mb-3">
                    <BookOpenText className="h-5 w-5 text-gold-primary opacity-80" />
                </motion.div>
                <motion.h1 variants={itemVariants} className="mb-4 font-display text-[44px] font-medium tracking-[0.12em] text-text-primary drop-shadow-sm dark:text-dark-text-primary sm:text-[56px] md:text-[64px] lg:mb-3 lg:text-[54px]">
                    THREE BODIES
                </motion.h1>
                <motion.p variants={itemVariants} className="mb-12 font-display text-[15px] italic tracking-[0.18em] text-gold-primary dark:text-gold-light md:text-lg lg:mb-6">
                    A reading space for source text, translation, and reflection
                </motion.p>

                <motion.div variants={itemVariants} className="mb-8 flex flex-wrap items-center justify-center gap-1 text-[11px] font-medium uppercase tracking-[0.28em] text-text-secondary sm:gap-6 lg:mb-5">
                    <span onClick={() => setIsCompendiumOpen(true)} className="cursor-pointer rounded-full bg-transparent px-3 py-2 transition-colors hover:bg-gold-surface/30 hover:text-gold-primary active:scale-95">
                        Compendium
                    </span>
                    <div className="h-1 w-1 rotate-45 bg-gold-border/50" />
                    <span onClick={() => setIsLexiconOpen(true)} className="cursor-pointer rounded-full bg-transparent px-3 py-2 transition-colors hover:bg-gold-surface/30 hover:text-gold-primary active:scale-95">
                        Lexicon
                    </span>
                </motion.div>

                <motion.div variants={itemVariants} className="mx-auto mb-10 flex w-full max-w-md items-center justify-center opacity-40 lg:mb-5">
                    <div className="h-px flex-1 bg-gold-border" />
                    <div className="mx-4 text-lg leading-none text-gold-primary">
                        <BookOpenText className="h-4 w-4" />
                    </div>
                    <div className="h-px flex-1 bg-gold-border" />
                </motion.div>

                <motion.div variants={itemVariants} className="relative z-10 mx-auto mb-5 flex w-full max-w-[52rem] flex-col items-center justify-between gap-3 rounded-2xl border border-gold-border/40 bg-white/80 p-2.5 shadow-xl shadow-gold-primary/5 backdrop-blur-md dark:bg-dark-surface/80 dark:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.5)] sm:flex-row sm:gap-0 sm:p-3 lg:mb-0">
                    <div className="flex w-full flex-1 flex-col items-start border-b border-gold-border/30 px-2 pb-2 sm:border-b-0 sm:border-r sm:px-4 sm:pb-0">
                        <span className="mb-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-gold-primary drop-shadow-sm">Chapter</span>
                        <select
                            className="w-full appearance-none bg-transparent text-sm font-medium text-text-primary outline-none transition-colors focus:text-gold-primary dark:text-dark-text-primary"
                            value={selectedChapter}
                            onChange={(event) => {
                                setSelectedChapter(event.target.value);
                                setSelectedVerse('');
                            }}
                        >
                            <option value="">Select Chapter</option>
                            {chapters.map((chapter) => (
                                <option key={chapter.chapter} value={chapter.chapter} className="text-base">
                                    {chapter.chapter}. {chapter.meta.name_korean}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex w-full flex-1 flex-col items-start px-2 pt-0.5 sm:px-6 sm:pt-0">
                        <span className="mb-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-gold-primary drop-shadow-sm">Verse</span>
                        <select
                            className="w-full appearance-none bg-transparent text-sm font-medium text-text-primary outline-none transition-colors focus:text-gold-primary disabled:opacity-50 dark:text-dark-text-primary"
                            value={selectedVerse}
                            disabled={!selectedChapter}
                            onChange={(event) => {
                                const verse = event.target.value;
                                setSelectedVerse(verse);
                                if (selectedChapter && verse) {
                                    navigate(`/chapter/${selectedChapter}/verse/${verse}`);
                                }
                            }}
                        >
                            <option value="">{selectedChapter ? 'Select Verse' : 'Select Chapter First'}</option>
                            {selectedChapter &&
                                chapters
                                    .find((chapter) => chapter.chapter === Number.parseInt(selectedChapter, 10))
                                    ?.sutras.map((sutra) => {
                                        const verseNumber = String(sutra.verse ?? Number.parseInt(sutra.id.split('.')[1], 10));
                                        return (
                                            <option key={sutra.id} value={verseNumber} className="text-base">
                                                Verse {verseNumber}
                                            </option>
                                        );
                                    })}
                        </select>
                    </div>
                </motion.div>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="relative z-10 mx-auto grid w-full max-w-[52rem] grid-cols-1 gap-4 pb-12 sm:grid-cols-2 sm:gap-6 lg:flex-1 lg:items-stretch lg:gap-4 lg:pb-4">
                {chapters.map((chapter) => {
                    const chapterInfo = chapter.meta;

                    return (
                        <motion.div key={chapter.chapter} variants={itemVariants} className="lg:min-h-0">
                            <GlassCard
                                href={`/chapter/${chapter.chapter}/verse/1`}
                                icon={getChapterIcon(chapter.chapter)}
                                className="lg:h-full"
                                subtitle={`CHAPTER ${chapter.chapter}`}
                                title={
                                    <>
                                        <span className="font-display text-[30px] font-medium tracking-[0.04em] md:text-[34px]">
                                            {renderChapterTitle(chapterInfo.name_english)}
                                        </span>
                                        <span className="mt-1 font-noto-kr text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                                            {chapterInfo.name_korean}
                                        </span>
                                    </>
                                }
                                description={chapterInfo.description || 'Read verses of this chapter.'}
                            />
                        </motion.div>
                    );
                })}
            </motion.div>

            <Suspense fallback={null}>
                {isCompendiumOpen && <CompendiumModal isOpen={isCompendiumOpen} onClose={() => setIsCompendiumOpen(false)} />}
                {isLexiconOpen && <LexiconModal isOpen={isLexiconOpen} onClose={() => setIsLexiconOpen(false)} />}
            </Suspense>
        </div>
    );
};

export default ChapterList;
