import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import BookSearchBar from './BookSearchBar';
import BookList from './BookList';
import RecentBooks from './RecentBooks';

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
  completionStatus?: 'unread' | 'reading' | 'completed';
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
  // Set default completion status for new books
  const newBook = { ...book, completionStatus: book.completionStatus || 'unread' };
  
  if (!books.some(b => b.id === newBook.id)) {
    books.push(newBook);
    localStorage.setItem('books', JSON.stringify(books));
  }
};

const removeFromLibrary = (id: string): void => {
  const books = getLibrary().filter(book => book.id !== id);
  localStorage.setItem('books', JSON.stringify(books));
};

const updateBookStatus = (id: string, status: 'unread' | 'reading' | 'completed'): void => {
  const books = getLibrary();
  const updatedBooks = books.map(book => 
    book.id === id ? { ...book, completionStatus: status } : book
  );
  localStorage.setItem('books', JSON.stringify(updatedBooks));
};

const isInLibrary = (id: string): boolean => {
  return getLibrary().some(book => book.id === id);
};

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

  const handleUpdateStatus = (bookId: string, status: 'unread' | 'reading' | 'completed') => {
    updateBookStatus(bookId, status);
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
          <RecentBooks books={books} onDeleteBook={handleDeleteBook} />
        </header>
        <main className="container">
          <BookList 
            books={books} 
            onDeleteBook={handleDeleteBook} 
            onUpdateStatus={handleUpdateStatus}
          />
          <Routes>
            <Route path="/" element={<Dashboard books={books} onDeleteBook={handleDeleteBook} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 