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
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
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
  pageSize = 20,
  onPageSizeChange,
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
    <div className="min-w-0 max-w-full space-y-4">
      {onSearch && (
        <form onSubmit={handleSearch} className="flex min-w-0 flex-wrap gap-2">
          <div className="relative min-w-0 max-w-sm flex-1 basis-56">
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

      <div className="max-w-full overflow-hidden rounded-2xl border border-gray-700/50 bg-[#1e293b]">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No records found.</div>
        ) : (
          <div className="max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-max">
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

        {(totalPages > 1 || onPageSizeChange) && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-700/50 px-4 py-4 sm:px-6">
            <p className="text-sm text-gray-400">
              {loading ? "Loading records…" : `Showing ${data.length ? (currentPage - 1) * pageSize + 1 : 0}–${data.length ? Math.min((currentPage - 1) * pageSize + data.length, total) : 0} of ${total}`}
            </p>
            <nav aria-label="Table pagination" className="flex flex-wrap items-center gap-2">
              {onPageSizeChange && <label className="me-3 flex items-center gap-2 text-sm text-gray-400">
                Per page
                <select value={pageSize} disabled={loading} onChange={event => onPageSizeChange(Number(event.target.value))} className="min-h-10 rounded-lg border border-gray-600 bg-[#0f172a] px-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">
                  {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>}
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={loading || currentPage <= 1}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from(new Set([1, currentPage - 1, currentPage, currentPage + 1, Math.max(1, totalPages)].filter(page => page >= 1 && page <= Math.max(1, totalPages)))).sort((a, b) => a - b).map((page, index, pages) => (
                <span key={page} className="contents">
                  {index > 0 && page - pages[index - 1] > 1 && <span aria-hidden="true" className="text-gray-500">…</span>}
                  <button type="button" aria-label={`Page ${page}`} aria-current={page === currentPage ? "page" : undefined} disabled={loading} onClick={() => onPageChange(page)} className={cn("min-h-10 min-w-10 rounded-lg px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-50", page === currentPage ? "bg-brand-blue text-white" : "text-gray-300 hover:bg-gray-700")}>{page}</button>
                </span>
              ))}
              <button
                type="button"
                aria-label="Next page"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={loading || currentPage >= totalPages}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
