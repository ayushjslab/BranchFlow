"use client";

import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProps } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { HiOutlineDotsVertical, HiOutlineClock, HiOutlineLink } from "react-icons/hi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// React 19 Strict Mode Droppable Helper
const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);
    if (!enabled) return null;
    return <Droppable {...props}>{children}</Droppable>;
};

interface KanbanItem {
    _id: string;
    name: string;
    description: string;
    status: string;
    priority?: string;
    filePath?: string;
    [key: string]: any;
}

interface KanbanBoardProps {
    items: KanbanItem[];
    columns: { id: string; title: string; color: string }[];
    onMove: (id: string, newStatus: string, newPosition: number) => void;
    type: "task" | "bug" | "feature";
}

const KanbanBoard = ({ items, columns, onMove, type }: KanbanBoardProps) => {
    const [boardData, setBoardData] = useState<Record<string, KanbanItem[]>>({});

    useEffect(() => {
        const initialData: Record<string, KanbanItem[]> = {};
        columns.forEach(col => {
            initialData[col.id] = items
                .filter(item => item.status === col.id)
                .sort((a, b) => (a.position || 0) - (b.position || 0));
        });
        setBoardData(initialData);
    }, [items, columns]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const sourceCol = Array.from(boardData[source.droppableId]);
        const destCol = destination.droppableId === source.droppableId
            ? sourceCol
            : Array.from(boardData[destination.droppableId]);

        const [movedItem] = sourceCol.splice(source.index, 1);
        destCol.splice(destination.index, 0, movedItem);

        const newBoardData = {
            ...boardData,
            [source.droppableId]: sourceCol,
            [destination.droppableId]: destCol
        };

        setBoardData(newBoardData);
        onMove(draggableId, destination.droppableId, destination.index);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px]">
                {columns.map(column => (
                    <div key={column.id} className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", column.color)} />
                                <h3 className="font-bold text-sm tracking-tight uppercase opacity-70">
                                    {column.title}
                                </h3>
                                <Badge variant="secondary" className="bg-primary/5 text-[10px] h-5 px-1.5 rounded-md border-primary/10">
                                    {boardData[column.id]?.length || 0}
                                </Badge>
                            </div>
                            <button className="p-1 hover:bg-primary/5 rounded-md transition-all opacity-40 hover:opacity-100">
                                <HiOutlineDotsVertical className="w-4 h-4" />
                            </button>
                        </div>

                        <StrictModeDroppable droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={cn(
                                        "flex-1 flex flex-col gap-3 p-3 rounded-2xl border border-dashed transition-all duration-300 min-h-[200px]",
                                        snapshot.isDraggingOver ? "bg-primary/5 border-primary/30" : "bg-transparent border-primary/5"
                                    )}
                                >
                                    {boardData[column.id]?.map((item, index) => (
                                        <Draggable key={item._id} draggableId={item._id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={cn(
                                                        "group bg-card/40 backdrop-blur-md border border-primary/10 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all space-y-3",
                                                        snapshot.isDragging ? "shadow-2xl border-primary/40 rotate-1 scale-[1.02] z-50 bg-card/80" : ""
                                                    )}
                                                >
                                                    <div className="space-y-1">
                                                        <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                                            {item.name}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                            {item.description}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col gap-2 pt-1">
                                                        {item.filePath && (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium truncate">
                                                                <HiOutlineLink className="w-3 h-3 shrink-0" />
                                                                <span className="truncate">{item.filePath}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between gap-2">
                                                            {item.priority && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "text-[9px] uppercase font-black px-1.5 h-5 rounded-md border-0",
                                                                        item.priority === "high" ? "bg-rose-500/10 text-rose-500" :
                                                                            item.priority === "medium" ? "bg-amber-500/10 text-amber-500" :
                                                                                "bg-emerald-500/10 text-emerald-500"
                                                                    )}
                                                                >
                                                                    {item.priority}
                                                                </Badge>
                                                            )}

                                                            <div className="flex items-center gap-2 ml-auto">
                                                                <div className="flex items-center gap-1 opacity-60">
                                                                    <HiOutlineClock className="w-3 h-3" />
                                                                    <span className="text-[9px] font-medium">
                                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <Avatar className="h-5 w-5 border border-background shadow-sm">
                                                                    <AvatarImage src={item.assigneeDetails?.image || item.addedByDetails?.image} />
                                                                    <AvatarFallback className="text-[6px] font-bold">
                                                                        {(item.assigneeDetails?.name || item.addedByDetails?.name || "?").slice(0, 2).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </StrictModeDroppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
};

export default KanbanBoard;
