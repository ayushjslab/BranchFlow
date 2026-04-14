"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBug, getProjectMembers } from "@/app/actions/task";
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
import { Loader2, Bug, AlertCircle, AlertTriangle, Info, User as UserIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CreateBugDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    blobId: string;
    blobName: string;
}

export const CreateBugDialog = ({
    isOpen,
    onClose,
    projectId,
    blobId,
    blobName
}: CreateBugDialogProps) => {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("high");
    const [fixedBy, setFixedBy] = useState("");
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
            // Managers can only assign bug fixes to members and other managers
            return member.role === "member" || member.role === "manager";
        }
        return true; // Owners can assign to anyone
    });

    const mutation = useMutation({
        mutationFn: createBug,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bugs", projectId, blobId] });
            toast.success("Bug report initiated");
            onClose();
            setName("");
            setDescription("");
            setPriority("high");
            setFixedBy("");
            setDueDate("");
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description || !dueDate) {
            toast.error("Please fill in all required fields (Name, Description, Deadline)");
            return;
        }

        mutation.mutate({
            name,
            description,
            priority,
            fixedBy: fixedBy || undefined,
            dueDate: new Date(dueDate),
            projectId,
            blobId,
            status: "pending"
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-card/60 backdrop-blur-3xl border-rose-500/10">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/5">
                            <Bug className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="space-y-0.5 text-left">
                            <DialogTitle className="text-xl font-black tracking-tight text-rose-500">Report Defect</DialogTitle>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                                Trace issue in <span className="text-rose-500 font-black underline underline-offset-4">{blobName}</span>
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-[0.15em] text-rose-500/40 ml-1">Defect ID/Title</Label>
                        <Input
                            id="name"
                            placeholder="Brief summary of the glitch..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-rose-500/5 border-rose-500/10 rounded-xl h-11 focus:ring-rose-500/20 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-black uppercase tracking-[0.15em] text-rose-500/40 ml-1">Anomalous Behavior</Label>
                        <Textarea
                            id="description"
                            placeholder="Detail the steps to reproduce or behavior observed..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-rose-500/5 border-rose-500/10 rounded-xl min-h-[100px] focus:ring-rose-500/20 transition-all font-medium resize-none text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label className="text-xs font-black uppercase tracking-[0.15em] text-rose-500/40 ml-1">Severity / Priority</Label>
                            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                <SelectTrigger className="bg-rose-500/5 border-rose-500/10 rounded-xl h-11 hover:bg-rose-500/10 transition-all">
                                    <SelectValue placeholder="Criticality" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-rose-500/10">
                                    <SelectItem value="low" className="text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10 transition-colors">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                                            <Info className="w-3.5 h-3.5" />
                                            <span>Minor</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="medium" className="text-amber-500 focus:text-amber-500 focus:bg-amber-500/10 transition-colors">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            <span>Standard</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="high" className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 transition-colors">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px]">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>Critical</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>


                        <div className="space-y-2 col-span-2">
                            <Label className="text-xs font-black uppercase tracking-[0.15em] text-rose-500/40 ml-1">Fixer (Optional)</Label>
                            <Select value={fixedBy} onValueChange={setFixedBy} disabled={isLoadingMembers}>
                                <SelectTrigger className="bg-rose-500/5 border-rose-500/10 rounded-xl h-11 hover:bg-rose-500/10 transition-all">
                                    <SelectValue placeholder={isLoadingMembers ? "Sync..." : "Assigned"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-rose-500/10">
                                    {filteredMembers?.map((member: any) => (
                                        <SelectItem key={member.userId || member.id || member._id} value={member.userId || member.id || member._id}>
                                            <div className="flex items-center gap-2 py-0.5">
                                                <Avatar className="h-6 w-6 border border-rose-500/10">
                                                    <AvatarImage src={member.image} />
                                                    <AvatarFallback className="text-[10px] bg-rose-500/10 font-black">
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
                        <Label htmlFor="dueDate" className="text-xs font-black uppercase tracking-[0.15em] text-rose-500/40 ml-1">Target Resolution</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="bg-rose-500/5 border-rose-500/10 rounded-xl h-11 transition-all font-black uppercase text-[10px] tracking-widest cursor-pointer scheme-dark"
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
                            className="rounded-xl px-10 h-11 font-black uppercase text-[11px] tracking-widest bg-rose-600 text-white shadow-2xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Analyzing
                                </>
                            ) : (
                                "Commit Bug"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
