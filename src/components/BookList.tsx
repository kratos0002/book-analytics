import React, { useState, useEffect, useMemo } from 'react';

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

// Define sort options
type SortField = 'title' | 'author' | 'rating' | 'pages' | 'date';
type SortDirection = 'asc' | 'desc';

interface BookListProps {
  books: Book[];
  onDeleteBook: (id: string) => void;
  onUpdateStatus: (id: string, status: 'unread' | 'reading' | 'completed') => void;
}

export default function BookList({ books, onDeleteBook, onUpdateStatus }: BookListProps) {
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Extract all unique genres from books
  const genres = useMemo(() => {
    const allGenres = new Set<string>();
    books.forEach(book => {
      if (book.categories && book.categories.length > 0) {
        book.categories.forEach(category => allGenres.add(category));
      }
    });
    return Array.from(allGenres).sort();
  }, [books]);

  // Logic for sorting books
  const sortBooks = (a: Book, b: Book) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'author':
        const authorA = a.authors.join(', ');
        const authorB = b.authors.join(', ');
        comparison = authorA.localeCompare(authorB);
        break;
      case 'rating':
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        comparison = ratingA - ratingB;
        break;
      case 'pages':
        const pagesA = a.pageCount || 0;
        const pagesB = b.pageCount || 0;
        comparison = pagesA - pagesB;
        break;
      case 'date':
        const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  };

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    return books
      .filter(book => {
        // Text search filter
        const matchesSearch = 
          searchTerm === '' || 
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (book.description && book.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Genre filter
        const matchesGenre = 
          genreFilter === 'all' || 
          (book.categories && book.categories.includes(genreFilter));
        
        // Status filter
        const matchesStatus = 
          statusFilter === 'all' || 
          book.completionStatus === statusFilter;
        
        return matchesSearch && matchesGenre && matchesStatus;
      })
      .sort(sortBooks);
  }, [books, searchTerm, genreFilter, statusFilter, sortField, sortDirection]);

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (books.length === 0) {
    return null;
  }

  return (
    <div className="book-list">
      <div className="book-list-header">
        <h2 className="book-list-title">Your Books</h2>
        <div className="book-list-view-toggle">
          <button 
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} 
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} 
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="book-list-filters">
        <div className="search-filter">
          <input 
            type="text" 
            placeholder="Search books..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="book-search-input"
          />
          <svg className="book-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="genre-filter">Genre:</label>
            <select 
              id="genre-filter" 
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="filter-dropdown"
            >
              <option value="all">All Genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select 
              id="status-filter" 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-dropdown"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="reading">Currently Reading</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="sort-by">Sort By:</label>
            <select 
              id="sort-by" 
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortField(field as SortField);
                setSortDirection(direction as SortDirection);
              }}
              className="filter-dropdown"
            >
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="author-asc">Author A-Z</option>
              <option value="author-desc">Author Z-A</option>
              <option value="rating-desc">Highest Rating</option>
              <option value="rating-asc">Lowest Rating</option>
              <option value="pages-desc">Most Pages</option>
              <option value="pages-asc">Fewest Pages</option>
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className={`book-list-container ${viewMode}`}>
        {filteredAndSortedBooks.length === 0 ? (
          <div className="no-books-found">
            <svg className="no-books-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p>No books match your filters</p>
          </div>
        ) : (
          filteredAndSortedBooks.map((book) => (
            <div key={book.id} className={`book-item ${viewMode}`}>
              <div className="book-item-thumbnail">
                {book.imageLinks?.thumbnail ? (
                  <img 
                    src={book.imageLinks.thumbnail} 
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
                {book.completionStatus && (
                  <div className={`book-status-badge ${book.completionStatus}`}>
                    {book.completionStatus === 'unread' && 'Unread'}
                    {book.completionStatus === 'reading' && 'Reading'}
                    {book.completionStatus === 'completed' && 'Completed'}
                  </div>
                )}
              </div>
              <div className="book-item-details">
                <h3 className="book-item-title">{book.title}</h3>
                <p className="book-item-author">by {book.authors.join(', ')}</p>
                
                {book.categories && book.categories.length > 0 && (
                  <div className="book-item-genres">
                    {book.categories.map((category, index) => (
                      <span key={index} className="book-genre-tag">
                        {category}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="book-item-meta">
                  {book.pageCount && (
                    <p className="book-item-pages">{book.pageCount} pages</p>
                  )}
                  
                  {book.publishedDate && (
                    <p className="book-item-date">{book.publishedDate.slice(0, 4)}</p>
                  )}
                </div>
                
                {book.averageRating && (
                  <div className="book-item-rating">
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`star ${star <= Math.round(book.averageRating || 0) ? 'filled' : ''}`}>★</span>
                      ))}
                    </div>
                    <span className="rating-value">{book.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="book-item-actions">
                <div className="book-status-dropdown">
                  <select 
                    value={book.completionStatus || 'unread'} 
                    onChange={(e) => {
                      onUpdateStatus(book.id, e.target.value as 'unread' | 'reading' | 'completed');
                    }}
                    className="status-select"
                  >
                    <option value="unread">Unread</option>
                    <option value="reading">Reading</option>
                    <option value="completed">Completed</option>
                  </select>
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
            </div>
          ))
        )}
      </div>
    </div>
  );
} 