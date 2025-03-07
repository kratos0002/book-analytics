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
      
      // Automatically start enrichment process for all new books with ISBN
      if (savedBook.isbn) {
        // Start immediate enrichment in the background
        this.processEnrichment(savedBook).catch(error => {
          console.error('Background enrichment failed:', error);
        });
      }
      
      return savedBook;
    } catch (error) {
      console.error('Error adding book to library:', error);
      throw error;
    }
  }
  
  /**
   * Enrich book metadata using AI
   * @param book The book to enrich
   * @returns Promise with the BookAIEnrichment data
   */
  async enrichBookMetadata(book: Book): Promise<BookAIEnrichment> {
    try {
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
  
  /**
   * Schedule a book for background enrichment using Perplexity AI
   * @param book The book to enrich
   */
  async scheduleEnrichment(book: Book): Promise<void> {
    try {
      if (!book.isbn) {
        console.error('Cannot schedule enrichment for book without ISBN');
        return;
      }
      
      // Check if this book is already in the enrichment queue
      if (this.isInEnrichmentQueue(book.isbn)) {
        console.log(`Book "${book.title}" is already in the enrichment queue`);
        return;
      }
      
      // Add to the enrichment queue
      this.addToEnrichmentQueue(book.isbn);
      
      console.log(`Scheduled enrichment for book "${book.title}" (ISBN: ${book.isbn})`);
      
      // Start the enrichment process asynchronously immediately
      this.processEnrichment(book).catch(error => {
        console.error(`Error during enrichment of "${book.title}":`, error);
      });
    } catch (error) {
      console.error('Error scheduling enrichment:', error);
    }
  }
  
  /**
   * Process book enrichment in the background
   * @param book The book to enrich
   */
  private async processEnrichment(book: Book): Promise<void> {
    try {
      // Skip if no ISBN - we use ISBN to store in shared database
      if (!book.isbn) {
        console.error('Cannot enrich book without ISBN');
        return;
      }
      
      // Add to queue if not already there
      if (!this.isInEnrichmentQueue(book.isbn)) {
        this.addToEnrichmentQueue(book.isbn);
      }
      
      console.log(`Starting enrichment process for book "${book.title}"...`);
      
      // First, identify what data is missing
      const missingFields = aiEnrichmentService.identifyMissingData(book);
      console.log(`Fields needing enrichment: ${missingFields.join(', ')}`);
      
      if (missingFields.length === 0) {
        console.log(`Book "${book.title}" already has complete metadata.`);
        this.removeFromEnrichmentQueue(book.isbn);
        return;
      }
      
      // Generate enriched metadata
      console.log(`Generating enriched metadata for "${book.title}"...`);
      const enrichedBook = await aiEnrichmentService.enrichBookMetadata(book);
      
      // If the book has enriched data from Perplexity, save it to the shared database
      if (enrichedBook.enrichedData && enrichedBook.isbn) {
        console.log(`Saving enriched data for book "${enrichedBook.title}" to shared database...`);
        
        // Update user's copy of the book with enriched data
        bookMetadataService.saveBook(enrichedBook);
        
        // Save to shared enriched database for other users
        this.saveEnrichedBook(enrichedBook);
        
        // Generate a more detailed book analysis if needed
        if (!enrichedBook.enrichedData.aiAnalysis || enrichedBook.enrichedData.aiAnalysis.length < 100) {
          console.log(`Generating detailed analysis for "${book.title}"...`);
          const analysisData = await aiEnrichmentService.generateBookAnalysis(enrichedBook);
          
          // Update the book's enriched data with the detailed analysis
          enrichedBook.enrichedData = {
            ...enrichedBook.enrichedData,
            ...analysisData,
            enrichmentDate: new Date().toISOString()
          };
          
          // Save the updated book again
          bookMetadataService.saveBook(enrichedBook);
          this.saveEnrichedBook(enrichedBook);
        }
      }
      
      // Remove from the enrichment queue
      this.removeFromEnrichmentQueue(book.isbn);
      console.log(`Enrichment complete for book "${book.title}"`);
      
    } catch (error) {
      console.error(`Error during enrichment process for book "${book.title}":`, error);
      
      // Remove from queue even if there was an error
      if (book.isbn) {
        this.removeFromEnrichmentQueue(book.isbn);
      }
    }
  }
  
  /**
   * Process all books in the enrichment queue
   */
  async processEnrichmentQueue(): Promise<void> {
    try {
      // Get the current queue
      const queue = JSON.parse(localStorage.getItem(this.enrichmentQueueKey) || '[]');
      
      if (queue.length === 0) {
        console.log('Enrichment queue is empty');
        return;
      }
      
      console.log(`Processing enrichment queue. ${queue.length} books in queue.`);
      
      // Process each book in the queue
      for (const isbn of queue) {
        // Find the book in the user's library using the ISBN
        const userBooks = bookMetadataService.getAllBooks();
        const bookToEnrich = userBooks.find(book => book.isbn === isbn);
        
        if (bookToEnrich) {
          // Process this book
          await this.processEnrichment(bookToEnrich);
          
          // Wait a bit before processing the next book to avoid API rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          // If book not found, remove it from the queue
          this.removeFromEnrichmentQueue(isbn);
        }
      }
    } catch (error) {
      console.error('Error processing enrichment queue:', error);
    }
  }
}

// Create and export a singleton instance
export const bookEnrichmentOrchestrator = new BookEnrichmentOrchestrator(); 