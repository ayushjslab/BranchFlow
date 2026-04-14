"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, differenceInDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";

interface TimelineItem {
    _id: string;
    name: string;
    createdAt: string | Date;
    dueDate?: string | Date;
    status: string;
    priority: string;
    filePath?: string;
}

interface TimelineGridProps {
    items: TimelineItem[];
    type: "task" | "bug" | "feature";
}

const COLUMN_WIDTH = 40; // px per day

export const TimelineGrid = ({ items, type }: TimelineGridProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate the range for the current month for now
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    const days = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const totalWidth = days.length * COLUMN_WIDTH;

    // Scroll to today on mount
    useEffect(() => {
        if (containerRef.current) {
            const todayIndex = days.findIndex(day => isSameDay(day, now));
            if (todayIndex !== -1) {
                containerRef.current.scrollLeft = Math.max(0, (todayIndex * COLUMN_WIDTH) - 200);
            }
        }
    }, []);

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case "high": return "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20";
            case "medium": return "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20";
            case "low": return "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20";
            default: return "bg-primary hover:bg-primary/90";
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "bug": return "border-rose-500/30 text-rose-500 bg-rose-500/5";
            case "feature": return "border-violet-500/30 text-violet-500 bg-violet-500/5";
            default: return "border-primary/30 text-primary bg-primary/5";
        }
    };

    return (
        <div className="flex flex-col border rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
            {/* Timeline Header */}
            <div className="flex border-b bg-muted/30">
                <div className="w-64 shrink-0 border-r p-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground flex items-center">
                    Work Items
                </div>
                <div className="flex-1 overflow-x-hidden">
                    <div className="flex" style={{ width: totalWidth }}>
                        {days.map((day) => (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "shrink-0 flex flex-col items-center justify-center border-r h-14 text-[10px] font-bold transition-colors",
                                    isSameDay(day, now) ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground/60"
                                )}
                                style={{ width: COLUMN_WIDTH }}
                            >
                                <span>{format(day, "MMM")}</span>
                                <span className={cn("text-sm", isSameDay(day, now) && "text-primary font-black")}>{format(day, "d")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline Body */}
            <div className="flex flex-1 overflow-hidden h-[600px]">
                {/* Left Side: Names */}
                <div className="w-64 shrink-0 border-r bg-muted/10 divide-y overflow-y-auto overflow-x-hidden">
                    {items.map((item) => (
                        <div key={item._id} className="h-12 px-4 flex flex-col justify-center gap-0.5 hover:bg-primary/5 transition-colors group">
                            <span className="text-sm font-bold truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
                                {item.name}
                                {["completed", "released"].includes(item.status.toLowerCase()) && (
                                    <IoCheckmarkDoneCircleOutline className="w-4 h-4 text-emerald-500 shrink-0" />
                                )}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50 truncate uppercase tracking-wider font-medium">
                                {item.filePath || "No Project"}
                            </span>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="h-32 flex items-center justify-center text-xs text-muted-foreground italic px-4 text-center">
                            No {type}s assigned to you.
                        </div>
                    )}
                </div>

                {/* Right Side: Grid & Bars */}
                <div ref={containerRef} className="flex-1 overflow-auto relative">
                    <div className="relative" style={{ width: totalWidth, height: Math.max(items.length * 48, 400) }}>
                        {/* Day Columns */}
                        <div className="absolute inset-0 flex pointer-events-none">
                            {days.map((day) => (
                                <div
                                    key={`col-${day.toISOString()}`}
                                    className={cn(
                                        "shrink-0 border-r h-full",
                                        isSameDay(day, now) ? "bg-primary/5 border-primary/10" : "border-muted/10"
                                    )}
                                    style={{ width: COLUMN_WIDTH }}
                                />
                            ))}
                        </div>

                        {/* Bars */}
                        <div className="relative divide-y w-full">
                            {items.map((item, index) => {
                                const start = startOfDay(new Date(item.createdAt));
                                const due = item.dueDate ? startOfDay(new Date(item.dueDate)) : null;

                                // Calculate offset and duration within the current month view
                                const startDiff = due ? differenceInDays(start, startDate) : differenceInDays(start, startDate);
                                const duration = due ? Math.max(1, differenceInDays(due, start) + 1) : 1;

                                const left = startDiff * COLUMN_WIDTH;
                                const width = duration * COLUMN_WIDTH;

                                // Filter out bars visible only within current range
                                if (left + width < 0 || left > totalWidth) return <div key={item._id} className="h-12" />;

                                return (
                                    <div key={item._id} className="h-12 w-full relative group/bar">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            "absolute top-2 h-8 rounded-full shadow-lg border transition-all hover:scale-[1.02] cursor-pointer flex items-center px-3 gap-2 overflow-hidden",
                                                            getPriorityColor(item.priority)
                                                        )}
                                                        style={{
                                                            left: Math.max(0, left),
                                                            width: Math.min(width, totalWidth - left),
                                                            zIndex: 10
                                                        }}
                                                    >
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                                                        <span className="text-[10px] font-black text-white truncate drop-shadow-sm uppercase tracking-tighter">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="p-3 rounded-2xl border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-xs font-black uppercase tracking-widest">{type}</span>
                                                            <span className={cn(
                                                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                                                                getTypeColor(type)
                                                            )}>{item.priority}</span>
                                                        </div>
                                                        <p className="text-sm font-bold">{item.name}</p>
                                                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                                            <div className="flex flex-col">
                                                                <span className="uppercase tracking-widest">Start</span>
                                                                <span className="text-foreground">{format(start, "MMM d")}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="uppercase tracking-widest">Due</span>
                                                                <span className="text-foreground">{due ? format(due, "MMM d") : "No due date"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
