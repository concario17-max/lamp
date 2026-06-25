import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';
import { useYogaData } from '../hooks/useYogaData';
import { useAudio } from '../hooks/useAudio';
import { SutraContent } from '../components/verse/SutraContent';
import { AudioPlayer } from '../components/verse/AudioPlayer';
import { TranslationSection } from '../components/verse/TranslationSection';
import { WordMeanings } from '../components/verse/WordMeanings';
import { SutraNavigation } from '../components/verse/SutraNavigation';
import { VersePanelCard } from '../components/verse/VersePanelCard';
import { useSutraNavigation } from '../hooks/useSutraNavigation';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { CommentaryMarkdown } from '../components/commentary/CommentaryMarkdown';
import { MobileVerseGuide } from '../components/verse/MobileVerseGuide';

const learningComicImages = import.meta.glob('../assets/learning-comic/*/*.png', {
    eager: true,
    import: 'default',
}) as Record<string, string>;

type ComicEntry = {
    start: number;
    end: number;
    url: string;
    rawName?: string;
};

const learningComicIndex = Object.entries(learningComicImages).reduce<Record<string, ComicEntry[]>>((acc, [path, url]) => {
    const match = path.match(/learning-comic\/(?:chapter-)?(\d+)\/(.+)\.png$/);
    if (!match) {
        return acc;
    }

    const chapter = match[1];
    const filename = match[2];
    const [startText, endText] = filename.split('-');
    const start = Number.parseInt(startText, 10);
    const end = Number.parseInt(endText ?? startText, 10);

    if (!acc[chapter]) {
        acc[chapter] = [];
    }

    acc[chapter].push({
        start: Number.isNaN(start) ? -1 : start,
        end: Number.isNaN(end) ? -1 : end,
        url,
        rawName: filename
    });
    return acc;
}, {});

Object.values(learningComicIndex).forEach((entries) => {
    entries.sort((left, right) => left.start - right.start || left.end - right.end);
});

const getLearningComicImageUrl = (chapterNum: string, verseNum: string) => {
    const entries = learningComicIndex[chapterNum];
    if (!entries) {
        return null;
    }

    const stringMatch = entries.find((entry) => entry.rawName === verseNum);
    if (stringMatch) {
        return stringMatch.url;
    }

    const verse = Number.parseInt(verseNum, 10);
    if (!Number.isNaN(verse)) {
        const match = entries.find((entry) => entry.start !== -1 && verse >= entry.start && verse <= entry.end);
        return match?.url ?? null;
    }

    return null;
};

const extractCommentaryTitle = (content?: string | null) => {
    if (!content) {
        return null;
    }

    const headingMatch = content.match(/^#\s+(.+?)(?:\r?\n|$)/m);
    return headingMatch?.[1]?.trim() ?? null;
};

const stripCommentaryTitleBlock = (content?: string | null) => {
    if (!content) {
        return content ?? null;
    }

    return content.replace(/^#\s+.+?(?:\r?\n)+/, '').trimStart();
};

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.08,
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: { duration: 0.3 },
    },
};

const itemVariants: Variants = {
    hidden: { y: 14, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.55,
            ease: 'easeOut',
        },
    },
};

type CommentaryViewMode = 'commentary' | 'comic';

interface CommentaryContentProps {
    chapterNum: string;
    verseNum: string;
    commentaryText?: string;
    fallbackTitle?: string | null;
    navigationControls?: ReactNode;
}

