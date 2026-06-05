import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
    visible: {
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
};

export interface NavItemType {
    id: string;
    label: string | React.ReactNode;
    href: string;
    isActive?: boolean;
    description?: string;
}

export interface NavGroupType {
    id: string | number;
    title: string | React.ReactNode;
    subtitle?: string;
    badge?: string | number;
    isExpanded: boolean;
    onToggle: () => void;
    items: NavItemType[];
}

interface SidebarMenuProps {
    groups: NavGroupType[];
    onItemClick: () => void;
    groupTitle?: string;
}

export const SidebarMenu = React.memo(({ groups, onItemClick, groupTitle }: SidebarMenuProps) => {
    const expandedGroup = groups.find((group) => group.isExpanded);

    return (
        <>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="custom-scrollbar h-[30%] shrink-0 overflow-y-auto border-b border-gold-border/20 overscroll-contain dark:border-[#222]"
            >
                {groupTitle && (
                    <div className="sticky top-0 z-10 hidden bg-transparent p-4 backdrop-blur-sm lg:block">
                        <h2 className="text-xs font-bold text-text-primary/70 dark:text-dark-text-primary/70">{groupTitle}</h2>
                    </div>
                )}

                <div className="space-y-1 px-2 py-2 sm:space-y-0.5 sm:py-1">
                    {groups.map((group) => (
                        <motion.button
                            type="button"
                            variants={itemVariants}
                            key={group.id}
                            onClick={group.onToggle}
                            className={`flex w-full items-start justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors active:scale-[0.98] sm:gap-1.5 sm:rounded-lg sm:px-2 sm:py-1.5 ${
                                group.isExpanded
                                    ? 'border-gold-primary/20 bg-white/60 text-[#1C2B36] shadow-sm dark:bg-dark-bg/60 dark:text-gold-light'
                                    : 'border-transparent text-[#5B7282] hover:bg-gold-surface/40 dark:text-dark-text-secondary dark:hover:bg-dark-bg/40'
                            }`}
                        >
                            <div className="flex flex-1 flex-col pr-1">
                                <span className={`break-keep text-[15px] leading-snug sm:text-[13px] ${group.isExpanded ? 'font-semibold text-[#1C2B36]' : 'font-semibold'}`}>
                                    {group.title}
                                </span>
                                {group.subtitle && (
                                    <span
                                        className={`mt-0.5 break-keep text-[12px] sm:mt-0 sm:text-[11.5px] ${
                                            group.isExpanded ? 'font-medium text-[#1C2B36] opacity-50' : 'font-medium opacity-60'
                                        }`}
                                    >
                                        {group.subtitle}
                                    </span>
                                )}
                            </div>
                            {group.badge && (
                                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold text-[#A68B5C] ${group.isExpanded ? 'opacity-100' : 'opacity-70'}`}>
                                    {group.badge}
                                </span>
                            )}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            <div className="custom-scrollbar flex-1 overflow-y-auto bg-transparent overscroll-contain">
                <div className="space-y-0.5 px-2 py-2 sm:space-y-0 sm:py-1">
                    {expandedGroup ? (
                        expandedGroup.items.map((item) => (
                            <NavLink
                                key={item.id}
                                to={item.href}
                                onClick={onItemClick}
                                className={({ isActive }) =>
                                    `flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all sm:rounded-lg sm:px-2 sm:py-1.5 ${
                                        isActive || item.isActive
                                            ? 'border-gold-primary/30 bg-white/60 font-medium text-text-primary shadow-sm dark:border-gold-primary/20 dark:bg-dark-bg/60 dark:text-gold-light'
                                            : 'border-transparent text-text-secondary hover:bg-gold-surface/30 hover:text-text-primary dark:text-dark-text-secondary dark:hover:bg-dark-bg/40'
                                    }`
                                }
                            >
                                <span
                                    className={`mt-[2px] min-w-[46px] whitespace-nowrap text-[13px] font-bold sm:min-w-[45px] sm:text-[13px] ${
                                        item.isActive ? 'text-gold-primary' : 'text-text-secondary/60 dark:text-dark-text-secondary/60'
                                    }`}
                                >
                                    {item.label}
                                </span>
                                {item.description && <span className="line-clamp-1 text-[14px] leading-relaxed opacity-90 sm:text-[13px]">{item.description}</span>}
                            </NavLink>
                        ))
                    ) : (
                        <div className="p-8 text-center text-sm text-text-secondary dark:text-dark-text-secondary">챕터를 선택해 주세요.</div>
                    )}
                </div>
            </div>
        </>
    );
});
