import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import BookSearchBar from './components/BookSearchBar';
import { Book } from './types';
import { addToLibrary, getLibrary, removeFromLibrary } from './utils/library';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load books from localStorage on initial render
  useEffect(() => {
    const libraryBooks = getLibrary();
    setBooks(libraryBooks);
    if (libraryBooks.length > 0) {
      setLastUpdated(new Date());
    }
  }, []);

  const handleBookSelect = (book: Book) => {
    addToLibrary(book);
    setBooks(getLibrary());
    setLastUpdated(new Date());
  };

  const handleDeleteBook = (bookId: string) => {
    removeFromLibrary(bookId);
    setBooks(getLibrary());
    setLastUpdated(new Date());
  };

  return (
    <Router>
      <div className="app-container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Book Analytics Dashboard</h1>
          <p className="dashboard-subtitle">
            Track your reading habits, discover insights about your collection, and visualize your literary journey.
          </p>
          <BookSearchBar onBookSelect={handleBookSelect} />
        </header>
        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard books={books} onDeleteBook={handleDeleteBook} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