const CommentaryContent = ({ chapterNum, verseNum, commentaryText, fallbackTitle, navigationControls }: CommentaryContentProps) => {
    const [viewMode, setViewMode] = useState<CommentaryViewMode>('comic');
    const [commentaryTitle, setCommentaryTitle] = useState<string | null>(() => extractCommentaryTitle(commentaryText) ?? fallbackTitle ?? null);

    useEffect(() => {
        setViewMode('comic');
    }, [chapterNum, verseNum]);

    useEffect(() => {
        setCommentaryTitle(extractCommentaryTitle(commentaryText) ?? fallbackTitle ?? null);
    }, [commentaryText, fallbackTitle]);

    const learningComicImageUrl = getLearningComicImageUrl(chapterNum, verseNum);
    const commentaryBodyText = stripCommentaryTitleBlock(commentaryText);

    const commentaryToggleButton = (
        <button
            type="button"
            onClick={() => setViewMode((current) => (current === 'commentary' ? 'comic' : 'commentary'))}
            aria-label={viewMode === 'commentary' ? 'Show comic' : 'Show commentary'}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold-border/30 bg-shell-main/90 text-gold-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-transform duration-200 hover:-translate-y-0.5 dark:border-dark-border/55 dark:bg-shell-main-dark/90 dark:text-gold-light"
        >
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
        </button>
    );

    return (
        <section className="mx-auto w-full px-0">
            <VersePanelCard label="COMMENTARY" navigationControls={navigationControls} trailingAction={commentaryToggleButton} contentClassName="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 sm:space-y-5">
                {viewMode === 'commentary' ? (
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-baseline gap-2 overflow-hidden">
                            <span className="min-w-0 truncate font-sans text-[22px] font-semibold leading-tight tracking-[0.01em] text-text-primary dark:text-dark-text-primary sm:text-[28px]">
                                {commentaryTitle ?? ''}
                            </span>
                        </div>

                        <CommentaryMarkdown
                            content={commentaryBodyText}
                            emptyMessage={
                                <div className="border-l border-gold-border/12 pl-5 font-sans text-[15px] leading-8 text-text-secondary dark:border-dark-border/45 dark:text-dark-text-secondary sm:text-[16px]">
                                    No commentary is available for this verse.
                                </div>
                            }
                        />
                    </div>
                ) : learningComicImageUrl ? (
                    <div className="overflow-hidden rounded-[1.75rem] border border-gold-border/12 bg-[#fbf7ef] p-1 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.28)] dark:border-dark-border/50 dark:bg-[#191714]">
                        <img
                            src={learningComicImageUrl}
                            alt={`Learning comic ${chapterNum}.${verseNum}`}
                            className="block h-auto w-full rounded-[1.15rem] object-contain"
                            loading="lazy"
                        />
                    </div>
                ) : (
                    <div className="space-y-3 rounded-[1.5rem] border border-gold-border/12 bg-shell-main/85 p-5 text-sm leading-7 text-text-secondary dark:border-dark-border/45 dark:bg-shell-main-dark/85 dark:text-dark-text-secondary sm:p-6">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-primary/70 dark:text-gold-light/70">
                            Learning comic
                        </p>
                        <p>This chapter does not have a comic panel yet.</p>
                    </div>
                )}
            </VersePanelCard>
        </section>
    );
};

