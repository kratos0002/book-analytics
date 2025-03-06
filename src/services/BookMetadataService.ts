import { 
  Book, 
  Author, 
  GoogleBooksVolume, 
  MinimalBookData, 
  BookMetadataCompletionStatus,
  BookEnrichmentSource,
  ExternalBookData,
  BookAIEnrichment
} from '../models/BookTypes';

/**
 * BookMetadataService
 * 
 * A service for fetching, enriching, and managing book metadata from various sources.
 * This service handles progressive data collection, allowing users to add detailed
 * information about books over time.
 */
export class BookMetadataService {
  private bookStorageKey = 'enhanced_books';
  private metadataStatusKey = 'metadata_completion_status';
  private externalDataKey = 'external_book_data';
  
  /**
   * Initialize the service and ensure storage is ready
   */
  constructor() {
    this.initializeStorage();
  }
  
  /**
   * Ensure required local storage keys exist
   */
  private initializeStorage(): void {
    if (!localStorage.getItem(this.bookStorageKey)) {
      localStorage.setItem(this.bookStorageKey, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(this.metadataStatusKey)) {
      localStorage.setItem(this.metadataStatusKey, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(this.externalDataKey)) {
      localStorage.setItem(this.externalDataKey, JSON.stringify([]));
    }
  }
  
  /**
   * Search for books using the Google Books API
   * @param query Search query string
   * @param maxResults Maximum number of results to return
   * @returns Promise with search results
   */
  async searchGoogleBooks(query: string, maxResults: number = 10): Promise<GoogleBooksVolume[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
      );
      
      if (!response.ok) {
        throw new Error(`Google Books API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error searching Google Books:', error);
      throw error;
    }
  }
  
  /**
   * Fetch detailed book information from Google Books API by ISBN
   * @param isbn ISBN identifier
   * @returns Promise with book data
   */
  async fetchBookByISBN(isbn: string): Promise<GoogleBooksVolume | null> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
      );
      
      if (!response.ok) {
        throw new Error(`Google Books API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.totalItems > 0 && data.items && data.items.length > 0) {
        return data.items[0];
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching book by ISBN ${isbn}:`, error);
      throw error;
    }
  }
  
  /**
   * Convert Google Books API data to our minimal book model
   * @param googleBook Google Books volume data
   * @returns Minimal book data compatible with our model
   */
  convertGoogleBookToMinimalData(googleBook: GoogleBooksVolume): MinimalBookData {
    const volumeInfo = googleBook.volumeInfo;
    
    // Extract ISBN-13 if available, otherwise ISBN-10, or generate a placeholder
    let isbn = '';
    if (volumeInfo.industryIdentifiers && volumeInfo.industryIdentifiers.length > 0) {
      const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_13');
      const isbn10 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_10');
      
      isbn = isbn13 ? isbn13.identifier : (isbn10 ? isbn10.identifier : `placeholder-${Date.now()}`);
    } else {
      isbn = `placeholder-${Date.now()}`;
    }
    
    // Create minimal authors array
    const authors: Author[] = (volumeInfo.authors || ['Unknown Author']).map(name => ({
      id: `author-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      name
    }));
    
    return {
      id: googleBook.id,
      title: volumeInfo.title,
      authors,
      publisher: volumeInfo.publisher || 'Unknown Publisher',
      publishedDate: volumeInfo.publishedDate || new Date().toISOString().split('T')[0],
      pageCount: volumeInfo.pageCount || 0,
      language: volumeInfo.language || 'en',
      description: volumeInfo.description || '',
      coverImage: volumeInfo.imageLinks?.thumbnail || undefined,
      isbn
    };
  }
  
