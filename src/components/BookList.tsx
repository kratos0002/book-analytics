import React from 'react';

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

interface BookListProps {
  books: Book[];
  onDeleteBook: (id: string) => void;
}

export default function BookList({ books, onDeleteBook }: BookListProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <div className="book-list">
      <h2 className="book-list-title">Your Books</h2>
      <div className="book-list-container">
        {books.map((book) => (
          <div key={book.id} className="book-item">
            <div className="book-item-thumbnail">
              {book.imageLinks?.smallThumbnail ? (
                <img 
                  src={book.imageLinks.smallThumbnail} 
                  alt={book.title} 
                  className="book-cover" 
                />
              ) : (
                <div className="book-cover-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>
            <div className="book-item-details">
              <h3 className="book-item-title">{book.title}</h3>
              <p className="book-item-author">by {book.authors.join(', ')}</p>
              {book.pageCount && (
                <p className="book-item-pages">{book.pageCount} pages</p>
              )}
              {book.averageRating && (
                <div className="book-item-rating">
                  <span className="stars">
                    {'★'.repeat(Math.round(book.averageRating))}
                    {'☆'.repeat(5 - Math.round(book.averageRating))}
                  </span>
                  <span className="rating-value">{book.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <button
              className="book-item-delete"
              onClick={() => onDeleteBook(book.id)}
              aria-label="Delete book"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 