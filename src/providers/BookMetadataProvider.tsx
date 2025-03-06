import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Book, BookMetadataCompletionStatus, BookMetadataContextType } from '../models/BookTypes';
import { bookMetadataService } from '../services/BookMetadataService';

// Create context with a default placeholder value
const BookMetadataContext = createContext<BookMetadataContextType>({
  books: [],
  metadataStatuses: {},
  loading: true,
  error: null,
  addBook: async () => ({} as Book),
  updateBook: () => Promise.resolve({} as Book),
  deleteBook: () => Promise.resolve(false),
  getCompletionPercentage: () => 0,
  getCompletionSuggestions: () => [],
  updateBookSection: () => Promise.resolve(null),
  updateBookMetadata: () => Promise.resolve(),
  getBooksNeedingCompletion: () => [],
  refreshBooks: () => {}
});

// Provider props interface
interface BookMetadataProviderProps {
  children: ReactNode;
}

// Provider component
export const BookMetadataProvider: React.FC<BookMetadataProviderProps> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [metadataStatuses, setMetadataStatuses] = useState<Record<string, BookMetadataCompletionStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load books from storage on component mount
  useEffect(() => {
    refreshBooks();
  }, []);

  // Function to refresh books from storage
  const refreshBooks = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all books from the service
      const allBooks = bookMetadataService.getAllBooks();
      setBooks(allBooks);
      
      // Build a record of metadata statuses for easy lookup
      const statuses: Record<string, BookMetadataCompletionStatus> = {};
      
      allBooks.forEach(book => {
        const status = bookMetadataService.getMetadataStatus(book.id);
        if (status) {
          statuses[book.id] = status;
        }
      });
      
      setMetadataStatuses(statuses);
    } catch (error) {
      console.error('Error loading books:', error);
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  // Add a book from Google Books API
  const addBook = async (googleBookId: string): Promise<Book> => {
    try {
      const book = await bookMetadataService.addBookFromGoogleBooks(googleBookId);
      
      // Refresh books to update the state
      refreshBooks();
      
      return book;
    } catch (error) {
      console.error('Error adding book:', error);
      setError('Failed to add book');
      throw error;
    }
  };

  // Update a book in storage
  const updateBook = async (book: Book): Promise<Book> => {
    try {
      const updatedBook = bookMetadataService.saveBook(book);
      
      // Refresh books to update the state
      refreshBooks();
      
      return updatedBook;
    } catch (error) {
      console.error('Error updating book:', error);
      setError('Failed to update book');
      throw error;
    }
  };

  // Delete a book from storage
  const deleteBook = async (id: string): Promise<boolean> => {
    try {
      const result = bookMetadataService.deleteBook(id);
      
      // Refresh books to update the state
      if (result) {
        refreshBooks();
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting book:', error);
      setError('Failed to delete book');
      throw error;
    }
  };

  // Get completion percentage for a book
  const getCompletionPercentage = (bookId: string): number => {
    return bookMetadataService.calculateMetadataCompletionPercentage(bookId);
  };

  // Get completion suggestions for a book
  const getCompletionSuggestions = (bookId: string): string[] => {
    return bookMetadataService.getMetadataCompletionSuggestions(bookId);
  };

  // Update a specific section of a book
  const updateBookSection = async (bookId: string, section: keyof Book, data: any): Promise<Book | null> => {
    try {
      const result = bookMetadataService.updateBookSection(bookId, section, data);
      
      // Refresh books to update the state
      if (result) {
        refreshBooks();
      }
      
      return result;
    } catch (error) {
      console.error('Error updating book section:', error);
      setError('Failed to update book section');
      throw error;
    }
  };

  // Update book metadata
  const updateBookMetadata = async (bookId: string, metadata: Partial<Book>): Promise<void> => {
    try {
      // Find the book
      const bookToUpdate = books.find(book => book.id === bookId);
      if (!bookToUpdate) {
        throw new Error(`Book with ID ${bookId} not found`);
      }
      
      // Update the book with new metadata
      const updatedBook = { ...bookToUpdate, ...metadata, dateModified: new Date().toISOString() };
      
      // Save the updated book
      bookMetadataService.saveBook(updatedBook);
      
      // Refresh books to update the state
      refreshBooks();
    } catch (error) {
      console.error('Error updating book metadata:', error);
      setError('Failed to update book metadata');
      throw error;
    }
  };

  // Get books that need metadata completion
  const getBooksNeedingCompletion = (minPercentage: number = 80): Book[] => {
    return bookMetadataService.getBooksNeedingMetadataCompletion(minPercentage);
  };

  // Provide context value
  const contextValue: BookMetadataContextType = {
    books,
    metadataStatuses,
    loading,
    error,
    addBook,
    updateBook,
    deleteBook,
    getCompletionPercentage,
    getCompletionSuggestions,
    updateBookSection,
    updateBookMetadata,
    getBooksNeedingCompletion,
    refreshBooks
  };

  return (
    <BookMetadataContext.Provider value={contextValue}>
      {children}
    </BookMetadataContext.Provider>
  );
};

// Custom hook for using the book metadata context
export const useBookMetadata = () => {
  const context = useContext(BookMetadataContext);
  
  if (context === undefined) {
    throw new Error('useBookMetadata must be used within a BookMetadataProvider');
  }
  
  return context;
}; 