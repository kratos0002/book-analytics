import React, { useState, useRef, useEffect } from 'react';

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

interface BookSearchBarProps {
  onBookSelect: (book: Book) => void;
}

export default function BookSearchBar({ onBookSelect }: BookSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchBooks = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=5`
      );
      const data = await response.json();
      
      if (data.items) {
        const books = data.items.map((item: any) => ({
          id: item.id,
          title: item.volumeInfo.title,
          authors: item.volumeInfo.authors || ['Unknown Author'],
          description: item.volumeInfo.description,
          categories: item.volumeInfo.categories,
          pageCount: item.volumeInfo.pageCount,
          publishedDate: item.volumeInfo.publishedDate,
          averageRating: item.volumeInfo.averageRating,
          imageLinks: item.volumeInfo.imageLinks,
        }));
        setResults(books);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error searching books:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: any) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(true);
    
    if (value.length > 2) {
      // Debounce search
      const timeoutId = setTimeout(() => {
        searchBooks(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  };

  const handleAddToLibrary = (book: Book) => {
    onBookSelect(book);
  };

  const isInLibrary = (id: string): boolean => {
    try {
      const books = localStorage.getItem('books');
      if (!books) return false;
      return JSON.parse(books).some((book: Book) => book.id === id);
    } catch (e) {
      console.error('Error checking if book is in library', e);
      return false;
    }
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for books..."
          className="search-input"
        />
        {loading ? (
          <div className="search-icon-container">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="search-icon-container">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((book: Book) => (
            <div key={book.id} className="search-result-item">
              {book.imageLinks?.smallThumbnail ? (
                <img src={book.imageLinks.smallThumbnail} alt={book.title} className="search-result-image" />
              ) : (
                <div className="search-result-image flex items-center justify-center bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
              <div className="search-result-details">
                <h3 className="search-result-title">{book.title}</h3>
                <p className="search-result-author">by {book.authors.join(', ')}</p>
                <button
                  onClick={() => handleAddToLibrary(book)}
                  className={`search-result-add-btn ${isInLibrary(book.id) ? 'added' : ''}`}
                >
                  {isInLibrary(book.id) ? 'Added to Library' : 'Add to Library'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 