import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { WordMeaning } from '../../types';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface WordMeaningsProps {
    meanings?: WordMeaning;
}

const formatMeaning = (meaning: string) => {
    const etymologySeparator = ' < ';
    const separatorIndex = meaning.indexOf(etymologySeparator);

    if (separatorIndex === -1) {
        return meaning;
    }

    return meaning.slice(0, separatorIndex).trim();
};

const containerVariants: Variants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: 'auto',
        transition: {
            height: { duration: 0.45, ease: [0.2, 0, 0, 1] },
            opacity: { duration: 0.25 },
            staggerChildren: 0.04,
            delayChildren: 0.08,
        },
    },
    exit: {
        opacity: 0,
        height: 0,
        transition: {
            height: { duration: 0.35, ease: [0.2, 0, 0, 1] },
            opacity: { duration: 0.2 },
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: 'easeOut' },
    },
};

export const WordMeanings = ({ meanings }: WordMeaningsProps) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!meanings || meanings.length === 0) return null;

    return (
        <section className="mx-auto w-full px-4 sm:px-6 lg:px-8">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between gap-3 border-t border-gold-border/10 pt-4 text-left dark:border-dark-border/45"
            >
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-gold-primary/70 dark:text-gold-light/70">
                        Word meanings
                    </p>
                </div>

                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-gold-primary dark:text-gold-light"
                >
                    <ChevronDown className="h-4 w-4" />
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen ? (
                    <motion.div initial="hidden" animate="visible" exit="exit" variants={containerVariants} className="overflow-hidden">
                        <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {meanings.map(({ word, meaning }, index: number) => (
                                <motion.div key={`${word}-${index}`} variants={itemVariants} className="border-l border-gold-border/10 pl-4 dark:border-dark-border/45">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-display text-[16px] italic text-gold-primary dark:text-gold-light">
                                            {word}
                                        </span>
                                        <span className="break-keep font-sans text-[13px] leading-7 text-text-secondary dark:text-dark-text-secondary sm:text-[14px]">
                                            {formatMeaning(meaning)}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </section>
    );
};
