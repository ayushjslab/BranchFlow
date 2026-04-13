"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { Explorer } from "@/components/shared/explorer";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from "@/components/ui/resizable";
import { motion } from "framer-motion";
import { HiOutlineCode } from "react-icons/hi";

const WorkspacePage = () => {
    const { selectedProject } = useProjectStore();

    if (!selectedProject) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="p-6 rounded-[2.5rem] bg-primary/5 text-primary border border-primary/10 shadow-2xl shadow-primary/5">
                    <HiOutlineCode className="w-16 h-16 opacity-20" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        No Project Selected
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        Please select a project from the navbar to access your workspace.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col min-h-0 overflow-hidden border-t border-primary/10 bg-card/20"
        >
            <ResizablePanelGroup
                direction="horizontal"
                id="workspace-panels"
                className="h-full w-full"
            >
                <ResizablePanel
                    defaultSize={25}
                    minSize={15}
                    maxSize={45}
                    className="h-full border-r border-primary/5"
                    order={0}
                >
                    <Explorer projectId={selectedProject._id} />
                </ResizablePanel>

                <ResizableHandle order={0} withHandle className="hover:bg-primary/10 transition-colors" />

                <ResizablePanel defaultSize={75} order={1} className="flex-1">
                    <div className="flex items-center justify-center h-full w-full bg-background/30 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 opacity-50 pointer-events-none" />

                        <div className="text-center relative z-10 space-y-6 px-8">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                <div className="p-8 rounded-[3rem] bg-card border border-primary/10 shadow-2xl shadow-primary/10 relative">
                                    <HiOutlineCode className="w-20 h-20 text-primary opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-3xl font-black bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent tracking-tight">
                                    Select a file to view
                                </h3>
                                <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto font-medium">
                                    Manage your project structure from the explorer on the left.
                                </p>
                            </div>
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </motion.div>
    );
};

export default WorkspacePage;