  /**
   * Create a full book record with default values from minimal data
   * @param minimalData Basic book information
   * @returns Complete book record with default values for required fields
   */
  createFullBookFromMinimalData(minimalData: MinimalBookData): Book {
    const currentDate = new Date().toISOString();
    
    // Infer whether the book is fiction based on categories (if available)
    // This is a heuristic approach and might not be accurate
    const inferFiction = (categories?: string[]): boolean => {
      if (!categories || categories.length === 0) return true; // Default to fiction
      
      const nonFictionKeywords = [
        'biography', 'autobiography', 'memoir', 'history', 'science', 'academic',
        'reference', 'self-help', 'business', 'economics', 'philosophy', 'religion',
        'politics', 'true crime', 'travel', 'essay'
      ];
      
      for (const category of categories) {
        const lowerCategory = category.toLowerCase();
        for (const keyword of nonFictionKeywords) {
          if (lowerCategory.includes(keyword)) {
            return false;
          }
        }
      }
      
      return true;
    };
    
    // Attempt to determine audience from categories or default to 'adult'
    const inferAudience = (categories?: string[]): Book['audience'] => {
      if (!categories || categories.length === 0) return 'adult';
      
      const lowerCategories = categories.map(c => c.toLowerCase());
      
      if (lowerCategories.some(c => c.includes('children') || c.includes('juvenile'))) {
        return 'children';
      }
      
      if (lowerCategories.some(c => c.includes('middle grade') || c.includes('middle-grade'))) {
        return 'middle-grade';
      }
      
      if (lowerCategories.some(c => c.includes('young adult') || c.includes('ya') || c.includes('teen'))) {
        return 'young-adult';
      }
      
      if (lowerCategories.some(c => c.includes('academic') || c.includes('textbook') || c.includes('scholarly'))) {
        return 'academic';
      }
      
      return 'adult';
    };
    
    return {
      ...minimalData,
      format: 'paperback', // Default format
      genres: [], // Empty array for now
      subgenres: [],
      subjects: [],
      contentTags: [],
      audience: 'adult', // Default audience
      fiction: true, // Default to fiction
      narrativeStructure: {
        pov: 'third-person-limited', // Common default
        tense: 'past',
        timeline: 'linear'
      },
      themes: [],
      locations: [],
      characters: [],
      userRating: 0,
      readingStatus: 'to-read',
      dateAdded: currentDate,
      isFavorite: false,
      isReread: false,
      readCount: 0,
      readingSessions: [],
      annotations: [],
      userNotes: '',
      userTags: [],
      emotionalResponse: {
        overall: 'neutral',
        emotions: {},
        impactRating: 0,
        memorability: 0
      },
      awards: [],
      culturalContext: {
        representation: [],
        diversityElements: []
      },
      complexity: {},
      lastModified: currentDate
    };
  }
  
  /**
   * Save a book to storage
   * @param book The book data to save
   * @returns The saved book
   */
  saveBook(book: Book): Book {
    // Update last modified date
    const updatedBook = {
      ...book,
      lastModified: new Date().toISOString()
    };
    
    // Get current books
    const books = this.getAllBooks();
    
    // Find and update existing book or add new one
    const existingIndex = books.findIndex(b => b.id === book.id);
    
    if (existingIndex >= 0) {
      books[existingIndex] = updatedBook;
    } else {
      books.push(updatedBook);
      // Initialize metadata completion status for new book
      this.initializeMetadataStatus(book.id);
    }
    
    // Save updated books
    localStorage.setItem(this.bookStorageKey, JSON.stringify(books));
    
    return updatedBook;
  }
  
  /**
   * Get all books from storage
   * @returns Array of books
   */
  getAllBooks(): Book[] {
    try {
      const books = localStorage.getItem(this.bookStorageKey);
      return books ? JSON.parse(books) : [];
    } catch (error) {
      console.error('Error retrieving books from storage:', error);
      return [];
    }
  }
  
  /**
   * Get a specific book by ID
   * @param id Book ID to find
   * @returns The book or null if not found
   */
  getBookById(id: string): Book | null {
    const books = this.getAllBooks();
    return books.find(book => book.id === id) || null;
  }
  
