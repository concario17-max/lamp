import React from 'react';

interface LexiconWord {
    word: string;
    meaning: string;
}

interface LexiconAlphabetProps {
    alphabet: string[];
    lexiconData: Record<string, LexiconWord[]>;
    onLetterClick: (letter: string) => void;
}

const LexiconAlphabet = ({ alphabet, lexiconData, onLetterClick }: LexiconAlphabetProps) => {
    return (
        <div className="mb-12 flex flex-wrap gap-2">
            {alphabet.map((letter) => {
                const hasWords = Boolean(lexiconData[letter] && lexiconData[letter].length > 0);

                return (
                    <button
                        type="button"
                        key={letter}
                        onClick={() => hasWords && onLetterClick(letter)}
                        disabled={!hasWords}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-[13px] transition-all duration-300 ${
                            hasWords
                                ? 'cursor-pointer border-gold-border/30 bg-gold-bg text-gold-primary shadow-sm hover:scale-110 hover:border-gold-primary hover:shadow-md dark:bg-dark-bg'
                                : 'cursor-not-allowed border-transparent bg-transparent text-gold-primary/20 opacity-50'
                        }`}
                    >
                        {letter}
                    </button>
                );
            })}
        </div>
    );
};

export default React.memo(LexiconAlphabet);
