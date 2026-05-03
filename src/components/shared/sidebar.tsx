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
    HiOutlineMenuAlt2,
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
            { title: "Join Project", href: "/project/join", icon: FaRegHandshake },
            { title: "Create Project", href: "/project/create", icon: TbCubePlus },
        ],
    },
    {
        title: "Work",
        icon: IoCodeWorkingOutline,
        items: [
            { title: "Assigned", href: "/work/assigned", icon: CgAssign },
            { title: "Tasks", href: "/work/tasks", icon: FaTasks },
            { title: "Bugs", href: "/work/bugs", icon: LuBug },
            { title: "Features", href: "/work/features", icon: SiSparkpost },
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
    },
];

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    isHidden?: boolean;
    setIsHidden?: (hidden: boolean) => void;
}

// ─── Shared Nav Body ────────────────────────────────────────────────────────
// `collapsed` controls whether to hide labels (used only in sticky mode)
function NavBody({
    collapsed,
    openSubmenu,
    setOpenSubmenu,
    disableCollapse,
    onLinkClick,
}: {
    collapsed: boolean;
    openSubmenu: string | null;
    setOpenSubmenu: (v: string | null) => void;
    disableCollapse?: boolean;   // overlay always treats as expanded
    onLinkClick?: () => void;
}) {
    const pathname = usePathname();
    const expanded = disableCollapse || !collapsed;

    const toggleSubmenu = (title: string) => {
        setOpenSubmenu(openSubmenu === title ? null : title);
    };

    return (
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
                                title={!expanded ? item.title : undefined}
                                onClick={onLinkClick}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "text-xl shrink-0 transition-transform group-hover:scale-110",
                                        isActive ? "text-primary-foreground" : "text-foreground/60"
                                    )}
                                />
                                {expanded && (
                                    <span className="font-semibold text-sm truncate">
                                        {item.title}
                                    </span>
                                )}
                            </Link>
                        ) : (
                            <>
                                <button
                                    onClick={() => toggleSubmenu(item.title)}
                                    title={!expanded ? item.title : undefined}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "text-primary bg-primary/8"
                                            : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "text-xl shrink-0 transition-transform group-hover:scale-110",
                                            isActive ? "text-primary" : "text-foreground/60"
                                        )}
                                    />
                                    {expanded && (
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
                                    {isSubmenuOpen && expanded && (
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
                                                    onClick={onLinkClick}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors group/sub",
                                                        pathname === sub.href
                                                            ? "text-primary font-bold bg-primary/8"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                                                    )}
                                                >
                                                    <sub.icon
                                                        className={cn(
                                                            "text-base shrink-0 transition-transform group-hover/sub:scale-110",
                                                            pathname === sub.href ? "text-primary" : "text-foreground/50"
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
    );
}

// ─── Main Sidebar Component ──────────────────────────────────────────────────
export const Sidebar = ({
    isOpen,
    setIsOpen,
    isCollapsed,
    setIsCollapsed,
    isHidden,
    setIsHidden,
}: SidebarProps) => {
    const pathname = usePathname();
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

    useEffect(() => {
        navItems.forEach((item) => {
            if (item.items?.some((sub) => pathname.startsWith(sub.href))) {
                setOpenSubmenu(item.title);
            }
        });
    }, [pathname]);

    // ── Sticky sidebar content (respects isCollapsed) ──────────────────────
    const StickySidebarContent = (
        <div className="flex flex-col h-full py-5 bg-sidebar">
            {/* Brand Row */}
            <div
                className={cn(
                    "px-4 mb-6 flex items-center",
                    isCollapsed ? "justify-center" : "justify-between"
                )}
            >
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xl font-black tracking-tighter text-foreground"
                    >
                        BranchFlow
                    </motion.span>
                )}
                <div className="flex items-center gap-1">
                    {/* Switch to floating menu mode */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsHidden?.(true)}
                        title="Switch to menu button mode"
                        className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <HiOutlineMenuAlt2 className="h-4 w-4" />
                    </Button>
                    {/* Collapse / expand */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (isCollapsed) {
                                setIsCollapsed(false);
                            } else {
                                setIsCollapsed(true);
                            }
                        }}
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        {isCollapsed ? (
                            <HiOutlineChevronRight className="h-4 w-4" />
                        ) : (
                            <HiOutlineX className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            <NavBody
                collapsed={isCollapsed}
                openSubmenu={openSubmenu}
                setOpenSubmenu={setOpenSubmenu}
            />

            {/* Footer */}
            <div className="mt-auto px-3 pt-4 border-t border-border/50">
                <Link
                    href="/billing"
                    className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                        pathname === "/billing"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
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

    // ── Overlay sidebar content (always fully expanded, has its own header) ─
    const OverlaySidebarContent = (
        <div className="flex flex-col h-full py-5 bg-sidebar">
            {/* Brand Row */}
            <div className="px-4 mb-6 flex items-center justify-between">
                <span className="text-xl font-black tracking-tighter text-foreground">
                    BranchFlow
                </span>
                <div className="flex items-center gap-1">
                    {/* If in hidden mode on desktop — offer to pin sidebar back */}
                    {isHidden && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setIsHidden?.(false);
                                setIsOpen(false);
                            }}
                            title="Pin sidebar"
                            className="hidden lg:flex h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            <HiOutlineChevronRight className="h-4 w-4 rotate-180" />
                        </Button>
                    )}
                    {/* Close overlay */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                        title="Close menu"
                        className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <HiOutlineX className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Always fully expanded nav */}
            <NavBody
                collapsed={false}
                disableCollapse
                openSubmenu={openSubmenu}
                setOpenSubmenu={setOpenSubmenu}
                onLinkClick={() => setIsOpen(false)}
            />

            {/* Footer */}
            <div className="mt-auto px-3 pt-4 border-t border-border/50">
                <Link
                    href="/billing"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                        pathname === "/billing"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                >
                    <HiOutlineCreditCard className="text-xl shrink-0 group-hover:rotate-12 transition-transform" />
                    <span className="font-bold text-sm">Billing & Plan</span>
                </Link>
            </div>
        </div>
    );

    return (
        <>
            {/* ── STICKY DESKTOP SIDEBAR ───────────────────────────── */}
            {/* Only renders when not in hidden (menu button) mode */}
            {!isHidden && (
                <motion.aside
                    initial={false}
                    animate={{ width: isCollapsed ? 72 : 260 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="hidden lg:flex flex-col shrink-0 h-screen sticky top-0 border-r border-border/60 overflow-hidden"
                >
                    {StickySidebarContent}
                </motion.aside>
            )}

            {/* ── OVERLAY SIDEBAR ──────────────────────────────────── */}
            {/* Used for: mobile always + desktop when isHidden=true   */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                        />
                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            className="fixed inset-y-0 left-0 z-50 w-[270px] border-r border-border/60 shadow-2xl overflow-hidden"
                        >
                            {OverlaySidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};