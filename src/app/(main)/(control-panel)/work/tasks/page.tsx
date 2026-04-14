"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProjectStore } from "@/store/useProjectStore";
import { getPaginatedTasks } from "@/app/actions/task";
import WorkFilters from "@/components/shared/work-filters";
import WorkPagination from "@/components/shared/work-pagination";
import WorkCard from "@/components/shared/work-card";
import { HiOutlineEmojiSad, HiOutlinePlus, HiOutlineClipboardList, HiOutlineRefresh } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TasksPage = () => {
  const { selectedProject } = useProjectStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const limit = 10;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tasks", selectedProject?._id, page, search, status, priority],
    queryFn: async () => {
      if (!selectedProject?._id) return null;
      return getPaginatedTasks({
        projectId: selectedProject._id,
        page,
        limit,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        priority: priority === "all" ? undefined : priority
      });
    },
    enabled: !!selectedProject?._id,
  });

  const tasks = data?.items || [];
  const totalPages = data?.totalPages || 1;

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <HiOutlineClipboardList className="w-8 h-8 text-primary opacity-40" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">No Project Selected</h2>
          <p className="text-muted-foreground text-sm max-w-[300px]">
            Please select a project from the sidebar to view and manage its tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <HiOutlineClipboardList className="text-primary" />
            Project Tasks
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage and track execution items for <span className="text-primary font-bold">{selectedProject.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="rounded-xl bg-primary/5 border-primary/10 hover:bg-primary/10 transition-all h-10 w-10"
          >
            <HiOutlineRefresh className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
          <Button className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-6 gap-2">
            <HiOutlinePlus className="w-4 h-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <WorkFilters
        type="task"
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        priority={priority}
        onPriorityChange={(v) => { setPriority(v); setPage(1); }}
      />

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-primary/5 rounded-2xl border border-primary/10 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 bg-rose-500/5 rounded-3xl border border-rose-500/10 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
            <HiOutlineEmojiSad className="w-8 h-8 text-rose-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Failed to load tasks</h3>
            <p className="text-sm text-muted-foreground">There was an error fetching the tasks data. Please try again.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="rounded-xl">Try Again</Button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-primary/5 rounded-3xl border border-primary/10 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <HiOutlineClipboardList className="w-8 h-8 text-primary opacity-40" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">No tasks found</h3>
            <p className="text-sm text-muted-foreground">
              {search || status !== "all" || priority !== "all"
                ? "Try adjusting your filters to find what you're looking for."
                : "Get started by creating your first task for this project."}
            </p>
          </div>
          {!search && status === "all" && priority === "all" && (
            <Button className="rounded-xl gap-2 h-10 px-6">
              <HiOutlinePlus className="w-4 h-4" />
              Create Task
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task: any) => (
            <WorkCard key={task._id} item={task} type="task" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && tasks.length > 0 && (
        <WorkPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default TasksPage;