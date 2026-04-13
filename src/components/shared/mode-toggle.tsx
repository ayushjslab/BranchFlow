"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Prevent hydration mismatch
    React.useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="h-10 w-10" />;

    const toggleTheme = () => {
        if (theme === "light") setTheme("dark");
        else setTheme("light");
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative h-10 w-10 overflow-hidden rounded-md border border-primary/10 bg-background/50 hover:bg-primary/5 transition-colors cursor-pointer"
        >
            <AnimatePresence mode="wait" initial={false}>
                {theme === "light" && (
                    <motion.div
                        key="sun"
                        initial={{ y: 20, opacity: 0, rotate: 45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: -45 }}
                        transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
                    >
                        <Sun className="h-[1.2rem] w-[1.2rem] text-orange-500" />
                    </motion.div>
                )}
                {theme === "dark" && (
                    <motion.div
                        key="moon"
                        initial={{ y: 20, opacity: 0, rotate: 45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: -45 }}
                        transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
                    >
                        <Moon className="h-[1.2rem] w-[1.2rem] text-blue-400" />
                    </motion.div>
                )}
            </AnimatePresence>
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}