"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTask, getProjectMembers } from "@/app/actions/task";
import { authClient } from "@/lib/auth-client";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
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
import { Loader2, ShieldCheck, AlertCircle, AlertTriangle, Info } from "lucide-react";
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
    blobName,
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
        if (currentUserRole === "manager") return member.role === "member" || member.role === "manager";
        return true;
    });

    const mutation = useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId, blobId] });
            toast.success("Task created successfully");
            onClose();
            setName(""); setDescription(""); setPriority("medium"); setAssignee(""); setDueDate("");
        },
        onError: (error: any) => toast.error(error.message),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description || !assignee || !dueDate) {
            toast.error("Please fill in all required fields");
            return;
        }
        mutation.mutate({ name, description, priority, assignee, dueDate: new Date(dueDate), projectId, blobId, status: "pending" });
    };

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
            <DrawerContent style={{ width: '50vw', maxWidth: '50vw' }} className="h-full top-0 bottom-0 right-0 left-auto rounded-none rounded-l-2xl border-l border-border flex flex-col bg-background">
                {/* Header */}
                <DrawerHeader className="border-b border-border px-6 py-5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/15">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 text-left">
                            <DrawerTitle className="text-lg font-black tracking-tight">Create Task</DrawerTitle>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                                Linked to <span className="text-primary font-black">{blobName}</span>
                            </p>
                        </div>
                    </div>
                </DrawerHeader>

                {/* Scrollable form body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Task Name</Label>
                            <Input
                                placeholder="Identify the objective..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="rounded-xl h-11 font-medium bg-secondary/50 border-border"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                            <Textarea
                                placeholder="Provide comprehensive details about this task..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="rounded-xl min-h-[140px] font-medium resize-none bg-secondary/50 border-border"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority</Label>
                                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                    <SelectTrigger className="rounded-xl h-11 bg-secondary/50 border-border">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="low" className="text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10">
                                            <div className="flex items-center gap-2 font-bold text-xs"><Info className="w-3.5 h-3.5" /> Low</div>
                                        </SelectItem>
                                        <SelectItem value="medium" className="text-amber-500 focus:text-amber-500 focus:bg-amber-500/10">
                                            <div className="flex items-center gap-2 font-bold text-xs"><AlertTriangle className="w-3.5 h-3.5" /> Medium</div>
                                        </SelectItem>
                                        <SelectItem value="high" className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10">
                                            <div className="flex items-center gap-2 font-bold text-xs"><AlertCircle className="w-3.5 h-3.5" /> High</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deadline</Label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="rounded-xl h-11 bg-secondary/50 border-border cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assignee</Label>
                            <Select value={assignee} onValueChange={setAssignee} disabled={isLoadingMembers}>
                                <SelectTrigger className="rounded-xl h-11 bg-secondary/50 border-border">
                                    <SelectValue placeholder={isLoadingMembers ? "Loading..." : "Select member"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {filteredMembers?.map((member: any) => (
                                        <SelectItem key={member.userId || member.id || member._id} value={member.userId || member.id || member._id}>
                                            <div className="flex items-center gap-2 py-0.5">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={member.image} />
                                                    <AvatarFallback className="text-[10px] font-black bg-primary/10">{member.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col text-left">
                                                    <span className="text-xs font-bold">{member.name}</span>
                                                    <span className="text-[9px] opacity-50 uppercase">{member.role}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Footer */}
                    <DrawerFooter className="border-t border-border px-6 py-4 flex-row justify-between shrink-0">
                        <DrawerClose asChild>
                            <Button type="button" variant="ghost" className="rounded-xl font-bold text-muted-foreground">
                                Cancel
                            </Button>
                        </DrawerClose>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="rounded-xl px-8 h-11 font-black bg-primary text-primary-foreground shadow-lg"
                        >
                            {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Task"}
                        </Button>
                    </DrawerFooter>
                </form>
            </DrawerContent>
        </Drawer>
    );
};
