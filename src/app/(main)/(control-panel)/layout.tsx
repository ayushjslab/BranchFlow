"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { ControlNavbar } from "@/components/shared/control-navbar";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";

const ControlPanelLayout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, isPending } = authClient.useSession();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    if (isPending) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!session) {
        router.push(`/signin?callbackURL=${encodeURIComponent(pathname)}`);
        return null;
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background">
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
            />

            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                <ControlNavbar onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="relative px-6 py-8 min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ControlPanelLayout;