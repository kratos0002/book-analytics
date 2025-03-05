import React, { useState, useEffect } from 'react';
import BookSearchBar from './components/BookSearchBar';
import Dashboard from './components/Dashboard';
import { Book } from './types';
import { getLibrary, removeFromLibrary } from './utils/library';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Load initial library state
    const libraryBooks = getLibrary();
    setBooks(libraryBooks);
    if (libraryBooks.length > 0) {
      setLastUpdated(new Date());
    }
  }, []);

  const handleBookSelect = (book: Book) => {
    setBooks(getLibrary()); // Refresh the library after a book is added
    setLastUpdated(new Date());
  };

  const handleDeleteBook = (bookId: string) => {
    removeFromLibrary(bookId);
    setBooks(getLibrary()); // Refresh the library after a book is removed
    setLastUpdated(new Date());
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Book Analytics Dashboard</h1>
          <div className="flex items-center justify-between">
            <div className="w-96">
              <BookSearchBar onBookSelect={handleBookSelect} />
            </div>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <Dashboard books={books} onDeleteBook={handleDeleteBook} />
      </div>
    </div>
  );
}
