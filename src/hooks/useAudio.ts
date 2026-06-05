import { RefObject, useCallback, useState } from 'react';

interface UseAudioResult {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playbackError: string | null;
    togglePlay: () => Promise<void>;
    handleTimeUpdate: () => void;
    handleLoadedMetadata: () => void;
    handleAudioEnded: () => void;
    reset: () => void;
    seek: (percentage: number) => void;
    formatTime: (time: number) => string;
    progressPercent: number;
}

export const useAudio = (audioRef: RefObject<HTMLAudioElement | null>): UseAudioResult => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [playbackError, setPlaybackError] = useState<string | null>(null);

    const togglePlay = useCallback(async () => {
        const element = audioRef.current;
        if (!element) {
            return;
        }

        if (isPlaying) {
            element.pause();
            setIsPlaying(false);
            return;
        }

        try {
            await element.play();
            setPlaybackError(null);
            setIsPlaying(true);
        } catch {
            setPlaybackError('Audio playback is unavailable for this sutra.');
            setIsPlaying(false);
        }
    }, [audioRef, isPlaying]);

    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    }, [audioRef]);

    const handleLoadedMetadata = useCallback(() => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            setPlaybackError(null);
        }
    }, [audioRef]);

    const handleAudioEnded = useCallback(() => {
        setIsPlaying(false);
        setCurrentTime(0);
    }, []);

    const reset = useCallback(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setPlaybackError(null);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [audioRef]);

    const seek = useCallback(
        (percentage: number) => {
            if (audioRef.current && duration > 0) {
                const nextTime = Math.max(0, Math.min(percentage, 1)) * duration;
                audioRef.current.currentTime = nextTime;
                setCurrentTime(nextTime);
            }
        },
        [audioRef, duration],
    );

    const formatTime = useCallback((time: number) => {
        if (Number.isNaN(time)) {
            return '0:00';
        }

        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    return {
        isPlaying,
        currentTime,
        duration,
        playbackError,
        togglePlay,
        handleTimeUpdate,
        handleLoadedMetadata,
        handleAudioEnded,
        reset,
        seek,
        formatTime,
        progressPercent: duration > 0 ? (currentTime / duration) * 100 : 0,
    };
};
