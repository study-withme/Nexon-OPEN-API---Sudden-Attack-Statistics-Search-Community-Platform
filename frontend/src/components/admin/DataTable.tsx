"use client";

import { useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  searchable?: boolean;
  onSearch?: (query: string) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  loading?: boolean;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  onRowClick,
  pagination,
  searchable = false,
  onSearch,
  selectable = false,
  onSelectionChange,
  loading = false,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map((item) => item.id));
      setSelectedIds(allIds);
      onSelectionChange?.(data);
    } else {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (item: T, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(item.id);
    } else {
      newSelected.delete(item.id);
    }
    setSelectedIds(newSelected);
    const selectedItems = data.filter((item) => newSelected.has(item.id));
    onSelectionChange?.(selectedItems);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1;

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* 검색 바 */}
      {searchable && (
        <div className="p-4 border-b border-slate-700">
          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      )}

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === data.length && data.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  데이터가 없습니다
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={`hover:bg-slate-700/50 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={(e) => handleSelectRow(item, e.target.checked)}
                        className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm text-slate-300">
                      {column.render
                        ? column.render(item)
                        : (item as any)[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            {pagination.total > 0
              ? `${(pagination.page - 1) * pagination.pageSize + 1} - ${Math.min(
                  pagination.page * pagination.pageSize,
                  pagination.total
                )} / ${pagination.total}`
              : "0"}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronDoubleLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="px-4 text-sm text-slate-300">
              {pagination.page} / {totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(totalPages)}
              disabled={pagination.page >= totalPages}
              className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronDoubleRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
