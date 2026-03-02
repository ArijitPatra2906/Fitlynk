"use client";

import { Icon } from "@/components/ui/icon";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-lg bg-[#131520] border border-white/10 flex items-center justify-center hover:bg-[#1a1f35] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Icon name="chevronLeft" size={16} color="#94A3B8" />
      </button>

      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="text-gray-500 px-2">
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors ${
              currentPage === page
                ? 'bg-blue-500 text-white'
                : 'bg-[#131520] border border-white/10 text-gray-400 hover:bg-[#1a1f35]'
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 rounded-lg bg-[#131520] border border-white/10 flex items-center justify-center hover:bg-[#1a1f35] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Icon name="chevronRight" size={16} color="#94A3B8" />
      </button>
    </div>
  );
}
