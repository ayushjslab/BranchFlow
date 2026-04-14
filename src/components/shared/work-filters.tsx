"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HiOutlineSearch, HiOutlineFilter } from "react-icons/hi";

interface WorkFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    status: string;
    onStatusChange: (value: string) => void;
    priority: string;
    onPriorityChange: (value: string) => void;
    type: "task" | "bug" | "feature";
}

const WorkFilters = ({
    search,
    onSearchChange,
    status,
    onStatusChange,
    priority,
    onPriorityChange,
    type
}: WorkFiltersProps) => {
    return (
        <div className="flex flex-col md:flex-row items-center gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10 backdrop-blur-sm">
            <div className="relative flex-1 w-full">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    placeholder={`Search ${type}s...`}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 bg-background/50 border-primary/10 focus:border-primary/20 transition-all rounded-xl h-10"
                />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                {type !== "feature" && (
                    <>
                        <Select value={status} onValueChange={onStatusChange}>
                            <SelectTrigger className="w-full md:w-[140px] bg-background/50 border-primary/10 rounded-xl h-10">
                                <div className="flex items-center gap-2">
                                    <HiOutlineFilter className="w-3.5 h-3.5 opacity-60" />
                                    <SelectValue placeholder="Status" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-background/80 backdrop-blur-xl border-primary/10 rounded-xl">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={priority} onValueChange={onPriorityChange}>
                            <SelectTrigger className="w-full md:w-[140px] bg-background/50 border-primary/10 rounded-xl h-10">
                                <div className="flex items-center gap-2">
                                    <HiOutlineFilter className="w-3.5 h-3.5 opacity-60" />
                                    <SelectValue placeholder="Priority" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-background/80 backdrop-blur-xl border-primary/10 rounded-xl">
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </>
                )}
            </div>
        </div>
    );
};

export default WorkFilters;
