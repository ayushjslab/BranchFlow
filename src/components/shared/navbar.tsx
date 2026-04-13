"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ModeToggle } from "./mode-toggle";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut, User, Menu, X, ChevronRight } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "@/store/useProjectStore";

const Navbar = () => {
    const pathname = usePathname();
    const { data: session, isPending } = authClient.useSession();
    const { selectedProject } = useProjectStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Handle scroll effect for glassmorphism
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems = [
        { label: "Home", href: "/" },
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/#pricing" },
    ];

    const handleSignOut = async () => {
        await authClient.signOut();
        window.location.reload();
    };

    return (
        <nav
            className={cn(
                "fixed top-0 z-50 w-full transition-all duration-300 ease-in-out",
                isScrolled
                    ? "border-b border-primary/10 bg-background/70 backdrop-blur-xl py-2"
                    : "bg-transparent py-4"
            )}
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex h-14 items-center justify-between">
                    {/* Brand Logo */}
                    <Link href="/" className="group flex items-center gap-2.5">
                        <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary shadow-lg transition-transform group-hover:scale-110">
                            <LayoutDashboard className="z-10 h-6 w-6 text-primary-foreground" />
                            <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                BranchFlow
                            </span>
                            {selectedProject && (
                                <span className="text-[10px] font-medium text-primary uppercase tracking-widest -mt-1">
                                    {selectedProject.name}
                                </span>
                            )}
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1 rounded-full border border-primary/5 bg-muted/50 p-1 backdrop-blur-md">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "relative px-4 py-2 text-sm font-medium transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 rounded-full bg-background shadow-sm"
                                            transition={{ type: "spring", duration: 0.5 }}
                                        />
                                    )}
                                    <span className="relative z-10">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block">
                            <ModeToggle />
                        </div>

                        {!isPending && (
                            <>
                                {session ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-9 w-9 rounded-full border border-primary/10 p-0 hover:ring-2 hover:ring-primary/20 transition-all">
                                                <Avatar className="h-full w-full">
                                                    <AvatarImage src={session.user.image || ""} alt={session.user.name} />
                                                    <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                                                        {session.user.name?.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-60 mt-2 p-2">
                                            <div className="flex items-center gap-3 p-2 pb-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={session.user.image || ""} />
                                                    <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col space-y-0.5">
                                                    <p className="text-sm font-semibold">{session.user.name}</p>
                                                    <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">{session.user.email}</p>
                                                </div>
                                            </div>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2">
                                                <Link href="/dashboard" className="flex w-full items-center">
                                                    <LayoutDashboard className="mr-2 h-4 w-4 opacity-70" />
                                                    Dashboard
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2">
                                                <Link href="/profile" className="flex w-full items-center">
                                                    <User className="mr-2 h-4 w-4 opacity-70" />
                                                    Profile Settings
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={handleSignOut}
                                                className="cursor-pointer rounded-lg py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                                            >
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Log out
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <Button asChild size="sm" className="hidden md:flex rounded-full bg-primary px-5 font-semibold hover:opacity-90">
                                        <Link href="/signin">Sign In</Link>
                                    </Button>
                                )}
                            </>
                        )}

                        {/* Mobile Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden rounded-full"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-primary/5 bg-background/95 backdrop-blur-2xl md:hidden"
                    >
                        <div className="flex flex-col space-y-4 p-6">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-between text-lg font-medium text-muted-foreground hover:text-primary"
                                >
                                    {item.label}
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            ))}
                            {!session && (
                                <Button asChild className="w-full rounded-xl py-6 text-base">
                                    <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                                        Get Started
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;