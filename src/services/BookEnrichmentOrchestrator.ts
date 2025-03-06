import { Book, GoogleBooksVolume, BookAIEnrichment } from '../models/BookTypes';
import { bookMetadataService } from './BookMetadataService';
import { aiEnrichmentService } from './AIEnrichmentService';

/**
 * BookEnrichmentOrchestrator
 * 
 * This service orchestrates the enrichment process for books:
 * 1. When a user adds a book, we first get data from Google Books API
 * 2. We check if this book has already been enriched (in a shared database)
 * 3. If not enriched, we use Perplexity AI to fill in missing details
 * 4. We store the enriched metadata for all users to benefit from
 * 
 * This ensures we only perform AI enrichment once per unique book.
 */
export class BookEnrichmentOrchestrator {
  // Storage key for enriched book metadata
  private enrichedBooksKey = 'shared_enriched_books';
  
  // Storage key for tracking books that are in the enrichment process
  private enrichmentQueueKey = 'enrichment_queue';
  
  constructor() {
    this.initializeStorage();
  }
  
  /**
   * Initialize storage keys if they don't exist
   */
  private initializeStorage(): void {
    if (!localStorage.getItem(this.enrichedBooksKey)) {
      localStorage.setItem(this.enrichedBooksKey, JSON.stringify({}));
    }
    
    if (!localStorage.getItem(this.enrichmentQueueKey)) {
      localStorage.setItem(this.enrichmentQueueKey, JSON.stringify([]));
    }
  }
  
  /**
   * Get a book from the shared enriched database by ISBN
   * @param isbn The ISBN to look up
   * @returns The enriched book data if available, null otherwise
   */
  getEnrichedBookByISBN(isbn: string): Book | null {
    try {
      const enrichedBooks = JSON.parse(localStorage.getItem(this.enrichedBooksKey) || '{}');
      return enrichedBooks[isbn] || null;
    } catch (error) {
      console.error('Error retrieving enriched book:', error);
      return null;
    }
  }
  
  /**
   * Save an enriched book to the shared database
   * @param book The fully enriched book to save
   */
  saveEnrichedBook(book: Book): void {
    try {
      if (!book.isbn) {
        console.error('Cannot save enriched book without ISBN');
        return;
      }
      
      const enrichedBooks = JSON.parse(localStorage.getItem(this.enrichedBooksKey) || '{}');
      enrichedBooks[book.isbn] = book;
      localStorage.setItem(this.enrichedBooksKey, JSON.stringify(enrichedBooks));
      
      // Remove from enrichment queue if present
      this.removeFromEnrichmentQueue(book.isbn);
    } catch (error) {
      console.error('Error saving enriched book:', error);
    }
  }
  
  /**
   * Check if a book needs enrichment based on completion percentage
   * @param book The book to check
   * @returns True if the book needs enrichment
   */
  needsEnrichment(book: Book): boolean {
    // Consider a book needs enrichment if metadata is less than 80% complete
    const completionPercentage = bookMetadataService.calculateMetadataCompletionPercentage(book.id);
    return completionPercentage < 80;
  }
  
  /**
   * Check if a book is already in the enrichment queue
   * @param isbn The ISBN to check
   * @returns True if the book is in the queue
   */
  isInEnrichmentQueue(isbn: string): boolean {
    try {
      const queue = JSON.parse(localStorage.getItem(this.enrichmentQueueKey) || '[]');
      return queue.includes(isbn);
    } catch (error) {
      console.error('Error checking enrichment queue:', error);
      return false;
    }
  }
  
