import { useNavigate } from 'react-router-dom';
import { YogaChapter } from '../types';
import { getNextSutraTarget, getPreviousSutraTarget } from '../utils/sutraNavigation';

export const useSutraNavigation = (
    allChapters: Record<number, YogaChapter> | null,
    chapterNum: string | undefined,
    currentIndex: number,
) => {
    const navigate = useNavigate();

    const handlePrev = () => {
        const previous = getPreviousSutraTarget(allChapters, chapterNum, currentIndex);
        if (previous) {
            navigate(`/chapter/${previous.chapter}/verse/${previous.verse}`);
        }
    };

    const handleNext = () => {
        const next = getNextSutraTarget(allChapters, chapterNum, currentIndex);
        if (next) {
            navigate(`/chapter/${next.chapter}/verse/${next.verse}`);
        }
    };

    return { handlePrev, handleNext };
};
