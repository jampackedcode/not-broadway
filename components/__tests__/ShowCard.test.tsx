import { render, screen } from '@testing-library/react';
import ShowCard from '../ShowCard';
import { ShowWithTheater } from '@/types';

describe('ShowCard', () => {
  const mockShow: ShowWithTheater = {
    id: 's1',
    title: 'Test Show',
    theaterId: 't1',
    description: 'A test show description that is interesting and engaging.',
    startDate: '2025-11-20',
    endDate: '2025-12-22',
    genre: 'drama',
    runtime: 120,
    ticketPriceRange: { min: 35, max: 85 },
    website: 'https://example.com',
    theater: {
      id: 't1',
      name: 'Test Theater',
      address: '123 Test St, New York, NY 10001',
      neighborhood: 'Greenwich Village',
      type: 'off-broadway',
      seatingCapacity: 200,
    },
  };

  it('renders show title', () => {
    render(<ShowCard show={mockShow} />);
    expect(screen.getByText('Test Show')).toBeInTheDocument();
  });

  it('renders theater name and location', () => {
    render(<ShowCard show={mockShow} />);
    expect(screen.getByText('Test Theater')).toBeInTheDocument();
    expect(screen.getByText(/Greenwich Village/)).toBeInTheDocument();
    expect(screen.getByText(/Off-Broadway/)).toBeInTheDocument();
  });

  it('renders show description', () => {
    render(<ShowCard show={mockShow} />);
    expect(
      screen.getByText('A test show description that is interesting and engaging.')
    ).toBeInTheDocument();
  });

  it('renders date range', () => {
    render(<ShowCard show={mockShow} />);
    expect(screen.getByText(/Nov 20 - Dec 22, 2025/)).toBeInTheDocument();
  });

  it('renders runtime when provided', () => {
    render(<ShowCard show={mockShow} />);
    expect(screen.getByText('120 min')).toBeInTheDocument();
  });

  it('does not render runtime when not provided', () => {
    const showWithoutRuntime = { ...mockShow, runtime: undefined };
    render(<ShowCard show={showWithoutRuntime} />);
    expect(screen.queryByText(/min$/)).not.toBeInTheDocument();
  });

  it('renders price range when provided', () => {
    render(<ShowCard show={mockShow} />);
    expect(screen.getByText('$35-$85')).toBeInTheDocument();
  });

  it('renders genre badge', () => {
    render(<ShowCard show={mockShow} />);
    expect(screen.getByText('drama')).toBeInTheDocument();
  });

  it('renders website link when provided', () => {
    render(<ShowCard show={mockShow} />);
    const link = screen.getByText(/View Details/);
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not render website link when not provided', () => {
    const showWithoutWebsite = { ...mockShow, website: undefined };
    render(<ShowCard show={showWithoutWebsite} />);
    expect(screen.queryByText(/View Details/)).not.toBeInTheDocument();
  });

  it('applies correct genre color classes for different genres', () => {
    const genres: Array<ShowWithTheater['genre']> = [
      'comedy',
      'musical',
      'experimental',
      'solo-show',
      'dance',
    ];

    genres.forEach((genre) => {
      const showWithGenre = { ...mockShow, genre };
      const { container } = render(<ShowCard show={showWithGenre} />);
      const genreBadge = screen.getByText(genre);
      expect(genreBadge).toBeInTheDocument();
      expect(genreBadge).toHaveClass('rounded-full');
    });
  });

  it('renders theater type label correctly', () => {
    const theaterTypes: Array<{ type: ShowWithTheater['theater']['type']; label: string }> = [
      { type: 'off-broadway', label: 'Off-Broadway' },
      { type: 'off-off-broadway', label: 'Off-Off-Broadway' },
      { type: 'non-profit', label: 'Non-Profit' },
    ];

    theaterTypes.forEach(({ type, label }) => {
      const showWithType = {
        ...mockShow,
        theater: { ...mockShow.theater, type },
      };
      render(<ShowCard show={showWithType} />);
      expect(screen.getByText(new RegExp(label))).toBeInTheDocument();
    });
  });
});
