
export interface PlaceInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  yearBuilt?: string;
  rating: number;
  confidence?: number; // 0.0 to 1.0 confidence score
}

export interface MapNode {
  id: string;
  name: string;
  distance: string;
  bearing: number;
  category: string;
}

export interface PlaceDetails extends PlaceInfo {
  historicalStories: string[];
  funFacts: string[];
  groundingUrls?: string[];
  reviews: string[];
}

export interface Story {
  id: string;
  type: 'history' | 'secret' | 'review' | 'fact';
  title: string;
  content: string;
  icon: string;
}

export interface RecognitionResult {
  place: PlaceInfo | null;
  stories: Story[];
  reasoning?: string; // Optional explanation for why it didn't match
}

export enum AppState {
  INITIALIZING = 'initializing',
  SCANNING = 'scanning',
  RECOGNIZING = 'recognizing',
  MAP_VIEW = 'map_view',
  ERROR = 'error'
}

export enum AppTab {
  STORIES = 'stories',
  REVIEWS = 'reviews',
  COMMUNITY = 'community'
}
