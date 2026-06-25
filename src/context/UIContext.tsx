import { createContext, useContext, useEffect, useState, useCallback, ReactNode, Dispatch, SetStateAction } from 'react';

interface UIContextType {
    isSidebarOpen: boolean;
    setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
    isDesktopSidebarOpen: boolean;
    toggleSidebar: () => void;
    closeAllDrawers: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
    children: ReactNode;
}

export const UIProvider = ({ children }: UIProviderProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            if (window.innerWidth >= 1024) {
                return true;
            }
            const saved = localStorage.getItem('yoga-desktop-sidebar');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsDesktopSidebarOpen(true);
                setIsSidebarOpen(false);
                localStorage.setItem('yoga-desktop-sidebar', 'true');
                return;
            }

            setIsSidebarOpen(false);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isDesktopSidebarOpen]);

    const toggleSidebar = useCallback(() => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen((prev) => !prev);
            return;
        }

        if (!isDesktopSidebarOpen) {
            setIsDesktopSidebarOpen(true);
            localStorage.setItem('yoga-desktop-sidebar', 'true');
        }
    }, [isDesktopSidebarOpen]);

    const closeAllDrawers = useCallback(() => {
        setIsSidebarOpen(false);
    }, []);

    return (
        <UIContext.Provider
            value={{
                isSidebarOpen,
                setIsSidebarOpen,
                isDesktopSidebarOpen,
                toggleSidebar,
                closeAllDrawers,
            }}
        >
            {children}
        </UIContext.Provider>
    );
};

export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
