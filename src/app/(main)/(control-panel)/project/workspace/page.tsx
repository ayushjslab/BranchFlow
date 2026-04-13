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
import { BlobDetails } from "@/components/shared/blob-details";

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
                id="workspace-layout"
                className="h-full w-full"
            >
                <ResizablePanel
                    defaultSize={25}
                    minSize={15}
                    maxSize={40}
                    order={0}
                    className="h-full border-r border-primary/5"
                >
                    <Explorer projectId={selectedProject._id} />
                </ResizablePanel>

                <ResizableHandle withHandle className="bg-primary/5 hover:bg-primary/20 transition-all w-1" />

                <ResizablePanel defaultSize={75} minSize={40} order={1}>
                    <BlobDetails />
                </ResizablePanel>
            </ResizablePanelGroup>
        </motion.div>
    );
};

export default WorkspacePage;