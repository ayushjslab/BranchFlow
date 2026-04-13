"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTasksByBlob } from "@/app/actions/task";
import { useProjectStore } from "@/store/useProjectStore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    FileText,
    Calendar,
    User,
    AlertCircle,
    AlertTriangle,
    Info,
    CheckCircle2,
    Clock,
    Plus,
    ClipboardCheck,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

export const BlobDetails = () => {
    const { selectedBlob, selectedProject } = useProjectStore();
    const queryClient = useQueryClient();

    const { data: categories, isLoading } = useQuery({
        queryKey: ["tasks", selectedProject?._id, selectedBlob?._id],
        queryFn: () => getTasksByBlob(selectedProject?._id!, selectedBlob?._id!),
        enabled: !!selectedProject?._id && !!selectedBlob?._id,
    });

    if (!selectedBlob) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4 opacity-50">
                <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary/40" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest">No File Selected</p>
                    <p className="text-xs text-muted-foreground">Select a file from the explorer to view its linked tasks.</p>
                </div>
            </div>
        );
    }

    const totalCount = (categories?.task?.total || 0) + (categories?.bug?.total || 0) + (categories?.feature?.total || 0);

    return (
        <div className="flex flex-col h-full bg-card/10 backdrop-blur-3xl border-l border-primary/10 overflow-hidden">
            {/* Header */}
            <header className="p-6 border-b border-primary/10 space-y-4 bg-primary/3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1.5 font-sans">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-primary/5 text-[10px] uppercase font-black tracking-widest border-primary/10 py-0.5">
                                File Details
                            </Badge>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 rounded-lg hover:bg-primary/10 transition-all"
                                onClick={() => queryClient.invalidateQueries({ queryKey: ["tasks", selectedProject?._id, selectedBlob?._id] })}
                            >
                                <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
                            </Button>
                        </div>
                        <h2 className="text-xl font-black truncate max-w-[200px] bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                            {selectedBlob.name}
                        </h2>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner">
                        <FileText className="w-5 h-5 text-primary" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none text-[10px] font-bold px-2 py-0.5">
                        {totalCount} Total Items
                    </Badge>
                    <div className="w-1 h-1 rounded-full bg-primary/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Active Workspace</span>
                </div>
            </header>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar pb-20">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary opacity-30" />
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Fetching Categorized tasks...</p>
                    </div>
                ) : (
                    <>
                        <TaskSection
                            title="Assignee Tasks"
                            type="task"
                            icon={ClipboardCheck}
                            data={categories?.task}
                            blobId={selectedBlob._id}
                        />
                        <TaskSection
                            title="Bug Reports"
                            type="bug"
                            icon={AlertCircle}
                            data={categories?.bug}
                            blobId={selectedBlob._id}
                        />
                        <TaskSection
                            title="New Features"
                            type="feature"
                            icon={Plus}
                            data={categories?.feature}
                            blobId={selectedBlob._id}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

const TaskSection = ({ title, type, icon: Icon, data, blobId }: { title: string, type: string, icon: any, data: any, blobId: string }) => {
    if (!data) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-primary/5 pb-2">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "p-1.5 rounded-lg",
                        type === "bug" ? "bg-rose-500/10 text-rose-500" :
                            type === "feature" ? "bg-blue-500/10 text-blue-500" :
                                "bg-primary/10 text-primary"
                    )}>
                        <Icon className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-wider">{title}</h3>
                    <Badge variant="ghost" className="h-4 px-1.5 text-[9px] font-bold opacity-40">
                        {data.total}
                    </Badge>
                </div>
                {data.total > 6 && (
                    <Link href={`/project/workspace/${blobId}/${type}s`} className="text-[10px] font-bold text-primary hover:underline underline-offset-4">
                        Show More
                    </Link>
                )}
            </div>

            {data.items.length === 0 ? (
                <div className="py-4 text-center opacity-20 italic text-[10px]">
                    No items in this category
                </div>
            ) : (
                <div className="space-y-3">
                    {data.items.map((task: any) => (
                        <div
                            key={task._id}
                            className="group p-3 rounded-xl border border-primary/5 bg-primary/1 hover:bg-primary/4 transition-all cursor-pointer space-y-2"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <h4 className="text-[13px] font-bold line-clamp-1 group-hover:text-primary transition-colors">
                                    {task.name}
                                </h4>
                                <PriorityBadge priority={task.priority} />
                            </div>

                            <p className="text-[11px] text-muted-foreground/60 line-clamp-1 italic">
                                {task.description}
                            </p>

                            <div className="pt-2 flex items-center justify-between border-t border-primary/5 opacity-60">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-4 w-4 ring-1 ring-primary/10">
                                        <AvatarImage src={task.assigneeDetails?.image} />
                                        <AvatarFallback className="text-[7px] font-bold">
                                            {task.assigneeDetails?.name?.slice(0, 2).toUpperCase() || "??"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-[9px] font-medium">{task.assigneeDetails?.name || "Unassigned"}</span>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
                                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
    const config: any = {
        low: { icon: Info, color: "text-emerald-500 bg-emerald-500/10 ring-emerald-500/20", label: "Low" },
        medium: { icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10 ring-amber-500/20", label: "Med" },
        high: { icon: AlertCircle, color: "text-rose-500 bg-rose-500/10 ring-rose-500/20", label: "High" },
    };

    const { icon: Icon, color, label } = config[priority] || config.low;

    return (
        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 text-[9px] font-black uppercase tracking-tight", color)}>
            <Icon className="w-2.5 h-2.5" />
            <span>{label}</span>
        </div>
    );
};
