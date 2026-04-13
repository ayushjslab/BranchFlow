import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProjectState {
    selectedProject: any | null;
    setSelectedProject: (project: any | null) => void;
    selectedBlob: any | null;
    setSelectedBlob: (blob: any | null) => void;
    reset: () => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            selectedProject: null,
            setSelectedProject: (project) => set({ selectedProject: project }),
            selectedBlob: null,
            setSelectedBlob: (blob) => set({ selectedBlob: blob }),
            reset: () => set({ selectedProject: null, selectedBlob: null }),
        }),
        {
            name: "project-storage",
        }
    )
);
