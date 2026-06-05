import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import { useYogaData } from '../hooks/useYogaData';
import { SidebarLayout } from './ui/SidebarLayout';

const Sidebar = () => {
    const { chapterNum, verseNum } = useParams<{ chapterNum: string; verseNum: string }>();
    const { isSidebarOpen, setIsSidebarOpen, isDesktopSidebarOpen } = useUI();
    const { allChapters, loading, getVerseInRange } = useYogaData();
    const [markerReady, setMarkerReady] = useState(false);

    const chapterNumber = chapterNum ? parseInt(chapterNum, 10) : null;
    const currentChapter = chapterNumber ? allChapters?.[chapterNumber] ?? null : null;
    const verseData = chapterNum && verseNum ? getVerseInRange(chapterNum, verseNum) : null;

    const chapterMeta = currentChapter ? String(currentChapter.chapter).padStart(2, '0') : '00';
    const verseMeta = verseNum ? String(parseInt(verseNum, 10)).padStart(2, '0') : '00';

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => setMarkerReady(true));

        return () => window.cancelAnimationFrame(frame);
    }, []);

    if (loading || !currentChapter || !verseData) {
        return (
            <SidebarLayout
                isOpen={isSidebarOpen}
                isDesktopOpen={isDesktopSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                title="Verse Guide"
                position="left"
                widthClass="w-[88vw] max-w-[360px]"
                desktopWidthClass="lg:w-full"
                desktopMinWidthClass="lg:min-w-[22rem]"
            >
                <div className="flex h-full items-center justify-center px-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold-primary border-t-transparent" />
                </div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout
            isOpen={isSidebarOpen}
            isDesktopOpen={isDesktopSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            title="Verse Guide"
            position="left"
            widthClass="w-[90vw] max-w-[380px]"
            desktopWidthClass="lg:w-full"
            desktopMinWidthClass="lg:min-w-[22rem]"
        >
            <div className="custom-scrollbar flex h-full min-h-0 flex-col overflow-y-auto px-4 py-5 pb-7">
                <div className="mx-auto flex w-full max-w-[348px] flex-1 flex-col gap-6 px-2 py-2 transition-colors duration-500 sm:gap-7">
                    <div className="flex justify-center px-1 py-2 sm:px-2 sm:py-3">
                        <div className="relative flex aspect-square w-full max-w-[276px] items-center justify-center transition-colors duration-500">
                            <div className="pointer-events-none absolute inset-x-10 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-black/4 to-transparent dark:via-white/4" />
                            <div className="pointer-events-none absolute inset-y-10 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-black/4 to-transparent dark:via-white/4" />

                            <style>{`
                                @keyframes sidebar-marker-top {
                                    0%, 100% { transform: translateX(0); }
                                    50% { transform: translateX(6px); }
                                }
                                @keyframes sidebar-marker-center {
                                    0%, 100% { transform: translateY(0); }
                                    50% { transform: translateY(-6px); }
                                }
                                @keyframes sidebar-marker-bottom {
                                    0%, 100% { transform: translateX(0); }
                                    50% { transform: translateX(-6px); }
                                }
                                .sidebar-marker-top {
                                    animation: sidebar-marker-top 6.2s ease-in-out infinite;
                                }
                                .sidebar-marker-center {
                                    animation: sidebar-marker-center 7.4s ease-in-out infinite;
                                }
                                .sidebar-marker-bottom {
                                    animation: sidebar-marker-bottom 6.8s ease-in-out infinite;
                                }
                                @media (prefers-reduced-motion: reduce) {
                                    .sidebar-marker-top,
                                    .sidebar-marker-center,
                                    .sidebar-marker-bottom {
                                        animation: none;
                                    }
                                }
                            `}</style>

                            <div className="relative flex h-full w-full flex-col justify-between px-7 py-7 text-center">
                                <div
                                    className={`sidebar-marker-top flex items-start justify-between text-[10px] font-semibold uppercase tracking-[0.38em] text-text-secondary/52 transition-opacity duration-700 ease-out dark:text-dark-text-secondary/58 ${
                                        markerReady ? 'opacity-100' : 'opacity-0'
                                    }`}
                                >
                                    <span>Verse</span>
                                    <span className="text-text-secondary/46 dark:text-dark-text-secondary/54">Axis</span>
                                </div>

                                <div className="flex flex-1 items-center justify-center">
                                    <p
                                        className={`sidebar-marker-center font-display text-[68px] font-semibold leading-none tracking-[0.08em] text-text-primary/96 transition-opacity duration-700 ease-out dark:text-dark-text-primary/96 ${
                                            markerReady ? 'opacity-100' : 'opacity-0'
                                        }`}
                                    >
                                        {verseMeta}
                                    </p>
                                </div>

                                <div
                                    className={`sidebar-marker-bottom flex items-end justify-between transition-opacity duration-700 ease-out ${
                                        markerReady ? 'opacity-100' : 'opacity-0'
                                    }`}
                                >
                                    <div className="flex flex-col items-start gap-1 text-left">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-text-secondary/52 dark:text-dark-text-secondary/58">
                                            Chapter
                                        </p>
                                        <span className="h-px w-12 bg-gradient-to-r from-black/8 to-transparent dark:from-white/10" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-display text-[36px] font-semibold leading-none tracking-[0.1em] text-text-primary/96 dark:text-dark-text-primary/96">
                                            {chapterMeta}
                                        </span>
                                        <span className="h-2.5 w-2.5 rounded-full bg-black/16 shadow-[0_0_0_1px_rgba(0,0,0,0.05)] dark:bg-white/14 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <section className="space-y-2 border-l border-black/5 pl-4 dark:border-white/7">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-text-secondary/52 dark:text-dark-text-secondary/60">
                                Korean
                            </p>
                            <p className="whitespace-pre-line break-keep font-sans text-[15px] leading-[2] text-text-secondary/92 dark:text-dark-text-secondary/92 sm:text-[16px]">
                                {verseData.translation_ham ?? verseData['5.bae_jik'] ?? ''}
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
};

export default Sidebar;

