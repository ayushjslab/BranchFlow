"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProjectStore } from "@/store/useProjectStore";
import { getPaginatedFeatures } from "@/app/actions/task";
import WorkFilters from "@/components/shared/work-filters";
import WorkPagination from "@/components/shared/work-pagination";
import WorkCard from "@/components/shared/work-card";
import {
  HiOutlineEmojiSad,
  HiOutlinePlus,
  HiOutlinePresentationChartBar,
  HiOutlineRefresh,
  HiOutlineViewGrid,
  HiOutlineTable,
} from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useRouter } from "next/navigation";

/* ── Priority chip ─────────────────────────────────── */
const PriorityChip = ({ priority }: { priority: string }) => {
  const map: any = {
    low: { icon: Info, cls: "text-emerald-500 bg-emerald-500/10 ring-emerald-500/20", label: "Low" },
    medium: { icon: AlertTriangle, cls: "text-amber-500 bg-amber-500/10 ring-amber-500/20", label: "Medium" },
    high: { icon: AlertCircle, cls: "text-rose-500 bg-rose-500/10 ring-rose-500/20", label: "High" },
  };
  const { icon: Icon, cls, label } = map[priority] || map.low;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 text-[10px] font-black uppercase tracking-wider", cls)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

/* ── Status chip ───────────────────────────────────── */
const StatusChip = ({ status }: { status: string }) => {
  const map: any = {
    pending: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    "in-progress": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    done: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border", map[status] ?? map.pending)}>
      {status?.replace("-", " ")}
    </Badge>
  );
};

/* ── Table row ─────────────────────────────────────── */
const FeatureTableRow = ({ feature }: { feature: any }) => {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(`/work/features/${feature._id}`)}
      className="group border-b border-border/50 hover:bg-violet-500/5 transition-colors cursor-pointer"
    >
      <td className="py-3.5 px-4">
        <span className="text-sm font-semibold text-foreground group-hover:text-violet-500 transition-colors line-clamp-1">{feature.name}</span>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{feature.description}</p>
      </td>
      <td className="py-3.5 px-4"><PriorityChip priority={feature.priority} /></td>
      <td className="py-3.5 px-4">
        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-500">
          New Feature
        </Badge>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 border border-border">
            <AvatarImage src={feature.assigneeDetails?.image || feature.addedByDetails?.image} />
            <AvatarFallback className="text-[10px] font-bold bg-violet-500/10">
              {(feature.assigneeDetails?.name || feature.addedByDetails?.name)?.slice(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-semibold text-foreground truncate max-w-[100px]">
            {feature.assigneeDetails?.name || feature.addedByDetails?.name || "Unassigned"}
          </span>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <span className="text-xs font-semibold text-muted-foreground">
          {feature.dueDate ? format(new Date(feature.dueDate), "MMM dd, yyyy") : "—"}
        </span>
      </td>
    </tr>
  );
};

/* ── Table view ────────────────────────────────────── */
const TableView = ({ features }: { features: any[] }) => (
  <div className="rounded-2xl border border-border overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-secondary/60 border-b border-border">
          {["Feature", "Priority", "Type", "Visionary", "Target Date"].map((h) => (
            <th key={h} className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {features.map((f: any) => <FeatureTableRow key={f._id} feature={f} />)}
      </tbody>
    </table>
  </div>
);

/* ── Skeletons ─────────────────────────────────────── */
const CardSkeletons = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-40 bg-violet-500/5 rounded-2xl border border-violet-500/10 animate-pulse" />
    ))}
  </div>
);
const TableSkeletons = () => (
  <div className="rounded-2xl border border-border overflow-hidden">
    <div className="h-10 bg-secondary/60 border-b border-border" />
    {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-secondary/30 border-b border-border/50 animate-pulse" />)}
  </div>
);

/* ── Main Page ─────────────────────────────────────── */
const FeaturesPage = () => {
  const { selectedProject } = useProjectStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [view, setView] = useState<"card" | "table">("card");
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
            Please select a project from the navbar to view and manage its features.
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
            Discover and propose new capabilities for{" "}
            <span className="text-violet-500 font-bold">{selectedProject.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-secondary/60 rounded-xl p-1 border border-border gap-0.5">
            <Button
              size="icon" variant="ghost"
              onClick={() => setView("card")}
              title="Card view"
              className={cn("h-8 w-8 rounded-lg transition-all", view === "card" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <HiOutlineViewGrid className="w-4 h-4" />
            </Button>
            <Button
              size="icon" variant="ghost"
              onClick={() => setView("table")}
              title="Table view"
              className={cn("h-8 w-8 rounded-lg transition-all", view === "table" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <HiOutlineTable className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline" size="icon"
            onClick={() => refetch()}
            className="rounded-xl bg-secondary/60 border-border hover:bg-secondary h-10 w-10"
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

      {/* Content */}
      {isLoading ? (
        view === "card" ? <CardSkeletons /> : <TableSkeletons />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 bg-rose-500/5 rounded-3xl border border-rose-500/10 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
            <HiOutlineEmojiSad className="w-8 h-8 text-rose-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Failed to load features</h3>
            <p className="text-sm text-muted-foreground">There was an error fetching the features data.</p>
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
              {search || status !== "all" || priority !== "all"
                ? "Try adjusting your filters."
                : "Be the first to propose a new feature for this project."}
            </p>
          </div>
          {!search && status === "all" && priority === "all" && (
            <Button className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-2 h-10 px-6">
              <HiOutlinePlus className="w-4 h-4" />
              Propose Feature
            </Button>
          )}
        </div>
      ) : view === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature: any) => <WorkCard key={feature._id} item={feature} type="feature" />)}
        </div>
      ) : (
        <TableView features={features} />
      )}

      {/* Pagination */}
      {!isLoading && !isError && features.length > 0 && (
        <WorkPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
};

export default FeaturesPage;