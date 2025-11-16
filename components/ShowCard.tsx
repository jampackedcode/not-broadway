import { ShowWithTheater } from '@/types';
import { format } from 'date-fns';

interface ShowCardProps {
  show: ShowWithTheater;
}

export default function ShowCard({ show }: ShowCardProps) {
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  const formatPrice = (min: number, max: number) => {
    return `$${min}-$${max}`;
  };

  const getTheaterTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'off-broadway': 'Off-Broadway',
      'off-off-broadway': 'Off-Off-Broadway',
      'non-profit': 'Non-Profit',
    };
    return labels[type] || type;
  };

  const getGenreColor = (genre: string) => {
    const colors: Record<string, string> = {
      drama: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      comedy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      musical: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      experimental: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'solo-show': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      dance: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[genre] || colors.other;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {show.imageUrl && (
        <div className="h-48 w-full bg-gray-200 dark:bg-gray-700">
          <img
            src={show.imageUrl}
            alt={show.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
            {show.title}
          </h3>
          <span
            className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getGenreColor(
              show.genre
            )}`}
          >
            {show.genre}
          </span>
        </div>

        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {show.theater.name}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {show.theater.neighborhood} • {getTheaterTypeLabel(show.theater.type)}
          </p>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
          {show.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDateRange(show.startDate, show.endDate)}
            </span>
            {show.runtime && (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {show.runtime} min
              </span>
            )}
          </div>
        </div>

        {show.ticketPriceRange && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatPrice(show.ticketPriceRange.min, show.ticketPriceRange.max)}
            </span>
            {show.website && (
              <a
                href={show.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Details →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
