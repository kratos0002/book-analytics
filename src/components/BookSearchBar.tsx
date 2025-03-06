import React, { useState } from 'react';
import { bookMetadataService } from '../services/BookMetadataService';
import { bookEnrichmentOrchestrator } from '../services/BookEnrichmentOrchestrator';
import { useBookMetadata } from '../providers/BookMetadataProvider';
import { Book } from '../models/BookTypes';

const BookSearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { books, refreshBooks } = useBookMetadata();

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setQuery(searchTerm);
    
    if (searchTerm.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const results = await bookMetadataService.searchGoogleBooks(searchTerm);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching for books');
    } finally {
      setLoading(false);
    }
  };

  const isBookInLibrary = (googleBookId: string): boolean => {
    return books.some(book => book.id === googleBookId);
  };

  const addBookToLibrary = async (googleBookId: string) => {
    try {
      setLoading(true);
      
      // Use the orchestrator to add the book with smart enrichment
      await bookEnrichmentOrchestrator.addBookToLibrary(googleBookId);
      
      // Refresh the books list
      refreshBooks();
      
      // Show success indicator
      setSearchResults(prev => prev.map(result => {
        if (result.id === googleBookId) {
          return { ...result, added: true };
        }
        return result;
      }));
    } catch (err) {
      console.error('Error adding book:', err);
      setError('Failed to add book to your library');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search for books..."
          className="search-input"
        />
        {loading ? (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-900/50 border border-red-700 text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-white/10 backdrop-blur-md shadow-lg rounded-xl border border-white/20 overflow-hidden max-h-96 overflow-y-auto">
          {searchResults.map((book) => {
            const alreadyInLibrary = isBookInLibrary(book.id);
            const volumeInfo = book.volumeInfo;
            const thumbnail = volumeInfo.imageLinks?.thumbnail;
            const title = volumeInfo.title;
            const authors = volumeInfo.authors?.join(', ') || 'Unknown Author';
            
            return (
              <div key={book.id} className="p-4 border-b border-white/10 hover:bg-white/5 transition-colors flex items-center gap-4">
                {thumbnail ? (
                  <img src={thumbnail} alt={title} className="w-12 h-16 object-cover rounded shadow-md" />
                ) : (
                  <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}
                
                <div className="flex-1">
                  <h4 className="font-medium text-white">{title}</h4>
                  <p className="text-gray-300 text-sm">{authors}</p>
                  {volumeInfo.publishedDate && (
                    <p className="text-gray-400 text-xs">{volumeInfo.publishedDate}</p>
                  )}
                </div>
                
                <button
                  onClick={() => !alreadyInLibrary && addBookToLibrary(book.id)}
                  disabled={alreadyInLibrary || book.added}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    alreadyInLibrary || book.added
                      ? 'bg-green-600/50 text-green-200 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {alreadyInLibrary || book.added ? 'Added' : 'Add to Library'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookSearchBar; 