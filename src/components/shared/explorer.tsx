"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getExplorerItems,
    createExplorerItem,
    deleteExplorerItem
} from "@/app/actions/explorer";

import {
    Folder,
    File,
    ChevronRight,
    ChevronDown,
    FilePlus,
    FolderPlus,
    MoreVertical,
    Trash,
    Loader2,
    ClipboardCheck
} from "lucide-react";
import { CreateTaskDialog } from "./create-task-dialog";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* =========================
   Explorer Item Component
========================= */

interface ExplorerItemProps {
    item: any;
    depth: number;
    projectId: string;
}

const ExplorerItem = ({ item, depth, projectId }: ExplorerItemProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState<"blob" | "folder" | null>(null);
    const [newItemName, setNewItemName] = useState("");
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

    const queryClient = useQueryClient();

    /* ===== Fetch children ===== */
    const { data: children, isLoading } = useQuery({
        queryKey: ["explorer", projectId, item._id],
        queryFn: () => getExplorerItems(projectId, item._id),
        enabled: isOpen && item.type === "folder",
    });

    /* ===== Create ===== */
    const createMutation = useMutation({
        mutationFn: createExplorerItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["explorer", projectId] });
            setIsAdding(null);
            setNewItemName("");
            toast.success("Created");
        },
        onError: (err: any) => toast.error(err.message),
    });

    /* ===== Delete ===== */
    const deleteMutation = useMutation({
        mutationFn: deleteExplorerItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["explorer", projectId] });
            toast.success("Deleted");
        },
    });

    /* ===== Handlers ===== */
    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        createMutation.mutate({
            name: newItemName.trim(),
            type: isAdding!,
            projectId,
            parent: item._id,
        });
    };

    return (
        <div className="select-none">
            {/* ===== Row ===== */}
            <div
                className={cn(
                    "group flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer transition-all hover:bg-primary/5",
                    depth > 0 && "ml-4"
                )}
                onClick={() =>
                    item.type === "folder" && setIsOpen((prev) => !prev)
                }
            >
                {/* Expand Icon */}
                {item.type === "folder" ? (
                    isOpen ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )
                ) : (
                    <div className="w-4" />
                )}

                {/* Icon */}
                {item.type === "folder" ? (
                    <Folder className="w-4 h-4 text-sky-500 fill-sky-500/20" />
                ) : (
                    <File className="w-4 h-4 text-muted-foreground" />
                )}

                {/* Name */}
                <span className="text-sm truncate flex-1">
                    {item.name}
                </span>

                {/* Actions */}
                <div
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition"
                    onClick={(e) => e.stopPropagation()}
                >
                    {item.type === "folder" && (
                        <>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => {
                                    setIsAdding("blob");
                                    setIsOpen(true);
                                }}
                            >
                                <FilePlus className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => {
                                    setIsAdding("folder");
                                    setIsOpen(true);
                                }}
                            >
                                <FolderPlus className="w-3.5 h-3.5" />
                            </Button>
                        </>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6">
                                <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            {item.type === "blob" && (
                                <DropdownMenuItem
                                    onClick={() => setIsTaskDialogOpen(true)}
                                    className="text-primary"
                                >
                                    <ClipboardCheck className="w-4 h-4 mr-2" />
                                    Create Task
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteMutation.mutate(item._id)}
                            >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {item.type === "blob" && (
                <CreateTaskDialog
                    isOpen={isTaskDialogOpen}
                    onClose={() => setIsTaskDialogOpen(false)}
                    projectId={projectId}
                    blobId={item._id}
                    blobName={item.name}
                />
            )}

            {/* ===== Children ===== */}
            {isOpen && item.type === "folder" && (
                <div className="ml-4 border-l border-primary/10 py-1">
                    {isLoading ? (
                        <div className="flex items-center gap-2 px-4 py-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="text-xs text-muted-foreground">
                                Loading...
                            </span>
                        </div>
                    ) : (
                        <>
                            {children?.map((child: any) => (
                                <ExplorerItem
                                    key={child._id}
                                    item={child}
                                    depth={depth + 1}
                                    projectId={projectId}
                                />
                            ))}

                            {/* Add Input */}
                            {isAdding && (
                                <form
                                    onSubmit={handleCreate}
                                    className="ml-2 mr-2 my-1"
                                >
                                    <div className="flex items-center gap-2 px-2 py-1 bg-primary/5 rounded-lg border border-primary/10">
                                        {isAdding === "folder" ? (
                                            <Folder className="w-4 h-4 text-sky-500" />
                                        ) : (
                                            <File className="w-4 h-4" />
                                        )}

                                        <Input
                                            autoFocus
                                            value={newItemName}
                                            onChange={(e) =>
                                                setNewItemName(e.target.value)
                                            }
                                            onBlur={() =>
                                                !newItemName && setIsAdding(null)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Escape") {
                                                    setIsAdding(null);
                                                    setNewItemName("");
                                                }
                                            }}
                                            placeholder={`New ${isAdding}`}
                                            className="h-7 text-xs border-none bg-transparent focus-visible:ring-0 p-0"
                                        />
                                    </div>
                                </form>
                            )}

                            {children?.length === 0 && !isAdding && (
                                <div className="px-4 py-2 text-xs text-muted-foreground italic">
                                    Empty folder
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

/* =========================
   Explorer Root
========================= */

export const Explorer = ({ projectId }: { projectId: string }) => {
    const [isAdding, setIsAdding] = useState<"blob" | "folder" | null>(null);
    const [newItemName, setNewItemName] = useState("");

    const queryClient = useQueryClient();

    const { data: rootItems, isLoading } = useQuery({
        queryKey: ["explorer", projectId, "root"],
        queryFn: () => getExplorerItems(projectId, null),
    });

    const createMutation = useMutation({
        mutationFn: createExplorerItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["explorer", projectId] });
            setIsAdding(null);
            setNewItemName("");
            toast.success("Created");
        },
        onError: (err: any) => toast.error(err.message),
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        createMutation.mutate({
            name: newItemName.trim(),
            type: isAdding!,
            projectId,
        });
    };

    return (
        <div className="flex flex-col h-full bg-card/30 border-r border-primary/10 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase text-muted-foreground">
                    Explorer
                </h2>

                <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setIsAdding("blob")}>
                        <FilePlus className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setIsAdding("folder")}>
                        <FolderPlus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : (
                    <>
                        {rootItems?.map((item: any) => (
                            <ExplorerItem
                                key={item._id}
                                item={item}
                                depth={0}
                                projectId={projectId}
                            />
                        ))}

                        {isAdding && (
                            <form onSubmit={handleCreate} className="px-2 py-1">
                                <Input
                                    autoFocus
                                    value={newItemName}
                                    onChange={(e) =>
                                        setNewItemName(e.target.value)
                                    }
                                    onBlur={() =>
                                        !newItemName && setIsAdding(null)
                                    }
                                    placeholder={`New ${isAdding}`}
                                    className="h-7 text-xs"
                                />
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};