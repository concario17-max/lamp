import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { YogaChapter, YogaSutra } from '../types';
import { fetchYogaData } from '../utils/dataFetcher';
import { getChapterArray, getVerseInRangeFromChapters, getVerseRangeText } from '../utils/yogaData';

interface YogaDataContextValue {
    allChapters: Record<number, YogaChapter> | null;
    chapters: YogaChapter[];
    loading: boolean;
    error: string | null;
    getVerseInRange: (chapterNum: string, verseNum: string) => YogaSutra | null;
    getVerseRangeLabel: (chapter: YogaChapter, sutra: YogaSutra) => string;
}

const YogaDataContext = createContext<YogaDataContextValue | undefined>(undefined);

interface YogaDataProviderProps {
    children: ReactNode;
}

export const YogaDataProvider = ({ children }: YogaDataProviderProps) => {
    const [allChapters, setAllChapters] = useState<Record<number, YogaChapter> | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetchYogaData()
            .then((data) => {
                if (cancelled) {
                    return;
                }

                setAllChapters(data);
                setError(null);
                setLoading(false);
            })
            .catch(() => {
                if (cancelled) {
                    return;
                }

                setAllChapters(null);
                setError('Unable to load Three Bodies reading data.');
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const value = useMemo<YogaDataContextValue>(
        () => ({
            allChapters,
            chapters: getChapterArray(allChapters),
            loading,
            error,
            getVerseInRange: (chapterNum: string, verseNum: string) => getVerseInRangeFromChapters(allChapters, chapterNum, verseNum),
            getVerseRangeLabel: (chapter: YogaChapter, sutra: YogaSutra) => getVerseRangeText(chapter, sutra),
        }),
        [allChapters, error, loading],
    );

    return <YogaDataContext.Provider value={value}>{children}</YogaDataContext.Provider>;
};

export const useYogaDataContext = (): YogaDataContextValue => {
    const context = useContext(YogaDataContext);
    if (!context) {
        throw new Error('useYogaDataContext must be used within a YogaDataProvider');
    }

    return context;
};
