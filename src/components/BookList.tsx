import React, { useState, useEffect } from 'react';
import { useBookMetadata } from '../providers/BookMetadataProvider';
import { Book } from '../models/BookTypes';
import BookMetadataEnrichment from './BookMetadataEnrichment';
import { Link } from 'react-router-dom';

const BookList: React.FC = () => {
  const { books, deleteBook, updateBookSection } = useBookMetadata();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<keyof Book>('dateAdded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  
  // Get unique genres from all books
  const allGenres = React.useMemo(() => {
    const genres = new Set<string>();
    books.forEach(book => {
      if (book.genres && book.genres.length > 0) {
        book.genres.forEach(genre => genres.add(genre));
      }
    });
    return Array.from(genres).sort();
  }, [books]);
  
  // Filter and sort books
  const filteredBooks = React.useMemo(() => {
    return books
      .filter(book => {
        // Search filter
        const searchMatch = searchTerm === '' || 
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.authors.some(author => author.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (book.description && book.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Genre filter
        const genreMatch = selectedGenre === '' || 
          (book.genres && book.genres.includes(selectedGenre));
        
        // Status filter
        const statusMatch = selectedStatus === '' || 
          book.readingStatus === selectedStatus;
        
        return searchMatch && genreMatch && statusMatch;
      })
      .sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
        }
        
        // Default sort by date added
        return sortDirection === 'asc'
          ? new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
          : new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      });
  }, [books, searchTerm, selectedGenre, selectedStatus, sortBy, sortDirection]);
  
  // Handle status update
  const handleUpdateStatus = (bookId: string, status: Book['readingStatus']) => {
    updateBookSection(bookId, 'readingStatus', status);
  };
  
  // Handle rating update
  const handleUpdateRating = (bookId: string, rating: number) => {
    updateBookSection(bookId, 'userRating', rating);
  };
  
  // Handle book deletion
  const handleDeleteBook = (bookId: string) => {
    if (window.confirm('Are you sure you want to remove this book from your library?')) {
      deleteBook(bookId);
    }
  };
  
  // Toggle sort direction or change sort field
  const handleSort = (field: keyof Book) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };
  
  // Open enrichment panel for a book
  const handleEnrichBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setShowEnrichment(true);
  };
  
  // Render star rating component
  const StarRating = ({ rating, bookId }: { rating: number, bookId: string }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleUpdateRating(bookId, star)}
            className="focus:outline-none"
          >
            <svg 
              className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-400'}`}
              fill={star <= rating ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Book Collection</h1>
        <div className="text-sm text-gray-400">
          {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} in your library
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, author, etc."
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Genres</option>
              {allGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="to-read">To Read</option>
              <option value="reading">Currently Reading</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
              <option value="reference">Reference</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Sort by</label>
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortBy(field as keyof Book);
                setSortDirection(direction as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="dateAdded-desc">Date Added (Newest First)</option>
              <option value="dateAdded-asc">Date Added (Oldest First)</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="publishedDate-desc">Publication Date (Newest)</option>
              <option value="publishedDate-asc">Publication Date (Oldest)</option>
              <option value="userRating-desc">Rating (Highest)</option>
              <option value="userRating-asc">Rating (Lowest)</option>
              <option value="pageCount-desc">Page Count (Highest)</option>
              <option value="pageCount-asc">Page Count (Lowest)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Book List */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center shadow-lg border border-white/20">
          <svg className="w-12 h-12 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-300">No books match your filters. Try adjusting your search criteria.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400 italic">Click on a book card to edit its details or remove it from your library</p>
            <Link to="/" className="text-sm text-indigo-400 hover:text-indigo-300">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <div key={book.id} className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/20 transition-transform hover:scale-105">
                <div className="relative">
                  {book.coverImage ? (
                    <img 
                      src={book.coverImage} 
                      alt={book.title} 
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Delete Button - More prominently positioned */}
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="absolute top-2 left-2 p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-700 focus:outline-none"
                    title="Remove from library"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <select
                      value={book.readingStatus}
                      onChange={(e) => handleUpdateStatus(book.id, e.target.value as Book['readingStatus'])}
                      className={`text-xs font-bold px-2 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        book.readingStatus === 'to-read' ? 'bg-blue-600/80 text-blue-100' :
                        book.readingStatus === 'reading' ? 'bg-green-600/80 text-green-100' :
                        book.readingStatus === 'completed' ? 'bg-purple-600/80 text-purple-100' :
                        book.readingStatus === 'abandoned' ? 'bg-red-600/80 text-red-100' :
                        'bg-gray-600/80 text-gray-100'
                      }`}
                    >
                      <option value="to-read">To Read</option>
                      <option value="reading">Reading</option>
                      <option value="completed">Completed</option>
                      <option value="abandoned">Abandoned</option>
                      <option value="reference">Reference</option>
                    </select>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    {book.authors.map(author => author.name).join(', ')}
                  </p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <StarRating rating={book.userRating} bookId={book.id} />
                    
                    <span className="text-xs text-gray-400">
                      {book.pageCount ? `${book.pageCount} pages` : ''}
                    </span>
                  </div>
                  
                  {book.genres && book.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {book.genres.slice(0, 3).map(genre => (
                        <span 
                          key={genre} 
                          className="text-xs bg-indigo-900/50 text-indigo-200 px-2 py-1 rounded-full"
                        >
                          {genre}
                        </span>
                      ))}
                      {book.genres.length > 3 && (
                        <span className="text-xs bg-indigo-900/30 text-indigo-300 px-2 py-1 rounded-full">
                          +{book.genres.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <button
                      onClick={() => handleEnrichBook(book.id)}
                      className="w-full py-2 text-sm bg-indigo-600/60 text-white hover:bg-indigo-600/80 rounded-md transition-colors"
                    >
                      Enrich Metadata
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Enrichment Modal */}
      {showEnrichment && selectedBookId && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '1rem'
          }}
        >
          <div className="bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">Enrich Book Metadata</h2>
              <button 
                onClick={() => setShowEnrichment(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <BookMetadataEnrichment
                book={books.find(b => b.id === selectedBookId)!}
                onEnrichmentComplete={() => {
                  setSelectedBookId(null);
                  setShowEnrichment(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookList; 