  /**
   * Add a book to the enrichment queue
   * @param isbn The ISBN to add to the queue
   */
  addToEnrichmentQueue(isbn: string): void {
    try {
      const queue = JSON.parse(localStorage.getItem(this.enrichmentQueueKey) || '[]');
      if (!queue.includes(isbn)) {
        queue.push(isbn);
        localStorage.setItem(this.enrichmentQueueKey, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Error adding to enrichment queue:', error);
    }
  }
  
  /**
   * Remove a book from the enrichment queue
   * @param isbn The ISBN to remove from the queue
   */
  removeFromEnrichmentQueue(isbn: string): void {
    try {
      const queue = JSON.parse(localStorage.getItem(this.enrichmentQueueKey) || '[]');
      const updatedQueue = queue.filter((queuedIsbn: string) => queuedIsbn !== isbn);
      localStorage.setItem(this.enrichmentQueueKey, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Error removing from enrichment queue:', error);
    }
  }
  
  /**
   * Add a book to the user's library with smart enrichment
   * @param googleBookId The Google Books ID to add
   * @returns Promise with the added book
   */
  async addBookToLibrary(googleBookId: string): Promise<Book> {
    try {
      // First, fetch the book data from Google Books API
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes/${googleBookId}`
      );
      
      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status}`);
      }
      
      const googleBook: GoogleBooksVolume = await response.json();
      
      // Convert to our minimal book format
      const minimalData = bookMetadataService.convertGoogleBookToMinimalData(googleBook);
      
      // Check if we already have enriched data for this book (by ISBN)
      if (minimalData.isbn) {
        const enrichedBook = this.getEnrichedBookByISBN(minimalData.isbn);
        
        if (enrichedBook) {
          // We already have enriched data, update the book ID and save to user's library
          const bookForUser: Book = {
            ...enrichedBook,
            id: googleBookId, // Ensure the user's book has their specific Google Book ID
            dateAdded: new Date().toISOString(),
            readingStatus: 'to-read' as const,
            userRating: 0,
            lastModified: new Date().toISOString()
          };
          
          // Save to user's library
          return bookMetadataService.saveBook(bookForUser);
        }
      }
      
      // If we don't have enriched data or can't find by ISBN,
      // create a full book with default values and add to user's library
      const fullBook = bookMetadataService.createFullBookFromMinimalData(minimalData);
      const savedBook = bookMetadataService.saveBook(fullBook);
      
      // If the book has an ISBN and needs enrichment, schedule enrichment
      if (savedBook.isbn && this.needsEnrichment(savedBook)) {
        this.scheduleEnrichment(savedBook);
      }
      
      return savedBook;
    } catch (error) {
      console.error('Error adding book to library:', error);
      throw error;
    }
  }
  
  /**
   * Schedule a book for background enrichment using Perplexity AI
   * @param book The book to enrich
   */
  async scheduleEnrichment(book: Book): Promise<void> {
    // Only proceed if the book has an ISBN and isn't already in the queue
    if (!book.isbn || this.isInEnrichmentQueue(book.isbn)) {
      return;
    }
    
    // Add to enrichment queue
    this.addToEnrichmentQueue(book.isbn);
    
    // In a real production app, we might use a server-side queue or worker
    // For now, we'll do the enrichment immediately in the background
    
    try {
      // Check if we have the API key before attempting enrichment
      if (!aiEnrichmentService.hasAPIKey()) {
        console.log('Perplexity API key not set. Skipping enrichment.');
        return;
      }
      
      // Perform enrichment
      const enrichedBook = await aiEnrichmentService.enrichBookMetadata(book);
      
      // Save to shared enriched database
      this.saveEnrichedBook(enrichedBook);
      
      // Also update the user's copy of the book
      bookMetadataService.saveBook(enrichedBook);
      
    } catch (error) {
      console.error('Error enriching book:', error);
      this.removeFromEnrichmentQueue(book.isbn);
    }
  }
  
  /**
   * Process all books in the enrichment queue
   * This could be called periodically or when the app has network connectivity
   */
  async processEnrichmentQueue(): Promise<void> {
    try {
      const queue = JSON.parse(localStorage.getItem(this.enrichmentQueueKey) || '[]');
      
      if (queue.length === 0 || !aiEnrichmentService.hasAPIKey()) {
        return;
      }
      
      // Process up to 5 books at a time to avoid overloading the API
      const booksToProcess = queue.slice(0, 5);
      
      for (const isbn of booksToProcess) {
        // Find book in user's library by ISBN
        const userBooks = bookMetadataService.getAllBooks();
        const bookToEnrich = userBooks.find(book => book.isbn === isbn);
        
        if (bookToEnrich) {
          // Enrich and save
          const enrichedBook = await aiEnrichmentService.enrichBookMetadata(bookToEnrich);
          this.saveEnrichedBook(enrichedBook);
          bookMetadataService.saveBook(enrichedBook);
        }
        
        // Remove from queue regardless of success
        this.removeFromEnrichmentQueue(isbn);
      }
    } catch (error) {
      console.error('Error processing enrichment queue:', error);
    }
  }
  
  /**
   * Enrich book metadata using AI
   * @param book The book to enrich
   * @returns Promise with the BookAIEnrichment data
   */
  async enrichBookMetadata(book: Book): Promise<BookAIEnrichment> {
    try {
      // Check if we have the API key before attempting enrichment
      if (!aiEnrichmentService.hasAPIKey()) {
        throw new Error('Perplexity API key not set. Cannot perform enrichment.');
      }
      
      // Generate enrichment data using AI
      const enrichedBook = await aiEnrichmentService.enrichBookMetadata(book);
      
      // Extract the AI enrichment data
      const enrichmentData: BookAIEnrichment = {
        themes: enrichedBook.themes?.map(theme => theme.name) || [],
        mood: enrichedBook.narrativeStructure?.format || 'Unknown',
        narrativeStyle: enrichedBook.narrativeStructure?.pov || 'Unknown',
        pacing: 'Medium',  // Default value
        targetAudience: enrichedBook.audience || 'General',
        complexity: enrichedBook.complexity?.conceptual?.toString() || 'Medium',
        similarBooks: [],  // Would need to implement this separately
        culturalSignificance: 'Unknown',
        aiAnalysis: `This book is categorized as ${enrichedBook.genres?.join(', ')} and explores themes of ${enrichedBook.themes?.map(t => t.name).join(', ')}.`,
        enrichmentDate: new Date().toISOString(),
        enrichmentSource: 'perplexity_ai',
        version: '1.0'
      };
      
      // If the book has an ISBN and we got enrichment data, save to shared database
      if (book.isbn) {
        // Update the original book with the enrichment data
        const updatedBook = {
          ...book,
          enrichedData: enrichmentData,
          lastModified: new Date().toISOString()
        };
        
        // Save to shared enriched database
        this.saveEnrichedBook(updatedBook);
        
        // Also update the user's copy of the book
        bookMetadataService.saveBook(updatedBook);
      }
      
      return enrichmentData;
    } catch (error) {
      console.error('Error enriching book metadata:', error);
      
      // Return a minimal enrichment object to avoid null errors
      return {
        themes: [],
        enrichmentDate: new Date().toISOString(),
        enrichmentSource: 'error',
        version: '1.0'
      };
    }
  }
}

// Create and export a singleton instance
export const bookEnrichmentOrchestrator = new BookEnrichmentOrchestrator(); 