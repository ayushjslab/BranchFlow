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
    AlertCircle,
    AlertTriangle,
    Info,
    Plus,
    ClipboardCheck,
    RefreshCw,
    ChevronRight,
    Sparkles,
    ArrowRight,
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
    const path = categories?.path || [];

    return (
        <div className="flex flex-col h-full bg-card/10 backdrop-blur-3xl border-l border-primary/10 overflow-hidden">
            {/* Header */}
            <header className="p-4 border-b border-primary/10 bg-primary/2 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-primary/5 border border-primary/10 shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1 overflow-hidden">
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary/40 shrink-0">Root</span>
                                {path.map((segment: string, i: number) => (
                                    <React.Fragment key={i}>
                                        <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/20 shrink-0" />
                                        <span className="text-[10px] font-bold text-muted-foreground/40 truncate">
                                            {segment}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>
                            <h2 className="text-base font-black truncate bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                {selectedBlob.name}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-lg hover:bg-primary/5 transition-all"
                            onClick={() => queryClient.invalidateQueries({ queryKey: ["tasks", selectedProject?._id, selectedBlob?._id] })}
                        >
                            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none text-[9px] font-black uppercase tracking-tighter px-1.5 h-4">
                            {totalCount} Items
                        </Badge>
                        <div className="w-1 h-1 rounded-full bg-primary/10" />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-20">Sync Active</span>
                    </div>
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
                            icon={Sparkles}
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
                            type === "feature" ? "bg-violet-500/10 text-violet-500" :
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
                        Show All
                    </Link>
                )}
            </div>

            {data.items.length === 0 ? (
                <div className="py-6 text-center opacity-20 italic text-[10px] border border-dashed border-primary/10 rounded-xl">
                    No active {type}s detected
                </div>
            ) : (
                <div className="space-y-3">
                    {data.items.map((item: any) => (
                        <div
                            key={item._id}
                            className={cn(
                                "group p-3 rounded-xl border transition-all cursor-pointer space-y-3",
                                type === "bug" ? "border-rose-500/5 bg-rose-500/1 hover:bg-rose-500/3 hover:border-rose-500/10" :
                                    type === "feature" ? "border-violet-500/5 bg-violet-500/1 hover:bg-violet-500/3 hover:border-violet-500/10" :
                                        "border-primary/5 bg-primary/1 hover:bg-primary/4"
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <h4 className="text-[13px] font-bold line-clamp-1 group-hover:text-primary transition-colors">
                                    {item.name}
                                </h4>
                                {item.priority && <PriorityBadge priority={item.priority} />}
                            </div>

                            <p className="text-[11px] text-muted-foreground/60 line-clamp-2 leading-relaxed">
                                {item.description}
                            </p>

                            <div className="pt-3 flex flex-col gap-2 border-t border-primary/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {/* Main User Display */}
                                        <div className="flex items-center gap-1.5">
                                            <Avatar className="h-5 w-5 border border-primary/10 ring-2 ring-background">
                                                <AvatarImage src={item.assigneeDetails?.image || item.addedByDetails?.image} />
                                                <AvatarFallback className="text-[8px] font-black bg-primary/10">
                                                    {(item.assigneeDetails?.name || item.addedByDetails?.name)?.slice(0, 2).toUpperCase() || "??"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black tracking-tight">
                                                    {item.assigneeDetails?.name || item.addedByDetails?.name || "Pending"}
                                                </span>
                                                <span className="text-[7px] uppercase font-bold opacity-40 tracking-widest leading-none">
                                                    {type === "bug" ? "Fixer" : type === "feature" ? "Visionary" : "Assignee"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Optional Secondary User (e.g., Bug Reporter) */}
                                        {type === "bug" && item.reporterDetails && (
                                            <>
                                                <ArrowRight className="w-2.5 h-2.5 opacity-20" />
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <Avatar className="h-4 w-4 border border-primary/10 grayscale">
                                                        <AvatarImage src={item.reporterDetails.image} />
                                                        <AvatarFallback className="text-[6px] font-bold">
                                                            {item.reporterDetails.name?.slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black">{item.reporterDetails.name}</span>
                                                        <span className="text-[6px] uppercase font-bold opacity-60 tracking-widest leading-none">
                                                            Reporter
                                                        </span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {item.dueDate && (
                                        <div className="flex flex-col items-end opacity-40 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1">Deadline</span>
                                            <span className="text-[9px] font-bold">
                                                {format(new Date(item.dueDate), "MMM d")}
                                            </span>
                                        </div>
                                    )}

                                    {type === "feature" && !item.dueDate && (
                                        <div className="flex flex-col items-end opacity-40">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1">Created</span>
                                            <span className="text-[9px] font-bold">
                                                {format(new Date(item.createdAt || new Date()), "MMM d")}
                                            </span>
                                        </div>
                                    )}
                                </div>
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
