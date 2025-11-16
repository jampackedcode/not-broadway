import { renderHook, act } from '@testing-library/react';
import { useShowStore } from '../useShowStore';

describe('useShowStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    const { result } = renderHook(() => useShowStore());
    act(() => {
      result.current.resetFilters();
    });
  });

  describe('initial state', () => {
    it('has theaters loaded', () => {
      const { result } = renderHook(() => useShowStore());
      expect(result.current.theaters.length).toBeGreaterThan(0);
    });

    it('has shows loaded', () => {
      const { result } = renderHook(() => useShowStore());
      expect(result.current.shows.length).toBeGreaterThan(0);
    });

    it('starts with no filters', () => {
      const { result } = renderHook(() => useShowStore());
      expect(result.current.filters).toEqual({});
    });
  });

  describe('setFilters', () => {
    it('sets genre filter', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({ genre: 'drama' });
      });

      expect(result.current.filters.genre).toBe('drama');
    });

    it('sets multiple filters', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({ genre: 'comedy', theaterType: 'off-broadway' });
      });

      expect(result.current.filters.genre).toBe('comedy');
      expect(result.current.filters.theaterType).toBe('off-broadway');
    });

    it('merges new filters with existing ones', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({ genre: 'drama' });
      });

      act(() => {
        result.current.setFilters({ theaterType: 'off-broadway' });
      });

      expect(result.current.filters.genre).toBe('drama');
      expect(result.current.filters.theaterType).toBe('off-broadway');
    });
  });

  describe('resetFilters', () => {
    it('clears all filters', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({ genre: 'drama', theaterType: 'off-broadway' });
      });

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters).toEqual({});
    });
  });

  describe('getTheaterById', () => {
    it('returns theater when it exists', () => {
      const { result } = renderHook(() => useShowStore());
      const theater = result.current.getTheaterById('t1');

      expect(theater).toBeDefined();
      expect(theater?.id).toBe('t1');
    });

    it('returns undefined when theater does not exist', () => {
      const { result } = renderHook(() => useShowStore());
      const theater = result.current.getTheaterById('nonexistent');

      expect(theater).toBeUndefined();
    });
  });

  describe('getShowsWithTheaters', () => {
    it('returns all shows with theater information', () => {
      const { result } = renderHook(() => useShowStore());
      const showsWithTheaters = result.current.getShowsWithTheaters();

      expect(showsWithTheaters.length).toBe(result.current.shows.length);
      showsWithTheaters.forEach((show) => {
        expect(show.theater).toBeDefined();
        expect(show.theater.id).toBe(show.theaterId);
      });
    });
  });

  describe('getFilteredShows', () => {
    it('returns all shows when no filters are set', () => {
      const { result } = renderHook(() => useShowStore());
      const filteredShows = result.current.getFilteredShows();

      expect(filteredShows.length).toBe(result.current.shows.length);
    });

    it('filters by genre', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({ genre: 'drama' });
      });

      const filteredShows = result.current.getFilteredShows();
      expect(filteredShows.length).toBeGreaterThan(0);
      filteredShows.forEach((show) => {
        expect(show.genre).toBe('drama');
      });
    });

    it('filters by theater type', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({ theaterType: 'off-broadway' });
      });

      const filteredShows = result.current.getFilteredShows();
      expect(filteredShows.length).toBeGreaterThan(0);
      filteredShows.forEach((show) => {
        expect(show.theater.type).toBe('off-broadway');
      });
    });

    it('filters by neighborhood', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({ neighborhood: 'Greenwich Village' });
      });

      const filteredShows = result.current.getFilteredShows();
      expect(filteredShows.length).toBeGreaterThan(0);
      filteredShows.forEach((show) => {
        expect(show.theater.neighborhood).toBe('Greenwich Village');
      });
    });

    it('filters by search query - title', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({ searchQuery: 'mysteries' });
      });

      const filteredShows = result.current.getFilteredShows();
      expect(filteredShows.length).toBeGreaterThan(0);
      filteredShows.forEach((show) => {
        const matchesTitle = show.title.toLowerCase().includes('mysteries');
        const matchesDescription = show.description.toLowerCase().includes('mysteries');
        const matchesTheater = show.theater.name.toLowerCase().includes('mysteries');
        expect(matchesTitle || matchesDescription || matchesTheater).toBe(true);
      });
    });

    it('filters by search query - case insensitive', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({ searchQuery: 'MYSTERIES' });
      });

      const filteredShows = result.current.getFilteredShows();
      expect(filteredShows.length).toBeGreaterThan(0);
    });

    it('filters by start date', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({ startDate: '2025-12-01' });
      });

      const filteredShows = result.current.getFilteredShows();
      filteredShows.forEach((show) => {
        expect(new Date(show.endDate) >= new Date('2025-12-01')).toBe(true);
      });
    });

    it('filters by end date', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({ endDate: '2025-12-01' });
      });

      const filteredShows = result.current.getFilteredShows();
      filteredShows.forEach((show) => {
        expect(new Date(show.startDate) <= new Date('2025-12-01')).toBe(true);
      });
    });

    it('combines multiple filters', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({
          genre: 'drama',
          theaterType: 'non-profit',
        });
      });

      const filteredShows = result.current.getFilteredShows();
      filteredShows.forEach((show) => {
        expect(show.genre).toBe('drama');
        expect(show.theater.type).toBe('non-profit');
      });
    });

    it('returns empty array when no shows match filters', () => {
      const { result } = renderHook(() => useShowStore());

      act(() => {
        result.current.setFilters({ searchQuery: 'nonexistentshowxyz123' });
      });

      const filteredShows = result.current.getFilteredShows();
      expect(filteredShows).toEqual([]);
    });
  });

  describe('getUniqueNeighborhoods', () => {
    it('returns unique neighborhoods sorted alphabetically', () => {
      const { result } = renderHook(() => useShowStore());
      const neighborhoods = result.current.getUniqueNeighborhoods();

      expect(neighborhoods.length).toBeGreaterThan(0);

      // Check that all are unique
      const uniqueSet = new Set(neighborhoods);
      expect(uniqueSet.size).toBe(neighborhoods.length);

      // Check that they are sorted
      const sorted = [...neighborhoods].sort();
      expect(neighborhoods).toEqual(sorted);
    });
  });
});
