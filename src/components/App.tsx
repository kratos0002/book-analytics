import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import BookSearchBar from './BookSearchBar';
import BookList from './BookList';

// Define Book interface locally
interface Book {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  categories?: string[];
  pageCount?: number;
  publishedDate?: string;
  averageRating?: number;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
}

// Simple library utility functions
const getLibrary = (): Book[] => {
  try {
    const books = localStorage.getItem('books');
    return books ? JSON.parse(books) : [];
  } catch (e) {
    console.error('Failed to parse books from localStorage', e);
    return [];
  }
};

const addToLibrary = (book: Book): void => {
  const books = getLibrary();
  if (!books.some(b => b.id === book.id)) {
    books.push(book);
    localStorage.setItem('books', JSON.stringify(books));
  }
};

const removeFromLibrary = (id: string): void => {
  const books = getLibrary().filter(book => book.id !== id);
  localStorage.setItem('books', JSON.stringify(books));
};

const isInLibrary = (id: string): boolean => {
  return getLibrary().some(book => book.id === id);
};

function App() {
  const [books, setBooks] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

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
          <BookList books={books} onDeleteBook={handleDeleteBook} />
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