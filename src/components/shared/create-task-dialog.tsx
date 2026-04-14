"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTask, getProjectMembers } from "@/app/actions/task";
import { authClient } from "@/lib/auth-client";
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
    const [assignee, setAssignee] = useState("");
    const [dueDate, setDueDate] = useState("");

    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ["project-members", projectId],
        queryFn: () => getProjectMembers(projectId),
        enabled: isOpen,
    });

    const { data: session } = authClient.useSession();
    const currentUserRole = members?.find((m: any) => m.userId === session?.user?.id)?.role;

    const filteredMembers = members?.filter((member: any) => {
        if (currentUserRole === "manager") {
            // Managers can only assign to members and other managers
            return member.role === "member" || member.role === "manager";
        }
        return true; // Owners can assign to anyone
    });

    const mutation = useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId, blobId] });
            toast.success("Task created successfully");
            onClose();
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
            assignee,
            dueDate: new Date(dueDate),
            projectId,
            blobId,
            status: "pending",
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-card/60 backdrop-blur-3xl border-primary/10">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 text-left">
                            <DialogTitle className="text-xl font-black tracking-tight">Create Task</DialogTitle>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                                Assigned to <span className="text-primary font-black underline underline-offset-4">{blobName}</span>
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-[0.15em] opacity-40 ml-1">Task Name</Label>
                        <Input
                            id="name"
                            placeholder="Identify the objective..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-primary/5 border-primary/10 rounded-xl h-11 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-black uppercase tracking-[0.15em] opacity-40 ml-1">Execution Details</Label>
                        <Textarea
                            id="description"
                            placeholder="Provide comprehensive details about this task..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-primary/5 border-primary/10 rounded-xl min-h-[120px] focus:ring-primary/20 transition-all font-medium resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-[0.15em] opacity-40 ml-1">Priority</Label>
                            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                <SelectTrigger className="bg-primary/5 border-primary/10 rounded-xl h-11 hover:bg-primary/10 transition-all">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-primary/10">
                                    <SelectItem value="low" className="text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10 transition-colors">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                                            <Info className="w-3.5 h-3.5" />
                                            <span>low</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="medium" className="text-amber-500 focus:text-amber-500 focus:bg-amber-500/10 transition-colors">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            <span>medium</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="high" className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 transition-colors">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>high</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-[0.15em] opacity-40 ml-1">Assignee</Label>
                            <Select value={assignee} onValueChange={setAssignee} disabled={isLoadingMembers}>
                                <SelectTrigger className="bg-primary/5 border-primary/10 rounded-xl h-11 hover:bg-primary/10 transition-all">
                                    <SelectValue placeholder={isLoadingMembers ? "Sync..." : "Operator"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-primary/10">
                                    {filteredMembers?.map((member: any) => (
                                        <SelectItem key={member.userId || member.id || member._id} value={member.userId || member.id || member._id}>
                                            <div className="flex items-center gap-2 py-0.5">
                                                <Avatar className="h-6 w-6 border border-primary/10">
                                                    <AvatarImage src={member.image} />
                                                    <AvatarFallback className="text-[10px] bg-primary/10 font-black">
                                                        {member.name?.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col text-left">
                                                    <span className="text-xs font-black tracking-tight">{member.name}</span>
                                                    <span className="text-[9px] opacity-40 font-bold uppercase tracking-widest">{member.role}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dueDate" className="text-xs font-black uppercase tracking-[0.15em] opacity-40 ml-1">Deadline</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="bg-primary/5 border-primary/10 rounded-xl h-11 transition-all font-black uppercase text-[10px] tracking-widest cursor-pointer scheme-dark"
                        />
                    </div>

                    <DialogFooter className="pt-4 flex items-center justify-between sm:justify-between w-full">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl font-bold uppercase text-[10px] tracking-widest opacity-40 hover:opacity-100 transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="rounded-xl px-10 h-11 font-black uppercase text-[11px] tracking-widest bg-primary text-primary-foreground shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Processing
                                </>
                            ) : (
                                "Initiate Task"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
