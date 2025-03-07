import React, { useState, useMemo } from 'react';
import { useBookMetadata } from '../providers/BookMetadataProvider';
import { Book, ReadingStatus } from '../models/BookTypes';
import BookDetails from './BookDetails';

const BookLibrary: React.FC = () => {
  const { books, deleteBook, loading, error, refreshBooks } = useBookMetadata();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReadingStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'dateAdded' | 'rating'>('dateAdded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    return books
      .filter(book => {
        // Apply search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const titleMatch = book.title.toLowerCase().includes(searchLower);
          const authorMatch = book.authors.some(author => 
            author.name.toLowerCase().includes(searchLower)
          );
          const descriptionMatch = book.description?.toLowerCase().includes(searchLower);
          
          if (!(titleMatch || authorMatch || descriptionMatch)) {
            return false;
          }
        }
        
        // Apply status filter
        if (filterStatus !== 'all' && book.readingStatus !== filterStatus) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Apply sorting
        let comparison = 0;
        
        switch (sortBy) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'author':
            const authorA = a.authors[0]?.name || '';
            const authorB = b.authors[0]?.name || '';
            comparison = authorA.localeCompare(authorB);
            break;
          case 'rating':
            comparison = (b.userRating || 0) - (a.userRating || 0);
            break;
          case 'dateAdded':
          default:
            comparison = new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [books, searchTerm, filterStatus, sortBy, sortDirection]);

  const handleRemoveBook = (bookId: string) => {
    if (confirmDelete === bookId) {
      deleteBook(bookId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(bookId);
      // Auto-reset confirm state after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleViewBookDetails = (book: Book) => {
    setSelectedBook(book);
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
  };

  const handleSortChange = (newSortBy: 'title' | 'author' | 'dateAdded' | 'rating') => {
    if (sortBy === newSortBy) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc direction
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  const getStatusDisplayText = (status: ReadingStatus): string => {
    switch (status) {
      case 'to-read':
        return 'To Read';
      case 'reading':
        return 'Reading';
      case 'completed':
        return 'Completed';
      case 'abandoned':
        return 'Abandoned';
      case 'reference':
        return 'Reference';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = (status: ReadingStatus): string => {
    switch (status) {
      case 'to-read':
        return 'bg-gray-700 text-gray-200';
      case 'reading':
        return 'bg-blue-700 text-blue-100';
      case 'completed':
        return 'bg-green-700 text-green-100';
      case 'abandoned':
        return 'bg-red-700 text-red-100';
      case 'reference':
        return 'bg-purple-700 text-purple-100';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading your library...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="book-library bg-gray-900 p-6 rounded-xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6">My Library</h2>
      
      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search books..."
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as ReadingStatus | 'all')}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              <option value="all">All Statuses</option>
              <option value="to-read">To Read</option>
              <option value="reading">Currently Reading</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
              <option value="reference">Reference</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Sort By</label>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleSortChange('dateAdded')} 
                className={`px-2 py-1 text-xs rounded ${sortBy === 'dateAdded' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Date Added {sortBy === 'dateAdded' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              
              <button 
                onClick={() => handleSortChange('title')} 
                className={`px-2 py-1 text-xs rounded ${sortBy === 'title' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Title {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              
              <button 
                onClick={() => handleSortChange('author')} 
                className={`px-2 py-1 text-xs rounded ${sortBy === 'author' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Author {sortBy === 'author' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              
              <button 
                onClick={() => handleSortChange('rating')} 
                className={`px-2 py-1 text-xs rounded ${sortBy === 'rating' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Rating {sortBy === 'rating' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-300">No books found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {books.length === 0 
              ? "You haven't added any books to your library yet." 
              : "No books match your current filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map(book => (
            <div 
              key={book.id} 
              className="book-card bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform transform hover:scale-[1.02] cursor-pointer"
              onClick={() => handleViewBookDetails(book)}
            >
              <div className="relative h-48 overflow-hidden bg-gray-700">
                {book.coverImage ? (
                  <img 
                    src={book.coverImage} 
                    alt={`Cover of ${book.title}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg 
                      className="w-12 h-12 text-gray-500" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                      />
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusClass(book.readingStatus)}`}>
                    {getStatusDisplayText(book.readingStatus)}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-white text-lg font-semibold line-clamp-2 mr-1">{book.title}</h3>
                  <div className="flex items-center bg-gray-700 px-2 py-1 rounded">
                    <svg 
                      className="w-4 h-4 text-yellow-400" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-white text-xs ml-1">
                      {book.userRating > 0 ? book.userRating : 'Not rated'}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mt-1">
                  {book.authors.map(author => author.name).join(', ')}
                </p>
                
                <div className="mt-3 flex flex-wrap gap-1">
                  {book.genres?.slice(0, 3).map((genre, index) => (
                    <span key={index} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                      {genre}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-xs text-gray-400">
                    {book.pageCount ? `${book.pageCount} pages` : 'Unknown length'}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering parent click
                      handleRemoveBook(book.id);
                    }}
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      confirmDelete === book.id 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-red-900/40 hover:text-red-300'
                    }`}
                  >
                    {confirmDelete === book.id ? 'Confirm Remove' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-400">
        Showing {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
        {filterStatus !== 'all' ? ` with status "${getStatusDisplayText(filterStatus as ReadingStatus)}"` : ''}
        {searchTerm ? ` matching "${searchTerm}"` : ''} (Total: {books.length})
      </div>
      
      {/* Book Details Modal */}
      {selectedBook && (
        <BookDetails book={selectedBook} onClose={handleCloseDetails} />
      )}
    </div>
  );
};

export default BookLibrary; 