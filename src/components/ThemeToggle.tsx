import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
    className?: string;
}

const ThemeToggle = ({ className = '' }: ThemeToggleProps) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`rounded-full p-2 text-gold-primary transition-all duration-300 hover:bg-gold-surface dark:hover:bg-dark-surface ${className}`}
            aria-label="Toggle theme"
            title="Toggle theme"
        >
            {theme === 'dark' ? <Sun className="h-4 w-4 opacity-80 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 opacity-80 sm:h-5 sm:w-5" />}
        </button>
    );
};

export default ThemeToggle;
