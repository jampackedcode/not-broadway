export type TheaterType = 'broadway' | 'off-broadway' | 'off-off-broadway' | 'non-profit';

export type ShowGenre =
  | 'drama'
  | 'comedy'
  | 'musical'
  | 'experimental'
  | 'solo-show'
  | 'dance'
  | 'other';

export enum ShowStatus {
  UPCOMING = 'upcoming',
  RUNNING = 'running',
  CANCELED = 'canceled',
  SOLD_OUT = 'sold_out',
  POSTPONED = 'postponed',
  PAST = 'past',
  CLOSED = 'closed'
}

export interface Theater {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  type: TheaterType;
  website?: string;
  seatingCapacity?: number;
}

export interface Show {
  id: string;
  title: string;
  theaterId: string;
  theaterName?: string; // Denormalized for easier human readability
  description: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  genre: ShowGenre;
  runtime?: number; // in minutes
  ticketPriceRange?: {
    min: number;
    max: number;
  };
  website?: string;
  imageUrl?: string;
  status: ShowStatus;
  venue?: string;
}

export interface ShowWithTheater extends Show {
  theater: Theater;
}
