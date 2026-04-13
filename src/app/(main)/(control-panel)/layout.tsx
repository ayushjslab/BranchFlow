"use client";

import React from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard } from "lucide-react";

const ControlPanelLayout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/signin");
    };

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary p-1">
                            <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">
                            BranchFlow
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOut}
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </header>
            <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
        </div>
    );
};

export default ControlPanelLayout;