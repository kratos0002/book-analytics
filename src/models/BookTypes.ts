/**
 * Comprehensive Book Analytics Data Model
 * This module defines the core data structures for detailed book tracking and analysis.
 */

// Core Book Model
export type ReadingStatus = 'to-read' | 'reading' | 'completed' | 'abandoned' | 'reference';

export interface Book {
  // Identification & Basic Metadata
  id: string;                   // Unique identifier
  isbn: string;                 // ISBN-13 when available
  googleBooksId?: string;       // Google Books API ID
  title: string;                // Full title
  subtitle?: string;            // Subtitle if applicable
  originalTitle?: string;       // Original title if translated
  authors: Author[];            // Array of authors with detailed info
  
  // Publication Details
  publisher: string;
  publishedDate: string;        // ISO date format
  edition?: string;             // Edition information
  language: string;             // ISO language code
  translatedFrom?: string;      // Original language if translated
  translator?: string;          // Translator name if applicable
  pageCount: number;
  format: 'hardcover' | 'paperback' | 'ebook' | 'audiobook' | 'other';
  series?: {                    // Series information if applicable
    name: string;
    position: number;
  };
  
  // Content Classification
  genres: string[];             // Primary genres (standardized)
  subgenres: string[];          // More specific categorization
  subjects: string[];           // Subject matter topics
  contentTags: string[];        // User-defined tags
  audience: 'children' | 'middle-grade' | 'young-adult' | 'adult' | 'academic';
  fiction: boolean;             // Fiction or non-fiction
  
  // Narrative Elements
  narrativeStructure: {
    pov: 'first-person' | 'second-person' | 'third-person-limited' | 'third-person-omniscient' | 'multiple' | 'other';
    tense: 'past' | 'present' | 'future' | 'mixed';
    timeline: 'linear' | 'non-linear' | 'multiple-timelines';
    format?: 'prose' | 'verse' | 'epistolary' | 'mixed-media' | 'other';
  };
  
  // Content Analysis
  themes: Theme[];              // Major themes with relevance indicators
  locations: Location[];        // Settings with geographic data
  historicalPeriod?: string[];  // Time periods depicted
  characters: Character[];      // Character details
  
  // User-specific Data
  userRating: number;           // 1-5 scale with half points
  readingStatus: ReadingStatus;
  dateAdded: string;            // When added to collection
  startDate?: string;           // When started reading
  finishDate?: string;          // When finished reading
  abandonedReason?: string;     // If applicable
  isFavorite: boolean;
  isReread: boolean;
  readCount: number;            // How many times read
  
  // Reading Experience
  readingSessions: ReadingSession[];
  annotations: Annotation[];
  userNotes: string;
  userTags: string[];
  emotionalResponse: EmotionalResponse;
  
  // Cultural Context
  awards: Award[];              // Literary awards received
  culturalContext: {
    representation: string[];   // Groups/identities represented
    diversityElements: string[];
    sensitivity?: string;       // Content warnings if applicable
  };
  
  // External Sources
  recommendedBy?: string;       // Person/source who recommended
  amazonRating?: number;        // Average rating on Amazon
  goodreadsRating?: number;     // Average rating on Goodreads
  averageRating?: number;       // Average rating across platforms
  nytBestseller?: boolean;      // Was it a NYT bestseller
  
  // Analysis-specific Fields
  complexity: {
    readability?: number;       // Calculated readability score
    vocabulary?: number;        // 1-5 scale of vocabulary difficulty
    conceptual?: number;        // 1-5 scale of conceptual difficulty
    structural?: number;        // 1-5 scale of structural complexity
  };
  
  // Enrichment Data
  enrichedData?: BookAIEnrichment; // AI-enriched metadata
  
  // Metadata
  coverImage?: string;          // URL to cover image
  description: string;          // Book description/synopsis
  lastModified: string;         // Last time record was updated
}

// Supporting Types
export interface Author {
  id: string;
  name: string;
  birth?: string;               // Birth year
  death?: string;               // Death year if applicable
  nationality?: string;         // Country of origin
  otherBooks?: string[];        // Titles of other books by this author
  primaryGenres?: string[];     // Genres this author typically writes in
  roles?: string[];
}

export interface Theme {
  name: string;                 // Theme name
  relevance: number;            // 1-5 scale of importance to the book
  userNotes?: string;           // User insights on this theme
}

export interface Location {
  name: string;                 // Location name
  type: 'city' | 'country' | 'region' | 'fictional' | 'planet' | 'other';
  realWorld: boolean;           // Is it a real or fictional place
  coordinates?: [number, number]; // Lat/long if applicable
  importance: number;           // 1-5 scale of centrality to the narrative
  description?: string;         // Brief description of the setting
}

