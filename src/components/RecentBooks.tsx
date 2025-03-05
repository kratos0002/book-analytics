import React from 'react';

// Define Book interface
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

interface RecentBooksProps {
  books: Book[];
  onDeleteBook: (id: string) => void;
}

export default function RecentBooks({ books, onDeleteBook }: RecentBooksProps) {
  // Get the 5 most recent books (assuming the most recent are at the end of the array)
  const recentBooks = [...books].reverse().slice(0, 5);

  if (recentBooks.length === 0) {
    return null;
  }

  return (
    <div className="recent-books">
      <h2 className="recent-books-title">Recently Added Books</h2>
      <div className="recent-books-list">
        {recentBooks.map((book) => (
          <div key={book.id} className="recent-book-item">
            <div className="recent-book-cover">
              {book.imageLinks?.thumbnail ? (
                <img 
                  src={book.imageLinks.thumbnail} 
                  alt={book.title} 
                  className="recent-book-image" 
                />
              ) : (
                <div className="recent-book-placeholder">
                  <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>
            <div className="recent-book-details">
              <h3 className="recent-book-title">{book.title}</h3>
              <p className="recent-book-author">{book.authors.join(', ')}</p>
              <button 
                onClick={() => onDeleteBook(book.id)} 
                className="recent-book-remove"
                aria-label="Remove book"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 