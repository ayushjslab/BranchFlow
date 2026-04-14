"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { HiOutlineCalendar, HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import WorkDetailDialog from "./work-detail-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface WorkCardProps {
    item: any;
    type: "task" | "bug" | "feature";
}

const PriorityBadge = ({ priority }: { priority: string }) => {
    const config: any = {
        low: { icon: Info, color: "text-emerald-500 bg-emerald-500/10 ring-emerald-500/20", label: "Low" },
        medium: { icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10 ring-amber-500/20", label: "Med" },
        high: { icon: AlertCircle, color: "text-rose-500 bg-rose-500/10 ring-rose-500/20", label: "High" },
    };

    const { icon: Icon, color, label } = config[priority] || config.low;

    return (
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 text-[10px] font-black uppercase tracking-wider", color)}>
            <Icon className="w-3 h-3" />
            <span>{label}</span>
        </div>
    );
};

const WorkCard = ({ item, type }: WorkCardProps) => {
    const { data: session } = authClient.useSession();
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);

    const isBug = type === "bug";
    const isFeature = type === "feature";

    const creatorId = item.createdBy || item.reportedBy || item.addedBy;
    const isOwner = session?.user?.id === creatorId;
    const router = useRouter();

    return (
        <>
            <div
                onClick={() => router.push(`/work/${type}s/${item._id}`)}
                className={cn(
                    "group relative bg-primary/5 border border-primary/10 rounded-2xl p-5 hover:bg-primary/8 hover:border-primary/20 transition-all cursor-pointer overflow-hidden",
                    isBug && "border-rose-500/10 bg-rose-500/2 hover:bg-rose-500/5 hover:border-rose-500/20",
                    isFeature && "border-violet-500/10 bg-violet-500/2 hover:bg-violet-500/5 hover:border-violet-500/20"
                )}
            >
                {/* Decoration */}
                <div className={cn(
                    "absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors",
                    isBug && "bg-rose-500/5 group-hover:bg-rose-500/10",
                    isFeature && "bg-violet-500/5 group-hover:bg-violet-500/10"
                )} />

                <div className="relative space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                    {item.name}
                                </h3>
                                {isOwner && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
                                            onClick={(e) => { e.stopPropagation(); setIsDetailOpen(true); }}
                                        >
                                            <HiOutlinePencil className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                                {item.description}
                            </p>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsDetailOpen(true); }}
                                className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors mt-2"
                            >
                                Show More
                            </button>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {item.priority && <PriorityBadge priority={item.priority} />}
                            {isFeature && (
                                <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20 uppercase text-[9px] font-black tracking-widest">
                                    New Feature
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-primary/5">
                        {/* Main Actor (Assignee or Reporter) */}
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-primary/20 ring-4 ring-background/50">
                                <AvatarImage src={item.assigneeDetails?.image || item.reporterDetails?.image || item.addedByDetails?.image} />
                                <AvatarFallback className="text-[10px] font-bold bg-primary/10">
                                    {(item.assigneeDetails?.name || item.reporterDetails?.name || item.addedByDetails?.name)?.slice(0, 2).toUpperCase() || "??"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black leading-none mb-0.5">
                                    {item.assigneeDetails?.name || item.reporterDetails?.name || item.addedByDetails?.name || "Unassigned"}
                                </span>
                                <span className="text-[8px] uppercase font-bold opacity-40 tracking-widest leading-none">
                                    {isBug ? "Fixer" : isFeature ? "Visionary" : "Assignee"}
                                </span>
                            </div>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-6 ml-auto">
                            {item.status && !isFeature && (
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] uppercase font-bold opacity-40 tracking-widest leading-none mb-1">Status</span>
                                    <Badge variant="outline" className="text-[9px] px-2 py-0 h-4 border-primary/10 bg-primary/5">
                                        {item.status.replace("-", " ")}
                                    </Badge>
                                </div>
                            )}

                            {item.dueDate && (
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] uppercase font-bold opacity-40 tracking-widest leading-none mb-1">Deadline</span>
                                    <div className="flex items-center gap-1 text-[10px] font-bold">
                                        <HiOutlineCalendar className="w-3 h-3 opacity-40" />
                                        {format(new Date(item.dueDate), "MMM dd")}
                                    </div>
                                </div>
                            )}

                            {!item.dueDate && item.createdAt && (
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] uppercase font-bold opacity-40 tracking-widest leading-none mb-1">Added</span>
                                    <div className="flex items-center gap-1 text-[10px] font-bold">
                                        <HiOutlineCalendar className="w-3 h-3 opacity-40" />
                                        {format(new Date(item.createdAt), "MMM dd")}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <WorkDetailDialog
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                item={item}
                type={type}
                isOwner={isOwner}
            />
        </>
    );
};

export default WorkCard;