export interface Character {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  archetype?: string;           // Character archetype
  demographics?: {
    gender?: string;
    age?: string;
    background?: string;
    occupation?: string;
  };
  personalityTraits?: string[];
  development?: 'static' | 'dynamic'; // Character arc type
  notes?: string;               // User notes about the character
}

export interface ReadingSession {
  date: string;                 // Date of reading session
  startTime?: string;           // Time started reading
  endTime?: string;             // Time finished reading
  pagesRead: number;            // Pages completed in session
  location?: string;            // Where reading took place
  medium?: 'physical' | 'ebook' | 'audiobook';
  mood?: string;                // User's mood during reading
  distractions?: number;        // 1-5 scale of how distracted user was
  notes?: string;               // Notes about the session
}

export interface Annotation {
  page: number;
  text: string;                 // The highlighted/annotated text
  note?: string;                // User's note about the annotation
  type: 'highlight' | 'note' | 'question' | 'insight' | 'vocabulary';
  dateAdded: string;
}

export interface EmotionalResponse {
  overall: 'positive' | 'negative' | 'mixed' | 'neutral';
  emotions: {                   // Emotional reactions with intensity
    [emotion: string]: number;  // 1-5 scale, e.g. "joy": 4
  };
  impactRating: number;         // 1-5 scale of emotional impact
  memorability: number;         // 1-5 scale of how memorable
  resonance?: string;           // Why the book resonated (or didn't)
}

export interface Award {
  name: string;                 // Award name
  category?: string;            // Category/specific award
  year: number;                 // Year awarded
  winner: boolean;              // Winner or just nominated
}

/**
 * Interface for simplified book data as received from Google Books API
 * This serves as a bridge between the API response and our richer Book model
 */
export interface GoogleBooksVolumeInfo {
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  maturityRating?: string;
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  language?: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
}

export interface GoogleBooksVolume {
  kind: string;
  id: string;
  etag: string;
  selfLink: string;
  volumeInfo: GoogleBooksVolumeInfo;
  saleInfo?: any;
  accessInfo?: any;
  searchInfo?: {
    textSnippet?: string;
  };
}

/**
 * Represents the minimum required data to create a Book entry
 * This is useful for initial book creation before full details are available
 */
export interface MinimalBookData {
  id: string;
  title: string;
  authors: Author[];
  publisher: string;
  publishedDate: string;
  pageCount: number;
  language: string;
  description: string;
  coverImage?: string;
  isbn: string;
}

/**
 * Represents metadata fields that can be progressively completed
 * Used to track completion status of book metadata
 */
export interface BookMetadataCompletionStatus {
  bookId: string;
  basicInfoComplete: boolean;
  publicationDetailsComplete: boolean;
  contentClassificationComplete: boolean; 
  narrativeElementsComplete: boolean;
  contentAnalysisComplete: boolean;
  readingExperienceComplete: boolean;
  culturalContextComplete: boolean;
  complexityAnalysisComplete: boolean;
}

/**
 * Represents a response from an external book API
 */
export interface ExternalBookData {
  source: 'google_books' | 'open_library' | 'goodreads' | 'manual';
  data: any;
  retrievedAt: string;
}

/**
 * Type for book enrichment sources
 */
export type BookEnrichmentSource = 
  'google_books' | 
  'open_library' | 
  'goodreads' | 
  'amazon' | 
  'worldcat' | 
  'nyt_bestsellers' |
  'manual';

export interface BookAIEnrichment {
  // Core themes and motifs
  themes?: string[];
  mood?: string;
  
  // Narrative elements
  narrativeStyle?: string;
  pacing?: string;
  perspective?: string;
  timeline?: string;
  
  // Audience and reception
  targetAudience?: string;
  complexity?: string;
  similarBooks?: string[];
  
  // Cultural aspects
  culturalSignificance?: string;
  historicalContext?: string;
  
  // Analysis
  aiAnalysis?: string;
  
  // Metadata
  enrichmentDate: string;
  enrichmentSource: string;
  version: string;
}

export interface BookSearchResult {
  id: string;
  title: string;
  authors: Author[];
  description?: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  coverImage?: string;
  inLibrary?: boolean;
}

// Define BookMetadataContextType interface for the provider
export interface BookMetadataContextType {
  books: Book[];
  metadataStatuses: Record<string, BookMetadataCompletionStatus>;
  loading: boolean;
  error: string | null;
  addBook: (googleBookId: string) => Promise<Book>;
  updateBook: (book: Book) => Promise<Book>;
  deleteBook: (id: string) => Promise<boolean>;
  getCompletionPercentage: (bookId: string) => number;
  getCompletionSuggestions: (bookId: string) => string[];
  updateBookSection: (bookId: string, section: keyof Book, data: any) => Promise<Book | null>;
  updateBookMetadata: (bookId: string, metadata: Partial<Book>) => Promise<void>;
  getBooksNeedingCompletion: (minPercentage?: number) => Book[];
  refreshBooks: () => void;
} 