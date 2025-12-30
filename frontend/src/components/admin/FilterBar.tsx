"use client";

import { useState } from "react";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface FilterOption {
  label: string;
  value: string;
}

interface Filter {
  key: string;
  label: string;
  type: "select" | "date" | "dateRange" | "text";
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: Filter[];
  onFilterChange: (filters: Record<string, string | undefined>) => void;
  onReset?: () => void;
}

export function FilterBar({ filters, onFilterChange, onReset }: FilterBarProps) {
  const [filterValues, setFilterValues] = useState<Record<string, string | undefined>>({});
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filterValues, [key]: value };
    setFilterValues(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setFilterValues({});
    onFilterChange({});
    onReset?.();
  };

  const activeFiltersCount = Object.values(filterValues).filter(
    (v) => v !== "" && v !== null && v !== undefined
  ).length;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
        >
          <FunnelIcon className="w-5 h-5" />
          <span className="font-medium">필터</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            <span>초기화</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filters.map((filter) => (
            <div key={filter.key}>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {filter.label}
              </label>
              {filter.type === "select" && filter.options && (
                <select
                  value={filterValues[filter.key] || ""}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">전체</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {filter.type === "text" && (
                <input
                  type="text"
                  value={filterValues[filter.key] || ""}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  placeholder={filter.placeholder}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
              {filter.type === "date" && (
                <input
                  type="date"
                  value={filterValues[filter.key] || ""}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
              {filter.type === "dateRange" && (
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={filterValues[`${filter.key}_start`] || ""}
                    onChange={(e) =>
                      handleFilterChange(`${filter.key}_start`, e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="self-center text-slate-400">~</span>
                  <input
                    type="date"
                    value={filterValues[`${filter.key}_end`] || ""}
                    onChange={(e) =>
                      handleFilterChange(`${filter.key}_end`, e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
