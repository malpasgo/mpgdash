import React, { useState } from 'react';
import { Search, Filter, X, Calendar, Tag, RotateCcw } from 'lucide-react';
import { FilterOptions } from '@/hooks/useRoadmapData';
import { STATUS_CONFIG } from '@/lib/supabase';

interface FilterSearchProps {
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export const FilterSearch: React.FC<FilterSearchProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  totalCount,
  filteredCount
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');

  const years = [2025, 2026, 2027, 2028, 2029, 2030];
  const statuses = Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ searchQuery });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Debounced search - update immediately for better UX
    if (value.trim() === '') {
      onFiltersChange({ searchQuery: '' });
    }
  };

  const handleYearFilter = (year: number) => {
    onFiltersChange({ year: filters.year === year ? undefined : year });
  };

  const handleStatusFilter = (status: string) => {
    onFiltersChange({ status: filters.status === status ? undefined : status });
  };

  const hasActiveFilters = filters.year || filters.status || filters.searchQuery;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filter & Pencarian
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            Menampilkan <span className="font-semibold">{filteredCount}</span> dari <span className="font-semibold">{totalCount}</span> periode
          </span>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari berdasarkan fokus, action plan, atau catatan finansial..."
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onFiltersChange({ searchQuery: '' });
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Quick Filters */}
      <div className="space-y-4">
        {/* Year Filters */}
        <div>
          <div className="flex items-center mb-2">
            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filter Tahun:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {years.map(year => (
              <button
                key={year}
                onClick={() => handleYearFilter(year)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filters.year === year
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div>
          <div className="flex items-center mb-2">
            <Tag className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filter Status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {statuses.map(status => {
              const statusConfig = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 flex items-center ${
                    filters.status === status
                      ? 'ring-2 ring-offset-2 ring-blue-500'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: filters.status === status ? statusConfig.color : statusConfig.bgColor.includes('green') ? '#F0FDF4' : statusConfig.bgColor.includes('blue') ? '#EFF6FF' : statusConfig.bgColor.includes('yellow') ? '#FFFBEB' : '#F9FAFB',
                    color: filters.status === status ? 'white' : statusConfig.color
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: statusConfig.color }}
                  />
                  {statusConfig.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm text-gray-600">Filter aktif:</span>
            {filters.year && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Tahun: {filters.year}
                <button
                  onClick={() => onFiltersChange({ year: undefined })}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {STATUS_CONFIG[filters.status as keyof typeof STATUS_CONFIG]?.label.split(' ')[0]}
                <button
                  onClick={() => onFiltersChange({ status: undefined })}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.searchQuery && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Pencarian: "{filters.searchQuery}"
                <button
                  onClick={() => {
                    setSearchQuery('');
                    onFiltersChange({ searchQuery: undefined });
                  }}
                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSearch;