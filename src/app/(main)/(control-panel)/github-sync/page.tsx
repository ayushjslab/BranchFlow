"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProjectStore } from "@/store/useProjectStore";
import { getGithubDiff, DiffItem } from "@/app/actions/github-diff";
import {
    Folder,
    File,
    Plus,
    Minus,
    Equal,
    RefreshCw,
    GitCompare,
    AlertTriangle,
    ChevronRight,
    ChevronDown,
    Loader2,
    Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type FilterType = "all" | "added" | "removed" | "unchanged";

/* ─── Config ────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
    added: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-500",
        dot: "bg-emerald-500",
        label: "Added",
        icon: Plus,
        badge: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
    },
    removed: {
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        text: "text-rose-500",
        dot: "bg-rose-500",
        label: "Removed",
        icon: Minus,
        badge: "bg-rose-500/15 text-rose-500 border-rose-500/20",
    },
    unchanged: {
        bg: "bg-transparent",
        border: "border-transparent",
        text: "text-muted-foreground",
        dot: "bg-muted-foreground/30",
        label: "Unchanged",
        icon: Equal,
        badge: "bg-muted/50 text-muted-foreground border-muted-foreground/20",
    },
};

/* ─── DiffRow ────────────────────────────────────────────────────────────── */
function DiffRow({ item }: { item: DiffItem }) {
    const cfg = STATUS_CONFIG[item.status];
    const Icon = cfg.icon;
    const depth = item.path.split("/").length - 1;
    const name = item.path.split("/").pop()!;

    return (
        <div
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all group",
                cfg.bg,
                cfg.border,
                item.status !== "unchanged" && "hover:opacity-90"
            )}
            style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
            {/* Status Icon */}
            <div className={cn("w-4 h-4 flex items-center justify-center shrink-0")}>
                <Icon className={cn("w-3.5 h-3.5", cfg.text)} strokeWidth={2.5} />
            </div>

            {/* File/Folder Icon */}
            {item.type === "folder" ? (
                <Folder className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20 shrink-0" />
            ) : (
                <File className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            )}

            {/* Name */}
            <span
                className={cn(
                    "text-sm font-medium flex-1 font-mono",
                    item.status === "removed" && "line-through text-rose-500/70",
                    item.status === "added" && "text-emerald-500",
                    item.status === "unchanged" && "text-foreground/70"
                )}
            >
                {name}
            </span>

            {/* Full path (on hover) */}
            {depth > 0 && (
                <span className="text-[10px] text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-32 font-mono">
                    {item.path}
                </span>
            )}

            {/* Status badge */}
            <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-1.5 h-4 border shrink-0", cfg.badge)}>
                {cfg.label}
            </Badge>
        </div>
    );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function GithubSyncPage() {
    const { selectedProject } = useProjectStore();
    const [filter, setFilter] = useState<FilterType>("all");
    const [showUnchanged, setShowUnchanged] = useState(false);

    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ["github-diff", selectedProject?._id],
        queryFn: () => getGithubDiff(selectedProject?._id!),
        enabled: !!selectedProject?._id,
        retry: false,
    });

    /* ─── Stats ─────────────────────────────────────────────────────────── */
    const stats = useMemo(() => {
        if (!data) return { added: 0, removed: 0, unchanged: 0, total: 0 };
        return {
            added: data.filter((d) => d.status === "added").length,
            removed: data.filter((d) => d.status === "removed").length,
            unchanged: data.filter((d) => d.status === "unchanged").length,
            total: data.length,
        };
    }, [data]);

    /* ─── Filtered list ─────────────────────────────────────────────────── */
    const filtered = useMemo(() => {
        if (!data) return [];
        return data.filter((d) => {
            if (filter !== "all" && d.status !== filter) return false;
            if (!showUnchanged && d.status === "unchanged") return false;
            return true;
        });
    }, [data, filter, showUnchanged]);

    /* ─── No project selected ────────────────────────────────────────────── */
    if (!selectedProject) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-4 opacity-40">
                <GitCompare className="w-16 h-16" />
                <div>
                    <p className="text-lg font-black uppercase tracking-widest">No Project Selected</p>
                    <p className="text-sm text-muted-foreground mt-1">Select a project from the sidebar to compare its explorer with GitHub.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ─── Header ────────────────────────────────────────────────── */}
            <header className="p-6 border-b border-primary/10 bg-primary/2 space-y-4 shrink-0">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                            <GitCompare className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">GitHub Sync Diff</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Comparing <span className="font-bold text-foreground">{selectedProject.name}</span> explorer against live GitHub repository
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl font-bold border-primary/20 text-xs"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isFetching && "animate-spin")} />
                        Refresh
                    </Button>
                </div>

                {/* ─── Stats bar ─────────────────────────────────────────── */}
                {data && (
                    <div className="flex items-center gap-3 flex-wrap">
                        {(["added", "removed", "unchanged"] as const).map((s) => {
                            const cfg = STATUS_CONFIG[s];
                            const count = stats[s];
                            const Icon = cfg.icon;
                            return (
                                <button
                                    key={s}
                                    onClick={() => {
                                        if (s === "unchanged") {
                                            setShowUnchanged((prev) => !prev);
                                            setFilter("all");
                                        } else {
                                            setFilter((prev) => prev === s ? "all" : s);
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all",
                                        cfg.badge,
                                        (filter === s || (s === "unchanged" && showUnchanged && filter === "all"))
                                            ? "ring-2 ring-offset-1 ring-current"
                                            : "opacity-70 hover:opacity-100"
                                    )}
                                >
                                    <Icon className="w-3 h-3" />
                                    {count} {cfg.label}
                                </button>
                            );
                        })}

                        <div className="ml-auto text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                            {stats.total} total items
                        </div>
                    </div>
                )}
            </header>

            {/* ─── Legend ────────────────────────────────────────────────── */}
            <div className="px-6 py-2.5 border-b border-primary/5 bg-primary/2 flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 shrink-0">
                <div className="flex items-center gap-1.5"><Plus className="w-3 h-3 text-emerald-500" /> In GitHub, not in project</div>
                <div className="flex items-center gap-1.5"><Minus className="w-3 h-3 text-rose-500" /> In project, removed from GitHub</div>
                <div className="flex items-center gap-1.5"><Equal className="w-3 h-3 text-muted-foreground/40" /> Exists in both</div>
            </div>

            {/* ─── Content ───────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-6 space-y-1.5">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-30">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-xs font-black uppercase tracking-widest">Fetching GitHub tree and computing diff...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 max-w-md mx-auto text-center">
                        <div className="p-4 rounded-3xl bg-destructive/10 border border-destructive/20">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>
                        <div>
                            <p className="font-black text-destructive">Failed to Load Diff</p>
                            <p className="text-sm text-muted-foreground mt-1">{(error as any)?.message || "An error occurred."}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-destructive/20 text-destructive"
                            onClick={() => refetch()}
                        >
                            Retry
                        </Button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-30">
                        <Equal className="w-8 h-8" />
                        <p className="text-xs font-black uppercase tracking-widest">
                            {data?.length === 0
                                ? "No items found. Make sure the project has been synced."
                                : "No items match the current filter."}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Changed items first */}
                        {filtered.filter((d) => d.status !== "unchanged").length > 0 && (
                            <div className="space-y-1">
                                {filtered
                                    .filter((d) => d.status !== "unchanged")
                                    .map((item) => (
                                        <DiffRow key={item.path} item={item} />
                                    ))}
                            </div>
                        )}

                        {/* Unchanged items in a collapsible section */}
                        {showUnchanged && filtered.filter((d) => d.status === "unchanged").length > 0 && (
                            <div className="mt-4 space-y-1">
                                <div className="flex items-center gap-2 py-1 px-1">
                                    <div className="h-px flex-1 bg-primary/5" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                                        {stats.unchanged} Unchanged
                                    </span>
                                    <div className="h-px flex-1 bg-primary/5" />
                                </div>
                                {filtered
                                    .filter((d) => d.status === "unchanged")
                                    .map((item) => (
                                        <DiffRow key={item.path} item={item} />
                                    ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}