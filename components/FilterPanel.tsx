'use client';

import { useShowStore } from '@/store/useShowStore';
import { ShowGenre, TheaterType } from '@/types';

export default function FilterPanel() {
  const { filters, setFilters, resetFilters, getUniqueNeighborhoods } = useShowStore();
  const neighborhoods = getUniqueNeighborhoods();

  const genres: { value: ShowGenre; label: string }[] = [
    { value: 'drama', label: 'Drama' },
    { value: 'comedy', label: 'Comedy' },
    { value: 'musical', label: 'Musical' },
    { value: 'experimental', label: 'Experimental' },
    { value: 'solo-show', label: 'Solo Show' },
    { value: 'dance', label: 'Dance' },
    { value: 'other', label: 'Other' },
  ];

  const theaterTypes: { value: TheaterType; label: string }[] = [
    { value: 'off-broadway', label: 'Off-Broadway' },
    { value: 'off-off-broadway', label: 'Off-Off-Broadway' },
    { value: 'non-profit', label: 'Non-Profit' },
  ];

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filter Shows
        </h2>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Search
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search shows, theaters..."
            value={filters.searchQuery || ''}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Genre Filter */}
        <div>
          <label
            htmlFor="genre"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Genre
          </label>
          <select
            id="genre"
            value={filters.genre || ''}
            onChange={(e) =>
              setFilters({
                genre: e.target.value ? (e.target.value as ShowGenre) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre.value} value={genre.value}>
                {genre.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theater Type Filter */}
        <div>
          <label
            htmlFor="theaterType"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Theater Type
          </label>
          <select
            id="theaterType"
            value={filters.theaterType || ''}
            onChange={(e) =>
              setFilters({
                theaterType: e.target.value ? (e.target.value as TheaterType) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Types</option>
            {theaterTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Neighborhood Filter */}
        <div>
          <label
            htmlFor="neighborhood"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Neighborhood
          </label>
          <select
            id="neighborhood"
            value={filters.neighborhood || ''}
            onChange={(e) =>
              setFilters({
                neighborhood: e.target.value || undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Neighborhoods</option>
            {neighborhoods.map((neighborhood) => (
              <option key={neighborhood} value={neighborhood}>
                {neighborhood}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              From
            </label>
            <input
              type="date"
              id="startDate"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ startDate: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              To
            </label>
            <input
              type="date"
              id="endDate"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ endDate: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
