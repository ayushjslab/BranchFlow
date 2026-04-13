"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { ControlNavbar } from "@/components/shared/control-navbar";

const ControlPanelLayout = ({ children }: { children: React.ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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