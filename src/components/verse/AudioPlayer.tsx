import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
    isPlaying: boolean;
    togglePlay: () => Promise<void>;
    currentTime: number;
    duration: number;
    progressPercent: number;
    formatTime: (time: number) => string;
    onSeek: (percentage: number) => void;
    playbackError?: string | null;
}

export const AudioPlayer = ({
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    progressPercent,
    formatTime,
    onSeek,
    playbackError,
}: AudioPlayerProps) => (
    <div className="mx-auto mb-10 flex w-full flex-col items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-gold-primary/20 bg-white/55 px-4 py-3 shadow-sm transition-all hover:border-gold-primary/30 hover:shadow-md dark:border-dark-border/50 dark:bg-[#111]/45 dark:hover:border-gold-primary/25 sm:px-5">
            <button
                type="button"
                onClick={() => {
                    void togglePlay();
                }}
                className="shrink-0 text-gold-primary transition-transform hover:scale-105 dark:text-gold-light"
            >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <span className="ml-2 shrink-0 text-[10px] font-inter font-bold tracking-widest tabular-nums text-text-secondary/55">
                {formatTime(currentTime)}
            </span>

            <div
                className="group relative mx-2 h-2 flex-1 cursor-pointer rounded-full bg-gold-border/30 dark:bg-dark-border"
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    onSeek(x / rect.width);
                }}
            >
                <div
                    className="absolute left-0 top-0 h-full rounded-full bg-[#A68B5C] transition-all"
                    style={{ width: `${progressPercent}%` }}
                />
                <div
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#A68B5C] shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ left: `calc(${progressPercent}% - 4px)` }}
                />
            </div>

            <span className="shrink-0 text-[10px] font-inter font-bold tracking-widest tabular-nums text-text-secondary/55">
                {formatTime(duration)}
            </span>
        </div>
        {playbackError && <p className="text-center text-xs text-gold-primary/80 dark:text-gold-light/80">{playbackError}</p>}
    </div>
);
