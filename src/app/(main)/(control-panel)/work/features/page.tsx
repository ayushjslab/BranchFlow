"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProjectStore } from "@/store/useProjectStore";
import { getPaginatedFeatures } from "@/app/actions/task";
import WorkFilters from "@/components/shared/work-filters";
import WorkPagination from "@/components/shared/work-pagination";
import WorkCard from "@/components/shared/work-card";
import { HiOutlineEmojiSad, HiOutlinePlus, HiOutlinePresentationChartBar, HiOutlineRefresh } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FeaturesPage = () => {
  const { selectedProject } = useProjectStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const limit = 10;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["features", selectedProject?._id, page, search, status, priority],
    queryFn: async () => {
      if (!selectedProject?._id) return null;
      return getPaginatedFeatures({
        projectId: selectedProject._id,
        page,
        limit,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        priority: priority === "all" ? undefined : priority,
      });
    },
    enabled: !!selectedProject?._id,
  });

  const features = data?.items || [];
  const totalPages = data?.totalPages || 1;

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center">
          <HiOutlinePresentationChartBar className="w-8 h-8 text-violet-500 opacity-40" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">No Project Selected</h2>
          <p className="text-muted-foreground text-sm max-w-[300px]">
            Please select a project from the sidebar to view and manage its features.
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
            <HiOutlinePresentationChartBar className="text-violet-500" />
            Feature Announcements
          </h1>
          <p className="text-muted-foreground font-medium">
            Discover and propose new features for <span className="text-violet-500 font-bold">{selectedProject.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="rounded-xl bg-violet-500/5 border-violet-500/10 hover:bg-violet-500/10 transition-all h-10 w-10"
          >
            <HiOutlineRefresh className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
          <Button className="rounded-xl shadow-lg shadow-violet-500/20 bg-violet-600 hover:bg-violet-700 text-white font-bold h-10 px-6 gap-2">
            <HiOutlinePlus className="w-4 h-4" />
            New Feature
          </Button>
        </div>
      </div>

      {/* Filters */}
      <WorkFilters
        type="feature"
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
            <div key={i} className="h-40 bg-violet-500/5 rounded-2xl border border-violet-500/10 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 bg-rose-500/5 rounded-3xl border border-rose-500/10 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
            <HiOutlineEmojiSad className="w-8 h-8 text-rose-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Failed to load features</h3>
            <p className="text-sm text-muted-foreground">There was an error fetching the features data. Please try again.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="rounded-xl">Try Again</Button>
        </div>
      ) : features.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-violet-500/5 rounded-3xl border border-violet-500/10 text-center space-y-4">
          <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center">
            <HiOutlinePresentationChartBar className="w-8 h-8 text-violet-500 opacity-40" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">No features found</h3>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Try adjusting your search to find what you're looking for."
                : "Be the first to propose a new feature for this project."}
            </p>
          </div>
          {!search && (
            <Button className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-2 h-10 px-6">
              <HiOutlinePlus className="w-4 h-4" />
              Propose Feature
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature: any) => (
            <WorkCard key={feature._id} item={feature} type="feature" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && features.length > 0 && (
        <WorkPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default FeaturesPage;