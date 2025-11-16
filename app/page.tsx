'use client';

import { useEffect } from 'react';
import { useShowStore } from '@/store/useShowStore';
import ShowCard from '@/components/ShowCard';
import FilterPanel from '@/components/FilterPanel';
import { useShallow } from 'zustand/react/shallow';
import { fetchShowsData } from '@/lib/api';

export default function Home() {
  // Use useShallow to prevent infinite re-renders from object recreation
  // Subscribe to both filters and the getter function
  const { filters, getFilteredShows, isLoading, error, setTheaters, setShows, setLoading, setError } = useShowStore(
    useShallow((state) => ({
      filters: state.filters,
      getFilteredShows: state.getFilteredShows,
      isLoading: state.isLoading,
      error: state.error,
      setTheaters: state.setTheaters,
      setShows: state.setShows,
      setLoading: state.setLoading,
      setError: state.setError,
    }))
  );

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchShowsData();
        setTheaters(data.theaters);
        setShows(data.shows);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load shows data';
        setError(errorMessage);
        console.error('Error loading shows:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setTheaters, setShows, setLoading, setError]);

  // Call getFilteredShows() which will use the current filters from the store
  const filteredShows = getFilteredShows();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Not Broadway
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Your guide to off-Broadway, off-off-Broadway, and non-profit theatre shows in NYC
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading shows...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading shows</h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filter Sidebar */}
            <aside className="lg:col-span-1">
              <FilterPanel />
            </aside>

            {/* Shows Grid */}
            <div className="lg:col-span-3">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredShows.length} {filteredShows.length === 1 ? 'show' : 'shows'} found
                </p>
              </div>

              {filteredShows.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No shows found
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredShows.map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
