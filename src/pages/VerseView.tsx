import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useYogaData } from '../hooks/useYogaData';
import { useAudio } from '../hooks/useAudio';
import { SutraContent } from '../components/verse/SutraContent';
import { AudioPlayer } from '../components/verse/AudioPlayer';
import { TranslationSection } from '../components/verse/TranslationSection';
import { WordMeanings } from '../components/verse/WordMeanings';
import { SutraNavigation } from '../components/verse/SutraNavigation';
import { VersePanelCard } from '../components/verse/VersePanelCard';
import { useSutraNavigation } from '../hooks/useSutraNavigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';

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

const VerseView = () => {
    const { chapterNum, verseNum } = useParams<{ chapterNum: string; verseNum: string }>();
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement>(null);

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
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VerseView;



