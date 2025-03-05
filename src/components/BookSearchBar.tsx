import React, { useState, useRef, useEffect } from 'react';
import { Book } from '../types';
import { addToLibrary, isInLibrary } from '../utils/library';

interface BookSearchBarProps {
  onBookSelect?: (book: Book) => void;
}

export default function BookSearchBar({ onBookSelect }: BookSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchBooks = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=5`
      );
      const data = await response.json();
      
      if (data.items) {
        const books: Book[] = data.items.map((item: any) => ({
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(true);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchBooks(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleAddToLibrary = (book: Book) => {
    addToLibrary(book);
    if (onBookSelect) {
      onBookSelect(book);
    }
    setShowResults(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search for books..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        autoComplete="off"
      />

      {showResults && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
            </div>
          ) : results.length > 0 ? (
            <ul className="py-2">
              {results.map((book) => {
                const inLibrary = isInLibrary(book.id);
                return (
                  <li
                    key={book.id}
                    className="px-4 py-2 hover:bg-gray-50 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{book.title}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {book.authors.join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddToLibrary(book)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        inLibrary
                          ? 'bg-green-100 text-green-800 cursor-default'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                      disabled={inLibrary}
                    >
                      {inLibrary ? 'In Library' : 'Add to Library'}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : query ? (
            <div className="p-4 text-center text-gray-500">
              No books found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 