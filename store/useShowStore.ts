import { create } from 'zustand';
import { Theater, Show, ShowWithTheater, ShowGenre, TheaterType } from '@/types';
import { mockTheaters, mockShows } from '@/lib/mockData';

interface ShowFilters {
  genre?: ShowGenre;
  theaterType?: TheaterType;
  neighborhood?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

interface ShowStore {
  theaters: Theater[];
  shows: Show[];
  filters: ShowFilters;

  // Actions
  setFilters: (filters: Partial<ShowFilters>) => void;
  resetFilters: () => void;

  // Getters
  getShowsWithTheaters: () => ShowWithTheater[];
  getFilteredShows: () => ShowWithTheater[];
  getTheaterById: (id: string) => Theater | undefined;
  getUniqueNeighborhoods: () => string[];
}

export const useShowStore = create<ShowStore>((set, get) => ({
  theaters: mockTheaters,
  shows: mockShows,
  filters: {},

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: {} }),

  getTheaterById: (id: string) => {
    return get().theaters.find((theater) => theater.id === id);
  },

  getShowsWithTheaters: () => {
    const { shows, getTheaterById } = get();
    return shows
      .map((show) => {
        const theater = getTheaterById(show.theaterId);
        if (!theater) return null;
        return { ...show, theater };
      })
      .filter((show): show is ShowWithTheater => show !== null);
  },

  getFilteredShows: () => {
    const { getShowsWithTheaters, filters } = get();
    let filteredShows = getShowsWithTheaters();

    // Filter by genre
    if (filters.genre) {
      filteredShows = filteredShows.filter((show) => show.genre === filters.genre);
    }

    // Filter by theater type
    if (filters.theaterType) {
      filteredShows = filteredShows.filter(
        (show) => show.theater.type === filters.theaterType
      );
    }

    // Filter by neighborhood
    if (filters.neighborhood) {
      filteredShows = filteredShows.filter(
        (show) => show.theater.neighborhood === filters.neighborhood
      );
    }

    // Filter by search query (searches title and description)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredShows = filteredShows.filter(
        (show) =>
          show.title.toLowerCase().includes(query) ||
          show.description.toLowerCase().includes(query) ||
          show.theater.name.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (filters.startDate) {
      filteredShows = filteredShows.filter(
        (show) => new Date(show.endDate) >= new Date(filters.startDate!)
      );
    }

    if (filters.endDate) {
      filteredShows = filteredShows.filter(
        (show) => new Date(show.startDate) <= new Date(filters.endDate!)
      );
    }

    return filteredShows;
  },

  getUniqueNeighborhoods: () => {
    const { theaters } = get();
    const neighborhoods = theaters.map((theater) => theater.neighborhood);
    return Array.from(new Set(neighborhoods)).sort();
  },
}));
