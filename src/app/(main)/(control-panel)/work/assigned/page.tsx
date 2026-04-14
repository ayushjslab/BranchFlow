"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyWorkItems, updateWorkItemStatusAndPosition } from "@/app/actions/task";
import KanbanBoard from "@/components/shared/kanban-board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HiOutlineLightBulb, HiOutlineBeaker, HiOutlineClipboardCheck, HiOutlineRefresh } from "react-icons/hi";
import { IoRocketOutline } from "react-icons/io5";
import { LuBug } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AssignedTasksPage = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("tasks");

    const { data: workItems, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ["my-work"],
        queryFn: () => getMyWorkItems(),
    });

    const mutation = useMutation({
        mutationFn: (vars: { id: string, type: "task" | "bug" | "feature", status: string, position: number }) =>
            updateWorkItemStatusAndPosition(vars),
        onMutate: async (newItem) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ["my-work"] });

            // Snapshot the previous value
            const previousWorkItems = queryClient.getQueryData(["my-work"]);

            // Optimistically update to the new value
            queryClient.setQueryData(["my-work"], (old: any) => {
                if (!old) return old;

                const typeKey = newItem.type === "bug" ? "bugs" : newItem.type === "feature" ? "features" : "tasks";
                const items = [...old[typeKey]];
                const itemIndex = items.findIndex(i => i._id === newItem.id);

                if (itemIndex === -1) return old;

                // Remove the item from its current position
                const [movedItem] = items.splice(itemIndex, 1);

                // Update its status and position
                const updatedItem = { ...movedItem, status: newItem.status, position: newItem.position };

                // Insert it at the new position within the specific status column logic
                // Actually, just find the new list for that status and insert it
                // But getMyWorkItems returns a flat list sorted by position.
                // This is slightly complex to do fully optimistically with just the index.
                // We'll trust the board's state for now or just force a sync.

                // For a simpler optimistic update, we just update the specific item's status/position
                items.splice(itemIndex, 0, updatedItem);

                return {
                    ...old,
                    [typeKey]: items
                };
            });

            // Return a context object with the snapshotted value
            return { previousWorkItems };
        },
        onError: (err, newItem, context: any) => {
            queryClient.setQueryData(["my-work"], context.previousWorkItems);
            toast.error("Sync failed. Rolling back.");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["my-work"] });
        },
        onSuccess: () => {
            toast.success("Position synced", {
                className: "bg-background/80 backdrop-blur-xl border-primary/10 rounded-xl font-bold",
            });
        },
    });

    const handleMove = (id: string, newStatus: string, newPosition: number) => {
        mutation.mutate({
            id,
            type: activeTab === "bugs" ? "bug" : activeTab === "features" ? "feature" : "task",
            status: newStatus,
            position: newPosition
        });
    };

    const taskColumns = [
        { id: "pending", title: "To Do", color: "bg-slate-500" },
        { id: "in-progress", title: "In Progress", color: "bg-primary" },
        { id: "completed", title: "Done", color: "bg-emerald-500" }
    ];

    const bugColumns = [
        { id: "pending", title: "Open", color: "bg-rose-500" },
        { id: "in-progress", title: "Fixing", color: "bg-amber-500" },
        { id: "completed", title: "Resolved", color: "bg-emerald-500" }
    ];

    const featureColumns = [
        { id: "proposed", title: "Proposed", color: "bg-violet-500" },
        { id: "planned", title: "Planned", color: "bg-blue-500" },
        { id: "released", title: "Released", color: "bg-emerald-500" }
    ];

    return (
        <div className="p-6 max-w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 w-fit">
                        <HiOutlineLightBulb className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Personal Workspace</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <IoRocketOutline className="text-primary" />
                        My Work Dashboard
                    </h1>
                    <p className="text-muted-foreground font-medium max-w-xl">
                        Manage your assigned tasks, bug fixes, and feature proposals with a high-fidelity Kanban experience.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isLoading || isRefetching}
                        className="rounded-xl bg-primary/5 border-primary/10 hover:bg-primary/10 transition-all h-12 px-5 gap-2 font-bold"
                    >
                        <HiOutlineRefresh className={cn("w-4 h-4", (isLoading || isRefetching) && "animate-spin")} />
                        Refresh Board
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="tasks" className="w-full" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-primary/5 border border-primary/10 p-1 rounded-2xl h-14 w-fit">
                        <TabsTrigger
                            value="tasks"
                            className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all font-bold gap-2"
                        >
                            <HiOutlineClipboardCheck className="w-4 h-4" />
                            Assigned Tasks
                        </TabsTrigger>
                        <TabsTrigger
                            value="bugs"
                            className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-rose-500 transition-all font-bold gap-2"
                        >
                            <LuBug className="w-4 h-4" />
                            Bug Fixes
                        </TabsTrigger>
                        <TabsTrigger
                            value="features"
                            className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-violet-500 transition-all font-bold gap-2"
                        >
                            <HiOutlineBeaker className="w-4 h-4" />
                            My Features
                        </TabsTrigger>
                    </TabsList>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-[600px] bg-primary/5 rounded-3xl border border-primary/10" />
                        ))}
                    </div>
                ) : (
                    <>
                        <TabsContent value="tasks" className="mt-0 outline-none">
                            <KanbanBoard
                                items={workItems?.tasks || []}
                                columns={taskColumns}
                                onMove={handleMove}
                                type="task"
                            />
                        </TabsContent>
                        <TabsContent value="bugs" className="mt-0 outline-none">
                            <KanbanBoard
                                items={workItems?.bugs || []}
                                columns={bugColumns}
                                onMove={handleMove}
                                type="bug"
                            />
                        </TabsContent>
                        <TabsContent value="features" className="mt-0 outline-none">
                            <KanbanBoard
                                items={workItems?.features || []}
                                columns={featureColumns}
                                onMove={handleMove}
                                type="feature"
                            />
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
};

export default AssignedTasksPage;