const VerseView = () => {
    const { chapterNum, verseNum } = useParams<{ chapterNum: string; verseNum: string }>();
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement>(null);
    const { activeVerseContentMode } = useUI();
    const isCommentaryMode = activeVerseContentMode === 'commentary';

    const { allChapters, loading, error, getVerseInRange, chapters } = useYogaData();

    const {
        isPlaying,
        currentTime,
        duration,
        togglePlay,
        handleTimeUpdate,
        handleLoadedMetadata,
        handleAudioEnded,
        reset,
        seek,
        formatTime,
        progressPercent,
        playbackError,
    } = useAudio(audioRef);

    useEffect(() => {
        if (!chapterNum || !verseNum || !allChapters) {
            return;
        }

        const verseData = getVerseInRange(chapterNum, verseNum);
        if (verseData) {
            const actualNum = verseData.verse ?? verseData.id.split('.')[1];
            if (String(actualNum) !== String(verseNum)) {
                navigate(`/chapter/${chapterNum}/verse/${actualNum}`, { replace: true });
            }
        }
    }, [chapterNum, verseNum, allChapters, getVerseInRange, navigate]);

    useEffect(() => {
        const scrollContainer = document.getElementById('main-scroll-container');
        if (scrollContainer) {
            scrollContainer.scrollTo(0, 0);
        }
        reset();
    }, [chapterNum, verseNum, reset]);

    useEffect(() => {
        const scrollContainer = document.getElementById('main-scroll-container');
        if (scrollContainer) {
            scrollContainer.scrollTo(0, 0);
        }
    }, [isCommentaryMode]);

    const verseData = chapterNum && verseNum ? getVerseInRange(chapterNum, verseNum) : null;
    const currentChapter = allChapters && chapterNum ? allChapters[Number.parseInt(chapterNum, 10)] : null;
    const currentIndex = currentChapter && verseData ? currentChapter.sutras.findIndex((sutra) => sutra.id === verseData.id) : -1;
    const { handlePrev, handleNext } = useSutraNavigation(allChapters, chapterNum, currentIndex);
    const firstChapterNumber = chapters[0]?.chapter ?? 1;
    const lastChapterNumber = chapters[chapters.length - 1]?.chapter ?? firstChapterNumber;
    const currentChapterNumber = currentChapter?.chapter ?? null;
    const currentChapterLength = currentChapter?.sutras.length ?? 0;
    const isFirstVerse = currentChapterNumber !== null && currentChapterNumber === firstChapterNumber && currentIndex === 0;
    const isLastVerse = currentChapterNumber !== null && currentChapterNumber === lastChapterNumber && currentIndex === currentChapterLength - 1;

    if (error) {
        return (
            <div className="flex min-h-full items-center justify-center px-6">
                <div className="max-w-lg text-center">
                    <h1 className="mb-3 font-display text-2xl text-text-primary dark:text-dark-text-primary">Unable to load this verse</h1>
                    <p className="text-sm leading-relaxed text-text-secondary dark:text-dark-text-secondary">{error}</p>
                </div>
            </div>
        );
    }

    if (loading || !allChapters || !chapterNum || !verseNum) {
        return (
            <div className="flex min-h-full items-center justify-center bg-gold-bg dark:bg-dark-bg">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold-primary border-t-transparent" />
            </div>
        );
    }

    if (!verseData || !currentChapter) {
        return null;
    }

    const verseNumber = verseData.verse ?? verseData.id.split('.')[1];
    const audioSrc = verseData.audio ?? null;
    const hasAudio = Boolean(audioSrc);
    const verseNavigationControls =
        currentIndex >= 0 ? (
            <SutraNavigation onPrev={handlePrev} onNext={handleNext} isPrevDisabled={isFirstVerse} isNextDisabled={isLastVerse} />
        ) : null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${chapterNum}-${verseNum}`}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={containerVariants}
                className="min-h-full flex flex-col justify-start py-4 text-text-primary transition-colors duration-500 dark:text-dark-text-primary sm:py-6 lg:justify-start"
            >
                <div className="mx-auto flex w-full flex-col gap-5 px-4 sm:gap-7 sm:px-6 lg:px-8">
                    {isCommentaryMode && (
                        <MobileVerseGuide
                            chapterNum={chapterNum ?? ''}
                            verseNum={verseNum ?? ''}
                            koreanText={verseData.translation_ham ?? undefined}
                        />
                    )}
                    {!isCommentaryMode ? (
                        <motion.div variants={itemVariants}>
                            <div className="relative mx-auto w-full overflow-visible px-0">
                                <VersePanelCard label="VERSE" navigationControls={verseNavigationControls} contentClassName="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
                                    <div className="space-y-5 sm:space-y-6">
                                        <motion.div variants={itemVariants}>
                                            <SutraContent sanskrit={verseData.sanskrit} pronunciation={verseData.iast ?? verseData.pronunciation} pronunciationKr={verseData.pronunciation_kr} />
                                        </motion.div>

                                        <motion.div variants={itemVariants}>
                                            <WordMeanings meanings={verseData.word_meanings} />
                                        </motion.div>

                                        {hasAudio ? (
                                            <>
                                                <audio
                                                    ref={audioRef}
                                                    src={audioSrc ?? undefined}
                                                    onTimeUpdate={handleTimeUpdate}
                                                    onLoadedMetadata={handleLoadedMetadata}
                                                    onEnded={handleAudioEnded}
                                                    className="hidden"
                                                />

                                                <motion.div variants={itemVariants}>
                                                    <AudioPlayer
                                                        isPlaying={isPlaying}
                                                        togglePlay={togglePlay}
                                                        currentTime={currentTime}
                                                        duration={duration}
                                                        progressPercent={progressPercent}
                                                        formatTime={formatTime}
                                                        onSeek={seek}
                                                        playbackError={playbackError}
                                                    />
                                                </motion.div>
                                            </>
                                        ) : null}

                                        <motion.div variants={itemVariants}>
                                            <TranslationSection
                                                english={verseData.translation_en}
                                                ham={verseData.translation_ham ?? verseData['3.korean-1']}
                                                gil={verseData.translation_gil ?? verseData['8. ox']}
                                                jimong={verseData.translation_jimong}
                                                suk={verseData.translation_suk ?? verseData['6.bae_uu'] ?? verseData['9. ox-en']}
                                            />
                                        </motion.div>
                                    </div>
                                </VersePanelCard>
                            </div>
                        </motion.div>
                    ) : null}

                    {isCommentaryMode ? (
                        <motion.div variants={itemVariants}>
                            <div className="relative mx-auto w-full overflow-visible px-0">
                                <CommentaryContent
                                    chapterNum={String(currentChapter.chapter)}
                                    verseNum={String(verseNumber)}
                                    commentaryText={verseData.commentary_en}
                                    fallbackTitle={verseData.translation_en ?? null}
                                    navigationControls={verseNavigationControls}
                                />
                            </div>
                        </motion.div>
                    ) : null}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VerseView;



