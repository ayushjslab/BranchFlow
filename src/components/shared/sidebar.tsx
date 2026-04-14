"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    HiOutlineViewGrid,
    HiOutlineUsers,
    HiOutlineCube,
    HiOutlineCreditCard,
    HiOutlineChevronDown,
    HiOutlineChevronRight,
    HiOutlineX,
    HiOutlineAdjustments,
    HiOutlineCog,
    HiOutlineBriefcase,
    HiOutlineCalendar,
} from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { GrSend } from "react-icons/gr";
import { LuBug } from "react-icons/lu";
import { FaTasks } from "react-icons/fa";
import { SiSparkpost } from "react-icons/si";
import { IoCodeWorkingOutline } from "react-icons/io5";
import { CgAssign } from "react-icons/cg";
import { FaRegHandshake } from "react-icons/fa";
import { TbCubePlus } from "react-icons/tb";
import { VscGitPullRequestDone } from "react-icons/vsc";
import { PiPlugs } from "react-icons/pi";

interface NavItem {
    title: string;
    href?: string;
    icon: React.ElementType;
    items?: { title: string; href: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: HiOutlineViewGrid,
    },

    {
        title: "Members",
        icon: HiOutlineUsers,
        items: [
            { title: "Manage", href: "/members/manage", icon: HiOutlineAdjustments },
            { title: "Settings", href: "/members/settings", icon: HiOutlineCog },
        ],
    },

    {
        title: "Project",
        icon: HiOutlineCube,
        items: [
            { title: "Workspace", href: "/project/workspace", icon: HiOutlineBriefcase },
            { title: "Settings", href: "/project/settings", icon: HiOutlineCog },
            { title: "Invite", href: "/project/invite", icon: GrSend },
            {
                title: "Join Project",
                href: "/project/join",
                icon: FaRegHandshake,
            },
            {
                title: "Create Project",
                href: "/project/create",
                icon: TbCubePlus,
            }
        ],
    },
    {
        title: "Work",
        icon: IoCodeWorkingOutline,
        items: [
            { title: "Assigned", href: "/work/assigned", icon: CgAssign },
            { title: "Tasks", href: "/work/tasks", icon: FaTasks },
            {title: "Bugs", href: "/work/bugs", icon: LuBug},
            {title: "Features", href: "/work/features", icon: SiSparkpost},
            { title: "Timeline", href: "/work/timeline", icon: HiOutlineCalendar },
        ],
    },
    {
        title: "Github Sync",
        href: "/github-sync",
        icon: VscGitPullRequestDone,
    },
    {
        title: "Integrations",
        href: "/integrations",
        icon: PiPlugs,
    }
];

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({
    isOpen,
    setIsOpen,
    isCollapsed,
    setIsCollapsed,
}: SidebarProps) => {
    const pathname = usePathname();
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

    const toggleSubmenu = (title: string) => {
        if (isCollapsed) setIsCollapsed(false);
        setOpenSubmenu(openSubmenu === title ? null : title);
    };

    useEffect(() => {
        navItems.forEach((item) => {
            if (item.items?.some((sub) => pathname.startsWith(sub.href))) {
                setOpenSubmenu(item.title);
            }
        });
    }, [pathname]);

    const SidebarContent = (
        <div className="flex flex-col h-full py-5">
            {/* Brand */}
            <div
                className={cn(
                    "px-5 mb-8 flex items-center",
                    isCollapsed ? "justify-center" : "justify-between"
                )}
            >
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xl font-black tracking-tighter bg-linear-to-r from-primary to-accent bg-clip-text text-transparent"
                    >
                        BranchFlow
                    </motion.span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                    {isCollapsed ? (
                        <HiOutlineChevronRight className="h-4 w-4" />
                    ) : (
                        <HiOutlineX className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = item.href
                        ? pathname === item.href
                        : item.items?.some((sub) => pathname.startsWith(sub.href));
                    const isSubmenuOpen = openSubmenu === item.title;

                    return (
                        <div key={item.title}>
                            {item.href ? (
                                <Link
                                    href={item.href}
                                    title={isCollapsed ? item.title : undefined}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                            : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "text-xl shrink-0 transition-transform group-hover:scale-110",
                                            isActive ? "text-white" : "text-primary/70"
                                        )}
                                    />
                                    {!isCollapsed && (
                                        <span className="font-semibold text-sm truncate">
                                            {item.title}
                                        </span>
                                    )}
                                </Link>
                            ) : (
                                <>
                                    <button
                                        onClick={() => toggleSubmenu(item.title)}
                                        title={isCollapsed ? item.title : undefined}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                            isActive
                                                ? "text-primary bg-primary/5"
                                                : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "text-xl shrink-0 transition-transform group-hover:scale-110",
                                                isActive ? "text-primary" : "text-primary/70"
                                            )}
                                        />
                                        {!isCollapsed && (
                                            <>
                                                <span className="flex-1 text-left font-semibold text-sm truncate">
                                                    {item.title}
                                                </span>
                                                <motion.div
                                                    animate={{ rotate: isSubmenuOpen ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <HiOutlineChevronDown className="text-sm opacity-50 shrink-0" />
                                                </motion.div>
                                            </>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isSubmenuOpen && !isCollapsed && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden pl-11 space-y-0.5 mt-0.5"
                                            >
                                                {item.items?.map((sub) => (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors relative group/sub",
                                                            pathname === sub.href
                                                                ? "text-primary font-bold bg-primary/5"
                                                                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                        )}
                                                    >
                                                        <sub.icon
                                                            className={cn(
                                                                "text-base shrink-0 transition-transform group-hover/sub:scale-110",
                                                                pathname === sub.href ? "text-primary" : "text-primary/50"
                                                            )}
                                                        />
                                                        <span>{sub.title}</span>
                                                    </Link>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer Billing */}
            <div className="mt-auto px-3 pt-4 border-t border-primary/5">
                <Link
                    href="/billing"
                    className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                        pathname === "/billing"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                    )}
                >
                    <HiOutlineCreditCard className="text-xl shrink-0 group-hover:rotate-12 transition-transform" />
                    {!isCollapsed && (
                        <span className="font-bold text-sm">Billing & Plan</span>
                    )}
                </Link>
            </div>
        </div>
    );

    return (
        <>
            {/* ── DESKTOP SIDEBAR (in-flow, no fixed) ────────────── */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 72 : 260 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="hidden lg:flex flex-col shrink-0 h-screen sticky top-0 bg-card/50 backdrop-blur-2xl border-r border-primary/10 overflow-hidden"
            >
                {SidebarContent}
            </motion.aside>

            {/* ── MOBILE OVERLAY SIDEBAR (fixed) ─────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                        />
                        {/* Sidebar */}
                        <motion.aside
                            initial={{ x: -260 }}
                            animate={{ x: 0 }}
                            exit={{ x: -260 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-50 w-[260px] bg-card/80 backdrop-blur-2xl border-r border-primary/10 shadow-2xl lg:hidden overflow-hidden"
                        >
                            {SidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};