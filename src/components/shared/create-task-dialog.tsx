"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTask, getProjectMembers } from "@/app/actions/task";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ShieldCheck, User as UserIcon, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface CreateTaskDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    blobId: string;
    blobName: string;
}

export const CreateTaskDialog = ({
    isOpen,
    onClose,
    projectId,
    blobId,
    blobName
}: CreateTaskDialogProps) => {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [type, setType] = useState<"task" | "bug" | "feature">("task");
    const [assignee, setAssignee] = useState("");
    const [dueDate, setDueDate] = useState("");

    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ["project-members", projectId],
        queryFn: () => getProjectMembers(projectId),
        enabled: isOpen,
    });

    const mutation = useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
            toast.success("Task created successfully");
            onClose();
            // Reset form
            setName("");
            setDescription("");
            setPriority("medium");
            setAssignee("");
            setDueDate("");
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description || !assignee || !dueDate) {
            toast.error("Please fill in all required fields");
            return;
        }

        mutation.mutate({
            name,
            description,
            priority,
            type,
            assignee,
            dueDate: new Date(dueDate),
            projectId,
            blobId,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">Create Task</DialogTitle>
                    <p className="text-xs text-muted-foreground">
                        Create a task linked to <span className="text-primary font-bold">{blobName}</span>
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider opacity-60">Task Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Fix styling bugs"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-primary/5 border-primary/10 rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider opacity-60">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe what needs to be done..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-primary/5 border-primary/10 rounded-xl min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Type</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger className="bg-primary/5 border-primary/10 rounded-xl">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="task">Task</SelectItem>
                                    <SelectItem value="bug">Bug</SelectItem>
                                    <SelectItem value="feature">Feature</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Priority</Label>
                            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                <SelectTrigger className="bg-primary/5 border-primary/10 rounded-xl">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low" className="text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10">
                                        <div className="flex items-center gap-2">
                                            <Info className="w-3.5 h-3.5" />
                                            <span>Low</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="medium" className="text-amber-500 focus:text-amber-500 focus:bg-amber-500/10">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            <span>Medium</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="high" className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>High</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Assignee</Label>
                            <Select value={assignee} onValueChange={setAssignee} disabled={isLoadingMembers}>
                                <SelectTrigger className="bg-primary/5 border-primary/10 rounded-xl">
                                    <SelectValue placeholder={isLoadingMembers ? "Loading..." : "Select User"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {members?.map((member: any) => (
                                        <SelectItem key={member.userId} value={member.userId}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={member.image} />
                                                    <AvatarFallback className="text-[10px] bg-primary/10">
                                                        {member.name?.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{member.name}</span>
                                                    <span className="text-[10px] opacity-50 capitalize">{member.role}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dueDate" className="text-xs font-bold uppercase tracking-wider opacity-60">Due Date</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="bg-primary/5 border-primary/10 rounded-xl scheme-dark"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="rounded-xl px-8 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:translate-y-[-2px] transition-transform"
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Task"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
