"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";

interface WorkPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const WorkPagination = ({
    currentPage,
    totalPages,
    onPageChange
}: WorkPaginationProps) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-4 py-6">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl bg-primary/5 border-primary/10 hover:bg-primary/10 transition-all"
            >
                <HiOutlineChevronLeft className="w-4 h-4 mr-1" />
                Previous
            </Button>

            <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className={`w-8 h-8 p-0 rounded-lg transition-all ${currentPage === page
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "bg-primary/5 border-primary/10 hover:bg-primary/10"
                            }`}
                    >
                        {page}
                    </Button>
                ))}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-xl bg-primary/5 border-primary/10 hover:bg-primary/10 transition-all"
            >
                Next
                <HiOutlineChevronRight className="w-4 h-4 ml-1" />
            </Button>
        </div>
    );
};

export default WorkPagination;
