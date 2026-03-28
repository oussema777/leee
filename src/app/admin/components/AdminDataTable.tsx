"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Pencil, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalPages: number;
  currentPage: number;
  total: number;
  search?: string;
  onSearch?: (value: string) => void;
  onPageChange: (page: number) => void;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  loading?: boolean;
  idKey?: string;
}

export default function AdminDataTable<T extends { id: string; [key: string]: any }>({
  columns,
  data,
  totalPages,
  currentPage,
  total,
  search = "",
  onSearch,
  onPageChange,
  onSort,
  sortKey,
  sortOrder,
  onEdit,
  onDelete,
  onView,
  loading = false,
  idKey = "id",
}: AdminDataTableProps<T>) {
  const [searchInput, setSearchInput] = useState(search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchInput);
  };

  const hasActions = onEdit || onDelete || onView;

  return (
    <div className="space-y-4">
      {onSearch && (
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#1e293b] border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Search
          </button>
        </form>
      )}

      <div className="bg-[#1e293b] rounded-2xl border border-gray-700/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4"
                    >
                      {col.sortable && onSort ? (
                        <button
                          onClick={() => onSort(col.key)}
                          className="inline-flex items-center gap-1 hover:text-white transition-colors"
                        >
                          {col.label}
                          <ArrowUpDown
                            size={14}
                            className={cn(
                              sortKey === col.key ? "text-brand-blue" : "text-gray-600"
                            )}
                          />
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                  {hasActions && (
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr
                    key={item[idKey] as string}
                    className="border-b border-gray-700/30 last:border-0 hover:bg-gray-700/20 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 text-sm text-gray-300">
                        {col.render ? col.render(item) : (item[col.key] as React.ReactNode) ?? "—"}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onView && (
                            <button
                              onClick={() => onView(item)}
                              className="p-1.5 text-gray-400 hover:text-white transition-colors"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1.5 text-gray-400 hover:text-brand-blue transition-colors"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700/50">
            <p className="text-sm text-gray-400">
              Showing {(currentPage - 1) * data.length + 1}–{Math.min(currentPage * data.length, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
