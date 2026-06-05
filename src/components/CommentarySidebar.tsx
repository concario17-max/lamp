import { useParams } from 'react-router-dom';
import { SquareArrowOutUpRight } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useYogaData } from '../hooks/useYogaData';
import { SidebarLayout } from './ui/SidebarLayout';
import { CommentaryMarkdown } from './commentary/CommentaryMarkdown';

const extractCommentaryTitle = (content?: string | null) => {
    if (!content) {
        return null;
    }

    const headingMatch = content.match(/^#\s+(.+?)(?:\r?\n|$)/m);
    return headingMatch?.[1]?.trim() ?? null;
};

const CommentarySidebar = () => {
    const { chapterNum, verseNum } = useParams<{ chapterNum: string; verseNum: string }>();
    const { activeRightPanel, setActiveRightPanel, activeDesktopRightPanel } = useUI();
    const { getVerseInRange } = useYogaData();

    if (!chapterNum || !verseNum) {
        return null;
    }

    const isOpen = activeRightPanel === 'commentary';
    const isDesktopOpen = activeDesktopRightPanel === 'commentary';
    const verseData = getVerseInRange(chapterNum, verseNum);
    const commentaryTitle = extractCommentaryTitle(verseData?.commentary_en);

    return (
        <SidebarLayout
            isOpen={isOpen}
            isDesktopOpen={isDesktopOpen}
            onClose={() => setActiveRightPanel(null)}
            title="Commentary"
            position="right"
            widthClass="w-[min(90vw,52rem)]"
            desktopWidthClass="lg:w-full"
        >
            <div className="relative flex h-full min-h-0 flex-col p-3">
                <div className="mb-4 flex shrink-0 items-center gap-2.5 border-b border-gold-border/10 pb-3 dark:border-dark-border/45">
                    <span className="inline-flex items-center rounded-full bg-gold-soft/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-gold-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:bg-gold-soft/20 dark:text-gold-light">
                        Commentary
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-gold-border/50 via-gold-border/20 to-transparent dark:from-dark-border/60 dark:via-dark-border/25" />
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold-border/45 bg-shell-main/92 text-gold-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-dark-border/60 dark:bg-dark-surface/92 dark:text-gold-light">
                        <SquareArrowOutUpRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                </div>

                <div className="mb-3 flex items-baseline gap-2 overflow-hidden text-xs font-semibold tracking-[0.16em] text-text-secondary/65 dark:text-dark-text-secondary/65">
                    <span className="shrink-0 whitespace-nowrap">
                        {chapterNum}.{verseNum}
                    </span>
                    <span className="min-w-0 truncate text-base font-semibold tracking-normal text-text-primary dark:text-dark-text-primary">
                        {commentaryTitle ?? verseData?.translation_en?.slice(0, 50) ?? ''}
                    </span>
                </div>

                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-10 pr-2">
                    {verseData?.commentary_en ? (
                        <div className="space-y-4">
                            <CommentaryMarkdown content={verseData.commentary_en} />
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-center text-sm text-text-secondary dark:text-dark-text-secondary">
                            <div className="space-y-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-primary/65 dark:text-gold-light/65">
                                    No commentary
                                </p>
                                <p>Commentary is not available for this verse.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SidebarLayout>
    );
};

export default CommentarySidebar;
