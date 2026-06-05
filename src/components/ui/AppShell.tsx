import React, { ReactNode } from 'react';

export interface AppShellProps {
    header?: ReactNode;
    sidebar?: ReactNode;
    rightPanel?: ReactNode;
    floatingAction?: ReactNode;
    children: ReactNode;
    isMobilePanelOpen?: boolean;
    desktopGridColumns?: string;
}

export const AppShell = React.memo(
    ({ header, sidebar, rightPanel, floatingAction, children, isMobilePanelOpen = false, desktopGridColumns }: AppShellProps) => {
        const desktopGridStyle = desktopGridColumns
            ? ({ '--desktop-verse-columns': desktopGridColumns } as React.CSSProperties)
            : undefined;
        void isMobilePanelOpen;

        return (
            <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-shell-canvas text-text-primary transition-colors duration-500 selection:bg-gold-primary/25 selection:text-text-primary dark:bg-shell-canvas-dark dark:text-dark-text-primary dark:selection:text-dark-text-primary">
                <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(255,252,247,0.68)_0%,_rgba(255,248,239,0.2)_34%,_transparent_74%),linear-gradient(180deg,rgba(255,255,255,0.12)_0%,transparent_18%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04)_0%,_rgba(255,255,255,0.01)_34%,_transparent_74%),linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_18%)]" />

                <div className="relative z-10 flex min-h-0 flex-1 justify-center">
                    <div className="flex min-h-0 w-full max-w-[1406px] flex-1 flex-col overflow-hidden bg-shell-main dark:bg-shell-main-dark sm:rounded-none sm:border sm:border-gold-border/10 sm:shadow-[0_20px_50px_-42px_rgba(0,0,0,0.28)] dark:sm:border-dark-border/50">
                        <div className="shrink-0 bg-shell-header dark:bg-shell-header-dark">{header}</div>
                        <div
                            className={`relative flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent ${
                                desktopGridColumns ? 'lg:grid lg:[grid-template-columns:var(--desktop-verse-columns)]' : 'lg:flex-row'
                            } ${desktopGridColumns ? 'lg:gap-0' : ''}`}
                            style={desktopGridStyle}
                        >
                            {sidebar}
                            <main
                                id="main-scroll-container"
                                className={`custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto bg-shell-main backdrop-blur-0 dark:bg-shell-main-dark ${
                                    desktopGridColumns ? 'lg:col-start-2 lg:w-full' : ''
                                }`}
                            >
                                {children}
                            </main>
                            {rightPanel}
                        </div>
                    </div>

                    {floatingAction && <div className="fixed bottom-6 right-6 z-50 sm:bottom-8 sm:right-8">{floatingAction}</div>}
                </div>
            </div>
        );
    },
);
