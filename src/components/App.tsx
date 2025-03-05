import React, { useState, useEffect } from 'react';
import BookSearchBar from './components/BookSearchBar';
import Dashboard from './components/Dashboard';
import { Book } from './types';
import { getLibrary, removeFromLibrary } from './utils/library';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const libraryBooks = getLibrary();
    setBooks(libraryBooks);
    if (libraryBooks.length > 0) {
      setLastUpdated(new Date());
    }
  }, []);

  const handleBookSelect = (book: Book) => {
    setBooks(getLibrary());
    setLastUpdated(new Date());
  };

  const handleDeleteBook = (bookId: string) => {
    removeFromLibrary(bookId);
    setBooks(getLibrary());
    setLastUpdated(new Date());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header Section */}
        <div className="mb-6 bg-white/5 backdrop-blur-lg rounded-2xl p-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                Book Analytics Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Track, analyze, and visualize your reading journey
              </p>
            </div>
            <div className="w-full md:w-96">
              <BookSearchBar onBookSelect={handleBookSelect} />
            </div>
          </div>
          {lastUpdated && (
            <p className="mt-3 text-xs text-slate-400">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 rounded-3xl" />
          <div className="relative">
            <Dashboard books={books} onDeleteBook={handleDeleteBook} />
          </div>
        </div>
      </div>
    </div>
  );
} 