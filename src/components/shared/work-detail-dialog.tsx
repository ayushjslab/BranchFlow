"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { HiOutlineFolder, HiOutlineClock, HiOutlineTrash, HiOutlinePencil, HiOutlineCheck } from "react-icons/hi";
import { cn } from "@/lib/utils";
import { updateWorkItem, deleteWorkItem, getProjectMembers } from "@/app/actions/task";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface WorkDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    type: "task" | "bug" | "feature";
    isOwner: boolean;
}

const WorkDetailDialog = ({ isOpen, onClose, item, type, isOwner }: WorkDetailDialogProps) => {
    const queryClient = useQueryClient();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "",
        priority: "",
        assignee: ""
    });

    // Reset form when item changes or dialog opens
    useEffect(() => {
        if (isOpen && item) {
            setFormData({
                name: item.name || "",
                description: item.description || "",
                status: item.status || "todo",
                priority: item.priority || "low",
                assignee: item.assignee || item.fixedBy || ""
            });
            setIsEditing(false);
        }
    }, [isOpen, item]);

    const { data: members = [] } = useQuery({
        queryKey: ["project-members", item?.projectId],
        queryFn: async () => {
            const data = await getProjectMembers(item?.projectId);
            console.log("Fetched members:", data);
            return data;
        },
        enabled: isOpen && isEditing && !!item?.projectId,
    });

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        setIsDeleting(true);
        try {
            await deleteWorkItem({ id: item._id, type });
            queryClient.invalidateQueries({ queryKey: [type + "s"] });
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to delete item");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updateData: any = {
                name: formData.name,
                description: formData.description,
            };

            if (type !== "feature") {
                updateData.status = formData.status;
                updateData.priority = formData.priority;
                if (type === "bug") {
                    updateData.fixedBy = formData.assignee;
                } else {
                    updateData.assignee = formData.assignee;
                }
            }

            await updateWorkItem({
                id: item._id,
                type,
                data: updateData
            });

            queryClient.invalidateQueries({ queryKey: [type + "s"] });
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert("Failed to update item");
        } finally {
            setIsSaving(false);
        }
    };

    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-background/80 backdrop-blur-2xl border-primary/10 rounded-3xl p-0 overflow-hidden shadow-2xl">
                <div className={cn(
                    "h-2 w-full",
                    type === "bug" ? "bg-rose-500" : type === "feature" ? "bg-violet-500" : "bg-primary"
                )} />

                <div className="p-8 space-y-8">
                    <DialogHeader>
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <Badge variant="outline" className="uppercase text-[10px] font-black tracking-widest px-3 py-1 bg-primary/5 border-primary/10">
                                {type}
                            </Badge>
                            {!isEditing && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <HiOutlineClock className="w-3.5 h-3.5" />
                                        Last Updated: {format(new Date(item.updatedAt || item.createdAt), "MMM dd, HH:mm")}
                                    </span>
                                </div>
                            )}
                        </div>
                        {isEditing ? (
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Heading</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-primary/5 border-primary/10 rounded-xl h-12 font-bold text-lg focus-visible:ring-primary/20"
                                        placeholder="Task Title"
                                    />
                                </div>
                            </div>
                        ) : (
                            <DialogTitle className="text-2xl font-black tracking-tight leading-tight pt-2">
                                {item.name}
                            </DialogTitle>
                        )}
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Description</h4>
                            {isEditing ? (
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-primary/5 border-primary/10 rounded-2xl min-h-[120px] p-4 text-sm leading-relaxed focus-visible:ring-primary/20 resize-none"
                                    placeholder="Add more details about this work item..."
                                />
                            ) : (
                                <div className="bg-primary/3 border border-primary/5 rounded-2xl p-4">
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {item.description || "No description provided."}
                                    </p>
                                </div>
                            )}
                        </div>

                        {isEditing && type !== "feature" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Status</label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(v) => setFormData({ ...formData, status: v })}
                                    >
                                        <SelectTrigger className="bg-primary/5 border-primary/10 rounded-xl h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todo">To Do</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="done">Done</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Priority</label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(v) => setFormData({ ...formData, priority: v })}
                                    >
                                        <SelectTrigger className="bg-primary/5 border-primary/10 rounded-xl h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-primary/5">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                                    {isEditing && type !== "feature" ? "Assignee" : "Location"}
                                </h4>
                                {isEditing && type !== "feature" ? (
                                    <Select
                                        value={formData.assignee}
                                        onValueChange={(v) => setFormData({ ...formData, assignee: v })}
                                    >
                                        <SelectTrigger className="bg-primary/5 border-primary/10 rounded-xl h-10">
                                            <SelectValue placeholder="Select Assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {members.map((m: any) => (
                                                <SelectItem key={m.userId} value={m.userId}>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-4 w-4">
                                                            <AvatarImage src={m.image} />
                                                            <AvatarFallback className="text-[6px] font-bold">{m.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs font-medium">{m.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="flex items-center gap-3 text-sm font-bold opacity-80">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <HiOutlineFolder className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="truncate">{item.filePath || "Root Directory"}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Created By</h4>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 border-2 border-primary/10">
                                        <AvatarImage src={item.creatorDetails?.image || item.reporterDetails?.image || item.addedByDetails?.image} />
                                        <AvatarFallback className="text-[10px] font-bold">
                                            {(item.creatorDetails?.name || item.reporterDetails?.name || item.addedByDetails?.name)?.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{item.creatorDetails?.name || item.reporterDetails?.name || item.addedByDetails?.name}</span>
                                        <span className="text-[10px] uppercase font-bold opacity-40">Creator</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-6 border-t border-primary/5 flex items-center justify-between sm:justify-between">
                        <div className="flex items-center gap-2">
                            {isOwner && !isEditing && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl"
                                >
                                    <HiOutlineTrash className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={isEditing ? () => setIsEditing(false) : onClose} className="rounded-xl border-primary/10 h-10 px-6 font-bold hover:bg-primary/5 transition-colors">
                                {isEditing ? "Cancel" : "Close"}
                            </Button>
                            {isOwner && (
                                <Button
                                    onClick={isEditing ? handleSave : () => setIsEditing(true)}
                                    disabled={isSaving}
                                    className="rounded-xl bg-primary text-primary-foreground h-10 px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                >
                                    {isEditing ? (
                                        <>
                                            {isSaving ? (
                                                <HiOutlineClock className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <HiOutlineCheck className="w-4 h-4 mr-2" />
                                            )}
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </>
                                    ) : (
                                        <>
                                            <HiOutlinePencil className="w-4 h-4 mr-2" />
                                            Edit Details
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default WorkDetailDialog;
