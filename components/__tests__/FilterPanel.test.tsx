import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterPanel from '../FilterPanel';
import { useShowStore } from '@/store/useShowStore';

// Mock the store
jest.mock('@/store/useShowStore');

describe('FilterPanel', () => {
  const mockSetFilters = jest.fn();
  const mockResetFilters = jest.fn();
  const mockGetUniqueNeighborhoods = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUniqueNeighborhoods.mockReturnValue([
      'Chelsea',
      'East Village',
      'Greenwich Village',
      'Midtown',
      'SoHo',
    ]);

    (useShowStore as unknown as jest.Mock).mockReturnValue({
      filters: {},
      setFilters: mockSetFilters,
      resetFilters: mockResetFilters,
      getUniqueNeighborhoods: mockGetUniqueNeighborhoods,
    });
  });

  it('renders filter panel title', () => {
    render(<FilterPanel />);
    expect(screen.getByText('Filter Shows')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<FilterPanel />);
    const searchInput = screen.getByLabelText('Search');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search shows, theaters...');
  });

  it('renders genre dropdown with all options', () => {
    render(<FilterPanel />);
    const genreSelect = screen.getByLabelText('Genre');
    expect(genreSelect).toBeInTheDocument();

    const options = ['All Genres', 'Drama', 'Comedy', 'Musical', 'Experimental', 'Solo Show', 'Dance', 'Other'];
    options.forEach((option) => {
      expect(screen.getByRole('option', { name: option })).toBeInTheDocument();
    });
  });

  it('renders theater type dropdown with all options', () => {
    render(<FilterPanel />);
    const theaterTypeSelect = screen.getByLabelText('Theater Type');
    expect(theaterTypeSelect).toBeInTheDocument();

    const options = ['All Types', 'Off-Broadway', 'Off-Off-Broadway', 'Non-Profit'];
    options.forEach((option) => {
      expect(screen.getByRole('option', { name: option })).toBeInTheDocument();
    });
  });

  it('renders neighborhood dropdown with unique neighborhoods', () => {
    render(<FilterPanel />);
    const neighborhoodSelect = screen.getByLabelText('Neighborhood');
    expect(neighborhoodSelect).toBeInTheDocument();

    expect(mockGetUniqueNeighborhoods).toHaveBeenCalled();
    expect(screen.getByRole('option', { name: 'Chelsea' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'SoHo' })).toBeInTheDocument();
  });

  it('renders date range inputs', () => {
    render(<FilterPanel />);
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('calls setFilters when search input changes', () => {
    render(<FilterPanel />);

    const searchInput = screen.getByLabelText('Search');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(mockSetFilters).toHaveBeenCalledWith({ searchQuery: 'test search' });
  });

  it('calls setFilters when genre changes', () => {
    render(<FilterPanel />);

    const genreSelect = screen.getByLabelText('Genre');
    fireEvent.change(genreSelect, { target: { value: 'drama' } });

    expect(mockSetFilters).toHaveBeenCalledWith({ genre: 'drama' });
  });

  it('calls setFilters with undefined when genre is cleared', () => {
    render(<FilterPanel />);

    const genreSelect = screen.getByLabelText('Genre');
    fireEvent.change(genreSelect, { target: { value: '' } });

    expect(mockSetFilters).toHaveBeenCalledWith({ genre: undefined });
  });

  it('calls setFilters when theater type changes', () => {
    render(<FilterPanel />);

    const theaterTypeSelect = screen.getByLabelText('Theater Type');
    fireEvent.change(theaterTypeSelect, { target: { value: 'off-broadway' } });

    expect(mockSetFilters).toHaveBeenCalledWith({ theaterType: 'off-broadway' });
  });

  it('calls setFilters when neighborhood changes', () => {
    render(<FilterPanel />);

    const neighborhoodSelect = screen.getByLabelText('Neighborhood');
    fireEvent.change(neighborhoodSelect, { target: { value: 'Chelsea' } });

    expect(mockSetFilters).toHaveBeenCalledWith({ neighborhood: 'Chelsea' });
  });

  it('calls setFilters when start date changes', () => {
    render(<FilterPanel />);

    const startDateInput = screen.getByLabelText('From');
    fireEvent.change(startDateInput, { target: { value: '2025-11-20' } });

    expect(mockSetFilters).toHaveBeenCalledWith({ startDate: '2025-11-20' });
  });

  it('calls setFilters when end date changes', () => {
    render(<FilterPanel />);

    const endDateInput = screen.getByLabelText('To');
    fireEvent.change(endDateInput, { target: { value: '2025-12-31' } });

    expect(mockSetFilters).toHaveBeenCalledWith({ endDate: '2025-12-31' });
  });

  it('shows Clear All button when filters are active', () => {
    (useShowStore as unknown as jest.Mock).mockReturnValue({
      filters: { genre: 'drama' },
      setFilters: mockSetFilters,
      resetFilters: mockResetFilters,
      getUniqueNeighborhoods: mockGetUniqueNeighborhoods,
    });

    render(<FilterPanel />);
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('hides Clear All button when no filters are active', () => {
    render(<FilterPanel />);
    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('calls resetFilters when Clear All is clicked', async () => {
    const user = userEvent.setup();
    (useShowStore as unknown as jest.Mock).mockReturnValue({
      filters: { genre: 'drama' },
      setFilters: mockSetFilters,
      resetFilters: mockResetFilters,
      getUniqueNeighborhoods: mockGetUniqueNeighborhoods,
    });

    render(<FilterPanel />);

    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);

    expect(mockResetFilters).toHaveBeenCalled();
  });

  it('displays current filter values', () => {
    (useShowStore as unknown as jest.Mock).mockReturnValue({
      filters: {
        searchQuery: 'test',
        genre: 'comedy',
        theaterType: 'off-broadway',
        neighborhood: 'SoHo',
        startDate: '2025-11-01',
        endDate: '2025-12-31',
      },
      setFilters: mockSetFilters,
      resetFilters: mockResetFilters,
      getUniqueNeighborhoods: mockGetUniqueNeighborhoods,
    });

    render(<FilterPanel />);

    expect(screen.getByLabelText('Search')).toHaveValue('test');
    expect(screen.getByLabelText('Genre')).toHaveValue('comedy');
    expect(screen.getByLabelText('Theater Type')).toHaveValue('off-broadway');
    expect(screen.getByLabelText('Neighborhood')).toHaveValue('SoHo');
    expect(screen.getByLabelText('From')).toHaveValue('2025-11-01');
    expect(screen.getByLabelText('To')).toHaveValue('2025-12-31');
  });
});
