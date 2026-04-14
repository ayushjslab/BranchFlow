"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyWorkItems } from "@/app/actions/task";
import { TimelineGrid } from "@/components/shared/timeline-grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar,
    ListTodo,
    Bug as BugIcon,
    Sparkles,
    Clock,
    AlertCircle,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TimelinePage = () => {
    const [activeTab, setActiveTab] = useState("tasks");

    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ["my-work-timeline"],
        queryFn: () => getMyWorkItems(),
    });

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Calendar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-lg font-black uppercase tracking-widest">Generating Timeline</p>
                    <p className="text-sm text-muted-foreground italic">Mapping out your schedule items...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-6 p-12 text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Timeline Sync Failed</h2>
                    <p className="text-muted-foreground text-sm">We couldn&apos;t retrieve your work items. Please check your connection and try again.</p>
                </div>
                <Button variant="outline" className="rounded-2xl px-8 font-bold" onClick={() => refetch()}>
                    Retry Connection
                </Button>
            </div>
        );
    }

    const tasks = data?.tasks || [];
    const bugs = data?.bugs || [];
    const features = data?.features || [];

    const totalWork = tasks.length + bugs.length + features.length;
    const completedWork =
        tasks.filter((t: any) => t.status === "completed").length +
        bugs.filter((b: any) => b.status === "completed").length +
        features.filter((f: any) => f.status === "released").length;

    const progressPercent = totalWork > 0 ? Math.round((completedWork / totalWork) * 100) : 0;

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header section */}
            <header className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight uppercase">Assigned Timeline</h1>
                    </div>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                        Visualize your project milestones and deadlines across all assigned work.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl font-bold border-primary/20 hover:bg-primary/5"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isFetching && "animate-spin")} />
                        Refresh
                    </Button>
                    <div className="w-px h-8 bg-border mx-2" />
                    <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Overall Progress</span>
                            <span className="text-xs font-black text-primary">{progressPercent}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-1000"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground ml-1">
                                {completedWork}/{totalWork} Done
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Tabs */}
            <Tabs defaultValue="tasks" className="flex-1 flex flex-col space-y-6" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                    <TabsList className="bg-muted/50 p-1 rounded-2xl border border-primary/5">
                        <TabsTrigger value="tasks" className="rounded-xl px-6 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-primary/20 flex items-center gap-2">
                            <ListTodo className="w-3.5 h-3.5" />
                            <span className="text-xs font-black uppercase tracking-widest">Tasks</span>
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-none">{tasks.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="bugs" className="rounded-xl px-6 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-primary/20 flex items-center gap-2">
                            <BugIcon className="w-3.5 h-3.5" />
                            <span className="text-xs font-black uppercase tracking-widest">Bugs</span>
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-rose-500/10 text-rose-500 border-none">{bugs.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="features" className="rounded-xl px-6 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-primary/20 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="text-xs font-black uppercase tracking-widest">Features</span>
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-violet-500/10 text-violet-500 border-none">{features.length}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" /> High Priority</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" /> Medium Priority</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]" /> Low Priority</div>
                    </div>
                </div>

                <div className="flex-1 bg-background/40 rounded-3xl border border-primary/5 p-1 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-100" />

                    <TabsContent value="tasks" className="mt-0 h-full">
                        <TimelineGrid items={tasks} type="task" />
                    </TabsContent>

                    <TabsContent value="bugs" className="mt-0 h-full">
                        <TimelineGrid items={bugs} type="bug" />
                    </TabsContent>

                    <TabsContent value="features" className="mt-0 h-full">
                        <TimelineGrid items={features} type="feature" />
                    </TabsContent>

                    {/* Bottom Stats or Legend */}
                    <div className="p-4 border-t bg-muted/20 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Live Timeline Board
                        </div>
                        <div className="flex items-center gap-1">
                            Current View: <span className="text-foreground">{activeTab} Visualization</span>
                        </div>
                    </div>
                </div>
            </Tabs>
        </div>
    );
};

export default TimelinePage;
