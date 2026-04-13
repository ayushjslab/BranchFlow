"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ResizableContextType {
  direction: "horizontal" | "vertical";
  panelSizes: number[];
  setPanelSize: (index: number, size: number) => void;
  registerPanel: (index: number, initialSize: number) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

const ResizableContext = createContext<ResizableContextType | null>(null);

export const ResizablePanelGroup = ({
  children,
  direction = "horizontal",
  className,
  id
}: {
  children: React.ReactNode;
  direction?: "horizontal" | "vertical";
  className?: string;
  id?: string;
}) => {
  const [panelSizes, setPanelSizes] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const registerPanel = useCallback((index: number, initialSize: number) => {
    setPanelSizes((prev) => {
      const next = [...prev];
      next[index] = initialSize;
      return next;
    });
  }, []);

  const setPanelSize = useCallback((index: number, size: number) => {
    setPanelSizes((prev) => {
      const next = [...prev];
      next[index] = size;
      return next;
    });
  }, []);

  return (
    <ResizableContext.Provider value={{ direction, panelSizes, setPanelSize, registerPanel, isDragging, setIsDragging }}>
      <div
        id={id}
        ref={containerRef}
        className={cn(
          "flex w-full h-full overflow-hidden",
          direction === "vertical" ? "flex-col" : "flex-row",
          isDragging && "select-none",
          className
        )}
      >
        {children}
      </div>
    </ResizableContext.Provider>
  );
};

export const ResizablePanel = ({
  children,
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  className,
  order = 0
}: {
  children: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
  order?: number;
}) => {
  const context = useContext(ResizableContext);
  if (!context) throw new Error("ResizablePanel must be used within ResizablePanelGroup");

  const { direction, panelSizes, registerPanel } = context;

  useEffect(() => {
    registerPanel(order, defaultSize);
  }, [order, defaultSize, registerPanel]);

  const size = panelSizes[order] ?? defaultSize;

  return (
    <div
      style={{
        [direction === "horizontal" ? "width" : "height"]: `${size}%`,
        flex: "none"
      }}
      className={cn(
        "overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
};

export const ResizableHandle = ({
  withHandle,
  className,
  order = 0
}: {
  withHandle?: boolean;
  className?: string;
  order?: number;
}) => {
  const context = useContext(ResizableContext);
  if (!context) throw new Error("ResizableHandle must be used within ResizablePanelGroup");

  const { direction, setPanelSize, panelSizes, setIsDragging } = context;
  const isHorizontal = direction === "horizontal";

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startPos = isHorizontal ? e.clientX : e.clientY;
    const startSize = panelSizes[order];
    const nextPanelStartSize = panelSizes[order + 1];

    const container = (e.currentTarget.parentElement as HTMLElement);
    const containerSize = isHorizontal ? container.offsetWidth : container.offsetHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
      const delta = ((currentPos - startPos) / containerSize) * 100;

      const newSize = Math.max(5, Math.min(95, startSize + delta));
      const newNextSize = Math.max(5, Math.min(95, nextPanelStartSize - delta));

      setPanelSize(order, newSize);
      setPanelSize(order + 1, newNextSize);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        "relative flex items-center justify-center bg-border hover:bg-primary/20 transition-colors z-10",
        isHorizontal ? "w-1 cursor-col-resize h-full" : "h-1 cursor-row-resize w-full",
        className
      )}
    >
      {withHandle && (
        <div className={cn(
          "bg-muted-foreground/30 rounded-full",
          isHorizontal ? "w-0.5 h-8" : "h-0.5 w-8"
        )} />
      )}
    </div>
  );
};
