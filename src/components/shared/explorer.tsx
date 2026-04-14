"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getExplorerItems,
    createExplorerItem,
    deleteExplorerItem,
    renameExplorerItem
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
    ClipboardCheck,
    RefreshCw,
    Bug as BugIcon,
    Sparkles,
    Edit2
} from "lucide-react";
import { CreateTaskDialog } from "./create-task-dialog";
import { CreateBugDialog } from "./create-bug-dialog";
import { CreateFeatureDialog } from "./create-feature-dialog";
import { useProjectStore } from "@/store/useProjectStore";
import { authClient } from "@/lib/auth-client";
import { getProjectMembers } from "@/app/actions/task";
import { getGithubSyncStatus } from "@/app/actions/project";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* =========================
   Explorer Item Component
========================= */

interface ExplorerItemProps {
    item: any;
    depth: number;
    projectId: string;
    userRole: "owner" | "manager" | "member" | null;
}

const ExplorerItem = ({ item, depth, projectId, userRole }: ExplorerItemProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState<"blob" | "folder" | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newItemName, setNewItemName] = useState("");
    const [renameName, setRenameName] = useState(item.name);
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [isBugDialogOpen, setIsBugDialogOpen] = useState(false);
    const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { setSelectedBlob, selectedBlob } = useProjectStore();

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
            setIsDeleteDialogOpen(false);
            toast.success("Deleted");
        },
    });

    /* ===== Rename ===== */
    const renameMutation = useMutation({
        mutationFn: ({ id, name }: { id: string, name: string }) => renameExplorerItem(id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["explorer", projectId] });
            setIsRenaming(false);
            toast.success("Renamed");
        },
        onError: (err: any) => toast.error(err.message),
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

    const handleRename = (e: React.FormEvent) => {
        e.preventDefault();
        if (!renameName.trim() || renameName === item.name) {
            setIsRenaming(false);
            return;
        }

        renameMutation.mutate({ id: item._id, name: renameName.trim() });
    };

    return (
        <div className="select-none">
            {/* ===== Row ===== */}
            <div
                className={cn(
                    "group flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer transition-all hover:bg-primary/5",
                    depth > 0 && "ml-4",
                    selectedBlob?._id === item._id && "bg-primary/10 border-primary/20 shadow-sm shadow-primary/5"
                )}
                onClick={() => {
                    if (item.type === "folder") {
                        setIsOpen((prev) => !prev);
                    } else {
                        setSelectedBlob(item);
                    }
                }}
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

                {/* Name or Rename Input */}
                {isRenaming ? (
                    <form onSubmit={handleRename} className="flex-1">
                        <Input
                            autoFocus
                            value={renameName}
                            onChange={(e) => setRenameName(e.target.value)}
                            onBlur={() => handleRename(new Event('submit') as any)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    setRenameName(item.name);
                                    setIsRenaming(false);
                                }
                            }}
                            className="h-7 text-sm border-primary/20 bg-background/50 focus-visible:ring-1"
                        />
                    </form>
                ) : (
                    <span className="text-sm truncate flex-1 font-medium group-hover:text-primary transition-colors">
                        {item.name}
                    </span>
                )}

                {item.type === "blob" && (
                    <div className="flex items-center gap-1.5 mr-2">
                        {/* Status/Type indicators could go here */}
                    </div>
                )}

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
                                <>
                                    {(userRole === "owner" || userRole === "manager") && (
                                        <DropdownMenuItem
                                            onClick={() => setIsTaskDialogOpen(true)}
                                            className="text-primary focus:text-primary focus:bg-primary/10"
                                        >
                                            <ClipboardCheck className="w-4 h-4 mr-2" />
                                            Create Task
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        onClick={() => setIsBugDialogOpen(true)}
                                        className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
                                    >
                                        <BugIcon className="w-4 h-4 mr-2" />
                                        Report Bug
                                    </DropdownMenuItem>
                                    {(userRole === "owner" || userRole === "manager") && (
                                        <DropdownMenuItem
                                            onClick={() => setIsFeatureDialogOpen(true)}
                                            className="text-violet-500 focus:text-violet-500 focus:bg-violet-500/10"
                                        >
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Propose Feature
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}

                            <DropdownMenuItem
                                onClick={() => setIsRenaming(true)}
                                className="text-muted-foreground"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Rename
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md rounded-3xl border-primary/10 bg-background/80 backdrop-blur-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2 text-destructive">
                            <Trash className="w-5 h-5" />
                            Delete {item.type === "folder" ? "Folder" : "File"}?
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium pt-2">
                            This will permanently delete <span className="font-bold text-foreground">"{item.name}"</span> and all of its contents.
                            {item.type === "blob" && (
                                <p className="mt-2 p-3 rounded-xl bg-destructive/5 border border-destructive/10 text-destructive text-xs font-bold uppercase tracking-widest">
                                    Warning: All linked tasks, bugs, and features will also be deleted.
                                </p>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-end gap-3 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="rounded-xl font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(item._id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-xl font-black shadow-lg shadow-destructive/20"
                        >
                            {deleteMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Delete Permanently"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {item.type === "blob" && (
                <>
                    <CreateTaskDialog
                        isOpen={isTaskDialogOpen}
                        onClose={() => setIsTaskDialogOpen(false)}
                        projectId={projectId}
                        blobId={item._id}
                        blobName={item.name}
                    />
                    <CreateBugDialog
                        isOpen={isBugDialogOpen}
                        onClose={() => setIsBugDialogOpen(false)}
                        projectId={projectId}
                        blobId={item._id}
                        blobName={item.name}
                    />
                    <CreateFeatureDialog
                        isOpen={isFeatureDialogOpen}
                        onClose={() => setIsFeatureDialogOpen(false)}
                        projectId={projectId}
                        blobId={item._id}
                        blobName={item.name}
                    />
                </>
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
                            {[...(children || [])].sort((a: any, b: any) => {
                                if (a.type === b.type) return a.name.localeCompare(b.name);
                                return a.type === "folder" ? -1 : 1;
                            }).map((child: any) => (
                                <ExplorerItem
                                    key={child._id}
                                    item={child}
                                    depth={depth + 1}
                                    projectId={projectId}
                                    userRole={userRole}
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
    const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
    const [syncOwner, setSyncOwner] = useState("");
    const [syncRepo, setSyncRepo] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);

    const queryClient = useQueryClient();

    const { data: rootItems, isLoading } = useQuery({
        queryKey: ["explorer", projectId, "root"],
        queryFn: () => getExplorerItems(projectId, null),
    });

    const { data: session } = authClient.useSession();
    const { data: members } = useQuery({
        queryKey: ["project-members", projectId],
        queryFn: () => getProjectMembers(projectId),
        enabled: !!projectId,
    });

    const userRole = (members?.find((m: any) => m.userId === session?.user?.id)?.role as any) || (members?.find((m: any) => m.userId === session?.user?.id) ? "member" : null);
    // Explicitly check for owner if needed, but getProjectMembers should have assigned 'owner' if I updated it.
    // Wait, getProjectMembers returns roles from project.members. 
    // If user is owner, the role in members should be 'owner' or I should check ownerId.
    // My getProjectRole helper on server does this. I should make sure getProjectMembers does too.

    // Actually, I'll use a safer role determination here.

    const isOwner = userRole === "owner";

    const { data: githubStatus } = useQuery({
        queryKey: ["github-status", projectId],
        queryFn: () => getGithubSyncStatus(projectId),
        enabled: isOwner,
    });
    // Show the GitHub sync button only if: owner + project not yet synced
    const showGithubButton = isOwner && !githubStatus?.hasSynced;
    // If the user already has a stored token, skip Step 1 in the dialog
    const hasGithubToken = !!githubStatus?.hasToken;

    const handleGithubAuth = () => {
        window.location.href = `/api/github/auth?projectId=${projectId}`;
    };

    const handleSync = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!syncOwner.trim() || !syncRepo.trim()) {
            toast.error("Please provide both the GitHub owner and repository name.");
            return;
        }

        setIsSyncing(true);
        try {
            const res = await fetch("/api/github/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, owner: syncOwner.trim(), repo: syncRepo.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Sync failed");
            toast.success(data.message || "GitHub sync complete!");
            setIsSyncDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["explorer", projectId] });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSyncing(false);
        }
    };

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
            <div className="p-4 border-b border-primary/10 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                        Explorer
                    </h2>
                </div>

                <div className="flex gap-1">
                    {showGithubButton && (
                        <>
                            <Button
                                size="icon"
                                variant="ghost"
                                title="Sync from GitHub"
                                className="h-7 w-7 rounded-lg hover:bg-primary/10 transition-all hover:scale-110 active:scale-95"
                                onClick={() => setIsSyncDialogOpen(true)}
                            >
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                </svg>
                            </Button>
                            <div className="w-px h-4 bg-primary/10 mx-0.5 mt-1.5" />
                        </>
                    )}
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg hover:bg-primary/10 transition-all hover:scale-110 active:scale-95"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["explorer", projectId] })}
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                    </Button>
                    <div className="w-px h-4 bg-primary/10 mx-0.5 mt-1.5" />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg hover:bg-primary/10 transition-all hover:scale-110 active:scale-95"
                        onClick={() => setIsAdding("blob")}
                    >
                        <FilePlus className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg hover:bg-primary/10 transition-all hover:scale-110 active:scale-95"
                        onClick={() => setIsAdding("folder")}
                    >
                        <FolderPlus className="w-3.5 h-3.5" />
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
                        {[...(rootItems || [])].sort((a: any, b: any) => {
                            if (a.type === b.type) return a.name.localeCompare(b.name);
                            return a.type === "folder" ? -1 : 1;
                        }).map((item: any) => (
                            <ExplorerItem
                                key={item._id}
                                item={item}
                                depth={0}
                                projectId={projectId}
                                userRole={userRole}
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

            {/* GitHub Sync Dialog */}
            <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
                <DialogContent className="max-w-md border-primary/10 bg-background/80 backdrop-blur-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                            </svg>
                            GitHub Sync
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground pt-1">
                            Connect GitHub and import a repository&apos;s full file structure. This is a <span className="font-bold text-foreground">one-time operation</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        {/* Step 1: GitHub Auth — only shown if user has no stored token */}
                        {!hasGithubToken ? (
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                                <p className="text-xs font-black uppercase tracking-widest text-primary">Step 1 — Connect GitHub</p>
                                <p className="text-[11px] text-muted-foreground">Authenticate with GitHub to allow BranchFlow to read your repository.</p>
                                <Button
                                    variant="outline"
                                    className="w-full font-black rounded-xl border-primary/20"
                                    onClick={handleGithubAuth}
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2" fill="currentColor">
                                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                    </svg>
                                    Login with GitHub
                                </Button>
                            </div>
                        ) : (
                            <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-emerald-500">GitHub Connected</p>
                                    <p className="text-[11px] text-muted-foreground">You&apos;re authenticated. Enter your repo details below.</p>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Repo input & Sync */}
                        <form onSubmit={handleSync} className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                            <p className="text-xs font-black uppercase tracking-widest text-primary">Step 2 — Import Repository</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase tracking-wider">Owner</Label>
                                    <Input
                                        value={syncOwner}
                                        onChange={(e) => setSyncOwner(e.target.value)}
                                        placeholder="e.g. octocat"
                                        className="h-9 text-sm rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase tracking-wider">Repository</Label>
                                    <Input
                                        value={syncRepo}
                                        onChange={(e) => setSyncRepo(e.target.value)}
                                        placeholder="e.g. hello-world"
                                        className="h-9 text-sm rounded-xl"
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={isSyncing}
                                className="w-full font-black rounded-xl shadow-lg shadow-primary/20"
                            >
                                {isSyncing ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</>
                                ) : (
                                    "Sync Repository"
                                )}
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};