  /**
   * Delete a book from storage
   * @param id Book ID to delete
   * @returns True if deleted, false if not found
   */
  deleteBook(id: string): boolean {
    const books = this.getAllBooks();
    const initialLength = books.length;
    
    const filteredBooks = books.filter(book => book.id !== id);
    
    if (filteredBooks.length !== initialLength) {
      localStorage.setItem(this.bookStorageKey, JSON.stringify(filteredBooks));
      
      // Also remove metadata status
      this.deleteMetadataStatus(id);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Initialize metadata completion status for a new book
   * @param bookId ID of the book
   */
  private initializeMetadataStatus(bookId: string): void {
    const status: BookMetadataCompletionStatus = {
      bookId,
      basicInfoComplete: true, // Basic info is complete on creation
      publicationDetailsComplete: false,
      contentClassificationComplete: false,
      narrativeElementsComplete: false,
      contentAnalysisComplete: false,
      readingExperienceComplete: false,
      culturalContextComplete: false,
      complexityAnalysisComplete: false
    };
    
    const allStatuses = this.getAllMetadataStatuses();
    allStatuses.push(status);
    
    localStorage.setItem(this.metadataStatusKey, JSON.stringify(allStatuses));
  }
  
  /**
   * Get metadata completion status for a specific book
   * @param bookId ID of the book
   * @returns Metadata completion status or null if not found
   */
  getMetadataStatus(bookId: string): BookMetadataCompletionStatus | null {
    const allStatuses = this.getAllMetadataStatuses();
    return allStatuses.find(status => status.bookId === bookId) || null;
  }
  
  /**
   * Get all metadata completion statuses
   * @returns Array of all metadata completion statuses
   */
  private getAllMetadataStatuses(): BookMetadataCompletionStatus[] {
    try {
      const statuses = localStorage.getItem(this.metadataStatusKey);
      return statuses ? JSON.parse(statuses) : [];
    } catch (error) {
      console.error('Error retrieving metadata statuses from storage:', error);
      return [];
    }
  }
  
  /**
   * Update metadata completion status for a book
   * @param status Updated metadata completion status
   */
  updateMetadataStatus(status: BookMetadataCompletionStatus): void {
    const allStatuses = this.getAllMetadataStatuses();
    const existingIndex = allStatuses.findIndex(s => s.bookId === status.bookId);
    
    if (existingIndex >= 0) {
      allStatuses[existingIndex] = status;
      localStorage.setItem(this.metadataStatusKey, JSON.stringify(allStatuses));
    }
  }
  
  /**
   * Delete metadata completion status for a book
   * @param bookId ID of the book
   */
  private deleteMetadataStatus(bookId: string): void {
    const allStatuses = this.getAllMetadataStatuses();
    const filteredStatuses = allStatuses.filter(status => status.bookId !== bookId);
    
    localStorage.setItem(this.metadataStatusKey, JSON.stringify(filteredStatuses));
  }
  
  /**
   * Save external book data from an API
   * @param bookId ID of the book
   * @param source Source of the data
   * @param data The raw data from the source
   */
  saveExternalBookData(bookId: string, source: BookEnrichmentSource, data: any): void {
    const externalData: ExternalBookData = {
      source: source as 'google_books' | 'open_library' | 'goodreads' | 'manual',
      data,
      retrievedAt: new Date().toISOString()
    };
    
    const allExternalData = this.getAllExternalData();
    
    // Remove any existing data for this book/source combination
    const filteredData = allExternalData.filter(
      item => !(item.data.id === bookId && item.source === source)
    );
    
    // Add the new data
    filteredData.push(externalData);
    
    localStorage.setItem(this.externalDataKey, JSON.stringify(filteredData));
  }
  
  /**
   * Get all external book data
   * @returns Array of all external book data
   */
  private getAllExternalData(): ExternalBookData[] {
    try {
      const data = localStorage.getItem(this.externalDataKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error retrieving external data from storage:', error);
      return [];
    }
  }
  
  /**
   * Get external data for a specific book
   * @param bookId ID of the book
   * @param source Optional source to filter by
   * @returns Array of external data for the book
   */
  getExternalDataForBook(bookId: string, source?: BookEnrichmentSource): ExternalBookData[] {
    const allData = this.getAllExternalData();
    
    return allData.filter(item => {
      // If source is specified, filter by both book ID and source
      if (source) {
        return item.data.id === bookId && item.source === source;
      }
      
      // Otherwise, just filter by book ID
      return item.data.id === bookId;
    });
  }
  
  /**
   * Calculate the overall completion percentage of a book's metadata
   * @param bookId ID of the book
   * @returns Percentage of metadata fields completed (0-100)
   */
  calculateMetadataCompletionPercentage(bookId: string): number {
    const status = this.getMetadataStatus(bookId);
    
    if (!status) return 0;
    
    // Count completed sections
    const completedSections = Object.entries(status)
      .filter(([key, value]) => key !== 'bookId' && value === true)
      .length;
    
    // Total number of sections (excluding the bookId field)
    const totalSections = Object.keys(status).length - 1;
    
    return Math.round((completedSections / totalSections) * 100);
  }
  
  /**
   * Add a book from Google Books API
   * @param googleBookId Google Books volume ID
   * @returns Promise with the saved book
   */
  async addBookFromGoogleBooks(googleBookId: string): Promise<Book> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes/${googleBookId}`
      );
      
      if (!response.ok) {
        throw new Error(`Google Books API returned ${response.status}: ${response.statusText}`);
      }
      
      const googleBook: GoogleBooksVolume = await response.json();
      
      // Save the raw Google Books data
      this.saveExternalBookData(googleBookId, 'google_books', googleBook);
      
      // Convert to our minimal book format
      const minimalData = this.convertGoogleBookToMinimalData(googleBook);
      
      // Create a full book with default values
      const fullBook = this.createFullBookFromMinimalData(minimalData);
      
      // Save the book
      return this.saveBook(fullBook);
    } catch (error) {
      console.error('Error adding book from Google Books:', error);
      throw error;
    }
  }
  
  /**
   * Update a specific section of a book's metadata
   * @param bookId ID of the book to update
   * @param section Name of the section to update
   * @param data New data for the section
   * @returns Updated book or null if book not found
   */
  updateBookSection(
    bookId: string, 
    section: keyof Book, 
    data: any
  ): Book | null {
    const book = this.getBookById(bookId);
    
    if (!book) {
      return null;
    }
    
    // Create updated book with new section data
    const updatedBook = {
      ...book,
      [section]: data,
      lastModified: new Date().toISOString()
    };
    
    // Save the updated book
    this.saveBook(updatedBook);
    
    // Update metadata completion status based on the section updated
    this.updateMetadataCompletionForSection(bookId, section);
    
    return updatedBook;
  }
  
  /**
   * Update metadata completion status based on updated section
   * @param bookId ID of the book
   * @param section The section that was updated
   */
  private updateMetadataCompletionForSection(bookId: string, section: keyof Book): void {
    const status = this.getMetadataStatus(bookId);
    
    if (!status) {
      return;
    }
    
    // Map section names to metadata status fields
    const sectionToStatusField: Partial<Record<keyof Book, keyof BookMetadataCompletionStatus>> = {
      authors: 'basicInfoComplete',
      title: 'basicInfoComplete',
      subtitle: 'basicInfoComplete',
      
      publisher: 'publicationDetailsComplete',
      publishedDate: 'publicationDetailsComplete',
      edition: 'publicationDetailsComplete',
      language: 'publicationDetailsComplete',
      translator: 'publicationDetailsComplete',
      pageCount: 'publicationDetailsComplete',
      format: 'publicationDetailsComplete',
      series: 'publicationDetailsComplete',
      
      genres: 'contentClassificationComplete',
      subgenres: 'contentClassificationComplete',
      subjects: 'contentClassificationComplete',
      contentTags: 'contentClassificationComplete',
      audience: 'contentClassificationComplete',
      fiction: 'contentClassificationComplete',
      
      narrativeStructure: 'narrativeElementsComplete',
      
      themes: 'contentAnalysisComplete',
      locations: 'contentAnalysisComplete',
      historicalPeriod: 'contentAnalysisComplete',
      characters: 'contentAnalysisComplete',
      
      readingSessions: 'readingExperienceComplete',
      annotations: 'readingExperienceComplete',
      userNotes: 'readingExperienceComplete',
      userTags: 'readingExperienceComplete',
      emotionalResponse: 'readingExperienceComplete',
      
      awards: 'culturalContextComplete',
      culturalContext: 'culturalContextComplete',
      
      complexity: 'complexityAnalysisComplete'
    };
    
    // Get the corresponding status field
    const statusField = sectionToStatusField[section];
    
    if (statusField) {
      // Update the status
      const updatedStatus = {
        ...status,
        [statusField]: true
      };
      
      this.updateMetadataStatus(updatedStatus);
    }
  }
  
  /**
   * Get books that need metadata completion
   * @param minCompletionPercentage Minimum completion percentage to exclude
   * @returns Array of books with less than the specified completion percentage
   */
  getBooksNeedingMetadataCompletion(minCompletionPercentage: number = 80): Book[] {
    const books = this.getAllBooks();
    
    return books.filter(book => {
      const completionPercentage = this.calculateMetadataCompletionPercentage(book.id);
      return completionPercentage < minCompletionPercentage;
    });
  }
  
  /**
   * Get suggestions for the next metadata sections to complete for a book
   * @param bookId ID of the book
   * @returns Array of section names that need completion
   */
  getMetadataCompletionSuggestions(bookId: string): string[] {
    const status = this.getMetadataStatus(bookId);
    
    if (!status) {
      return [];
    }
    
    // Map status fields to user-friendly section names
    const incompleteFields: string[] = [];
    
    if (!status.publicationDetailsComplete) {
      incompleteFields.push('Publication Details');
    }
    
    if (!status.contentClassificationComplete) {
      incompleteFields.push('Content Classification');
    }
    
    if (!status.narrativeElementsComplete) {
      incompleteFields.push('Narrative Elements');
    }
    
    if (!status.contentAnalysisComplete) {
      incompleteFields.push('Content Analysis');
    }
    
    if (!status.readingExperienceComplete) {
      incompleteFields.push('Reading Experience');
    }
    
    if (!status.culturalContextComplete) {
      incompleteFields.push('Cultural Context');
    }
    
    if (!status.complexityAnalysisComplete) {
      incompleteFields.push('Complexity Analysis');
    }
    
    return incompleteFields;
  }
  
  /**
   * Get enrichment data for a book by Google Books ID
   * @param googleBooksId The Google Books ID
   * @returns The BookAIEnrichment if found, undefined otherwise
   */
  getBookEnrichment(googleBooksId: string): BookAIEnrichment | undefined {
    try {
      // Try to find the book in our library first
      const book = this.getBookById(googleBooksId);
      if (book?.enrichedData) {
        return book.enrichedData;
      }
      
      // If not found in library, check for enriched books by Google Books ID
      const enrichedBooksStr = localStorage.getItem('enriched_books_metadata') || '{}';
      const enrichedBooks = JSON.parse(enrichedBooksStr);
      
      return enrichedBooks[googleBooksId];
    } catch (error) {
      console.error('Error retrieving book enrichment:', error);
      return undefined;
    }
  }

  /**
   * Save enrichment data for a book
   * @param googleBooksId The Google Books ID
   * @param enrichmentData The enrichment data to save
   */
  saveBookEnrichment(googleBooksId: string, enrichmentData: BookAIEnrichment): void {
    try {
      // Save to enriched books storage
      const enrichedBooksStr = localStorage.getItem('enriched_books_metadata') || '{}';
      const enrichedBooks = JSON.parse(enrichedBooksStr);
      
      enrichedBooks[googleBooksId] = enrichmentData;
      localStorage.setItem('enriched_books_metadata', JSON.stringify(enrichedBooks));
      
      // Update the book in our library if it exists
      const book = this.getBookById(googleBooksId);
      if (book) {
        book.enrichedData = enrichmentData;
        this.saveBook(book);
      }
    } catch (error) {
      console.error('Error saving book enrichment:', error);
    }
  }
}

// Create and export a singleton instance
export const bookMetadataService = new BookMetadataService(); 