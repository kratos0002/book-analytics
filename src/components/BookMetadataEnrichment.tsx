import React, { useState, useEffect } from 'react';
import { useBookMetadata } from '../providers/BookMetadataProvider';
import { Book, BookAIEnrichment } from '../models/BookTypes';
import { bookMetadataService } from '../services/BookMetadataService';
import { bookEnrichmentOrchestrator } from '../services/BookEnrichmentOrchestrator';

// Component props
interface BookMetadataEnrichmentProps {
  book: Book;
  onEnrichmentComplete: () => void;
}

// Component
const BookMetadataEnrichment: React.FC<BookMetadataEnrichmentProps> = ({ 
  book, 
  onEnrichmentComplete 
}) => {
  const { updateBookMetadata } = useBookMetadata();
  const [enrichedData, setEnrichedData] = useState<BookAIEnrichment | undefined>(book.enrichedData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Load the book
  useEffect(() => {
    // If the book already has enriched data, load it
    if (book.enrichedData) {
      setEnrichedData(book.enrichedData);
      setEnrichmentStatus('success');
    }
  }, [book.enrichedData]);

  const handleEnrichBook = async (book: Book) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if enrichment already exists
      if (book.googleBooksId) {
        const existingEnrichment = await bookMetadataService.getBookEnrichment(book.googleBooksId);
        if (existingEnrichment) {
          setEnrichedData(existingEnrichment);
          await updateBookMetadata(book.id, { enrichedData: existingEnrichment });
          setEnrichmentStatus('success');
          return;
        }
      }
      
      // If no existing enrichment, get new enrichment
      const enrichmentData = await bookEnrichmentOrchestrator.enrichBookMetadata(book);
      if (enrichmentData) {
        setEnrichedData(enrichmentData);
        await updateBookMetadata(book.id, { enrichedData });
        setEnrichmentStatus('success');
      }
    } catch (err) {
      console.error('Error enriching book metadata:', err);
      setError(err instanceof Error ? err.message : 'Failed to enrich book metadata');
      setEnrichmentStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyEnrichment = async () => {
    if (!book || !enrichedData) return;

    try {
      await updateBookMetadata(book.id, { enrichedData });
      onEnrichmentComplete();
    } catch (err) {
      console.error('Error applying enrichment:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply enrichment');
    }
  };

  if (!book) {
    return <div className="text-center py-8">Book not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Book Info */}
      <div className="flex items-start gap-4">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} className="w-24 h-auto rounded shadow-md" />
        ) : (
          <div className="w-24 h-36 bg-gray-800 flex items-center justify-center rounded shadow-md">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold">{book.title}</h3>
          <p className="text-gray-300">{book.authors.map(author => author.name).join(', ')}</p>
          {book.publishedDate && (
            <p className="text-sm text-gray-400">Published: {new Date(book.publishedDate).getFullYear()}</p>
          )}
          {book.genres && book.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {book.genres.map(genre => (
                <span key={genre} className="text-xs bg-indigo-900/50 text-indigo-200 px-2 py-1 rounded-full">
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Metadata Summary */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Current Metadata</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Page Count: <span className="text-white">{book.pageCount || 'Unknown'}</span></p>
            <p className="text-gray-400">Language: <span className="text-white">{book.language || 'Unknown'}</span></p>
            <p className="text-gray-400">ISBN: <span className="text-white">{book.isbn || 'Unknown'}</span></p>
          </div>
          <div>
            <p className="text-gray-400">Rating: <span className="text-white">{book.averageRating || 'Not rated'}</span></p>
            <p className="text-gray-400">Publisher: <span className="text-white">{book.publisher || 'Unknown'}</span></p>
            <p className="text-gray-400">Description: <span className="text-white">{book.description ? 'Available' : 'Missing'}</span></p>
          </div>
        </div>
      </div>
      
      {/* Enrichment Action */}
      {enrichmentStatus === 'idle' && (
        <div className="text-center">
          <p className="mb-4 text-gray-300">
            Enhance this book with AI-generated metadata including themes, mood, pacing, 
            target audience, and more. This will use our AI service to analyze the book based on its existing information.
          </p>
          <button
            onClick={() => handleEnrichBook(book)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Enrich Metadata with AI'}
          </button>
        </div>
      )}
      
      {/* Loading State */}
      {enrichmentStatus === 'loading' && (
        <div className="text-center py-8">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-indigo-300">Analyzing book metadata and generating enrichments...</p>
          <p className="text-xs text-gray-400 mt-2">This may take a few moments</p>
        </div>
      )}
      
      {/* Error State */}
      {enrichmentStatus === 'error' && (
        <div className="bg-red-900/20 border border-red-700 text-red-200 p-4 rounded-md">
          <h4 className="font-bold mb-2">Error</h4>
          <p>{error || 'Something went wrong while enriching metadata.'}</p>
          <button
            onClick={() => handleEnrichBook(book)}
            className="mt-3 px-3 py-1 bg-red-700 text-white rounded-md hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Enrichment Results */}
      {enrichmentStatus === 'success' && enrichedData && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Enriched Metadata</h3>
          
          {/* Themes */}
          {enrichedData.themes && enrichedData.themes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-indigo-300 mb-2">Themes</h4>
              <div className="flex flex-wrap gap-2">
                {enrichedData.themes.map((theme, idx) => (
                  <span key={idx} className="px-3 py-1 bg-indigo-900/30 text-indigo-200 rounded-full text-sm">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Mood */}
          {enrichedData.mood && (
            <div>
              <h4 className="text-sm font-medium text-indigo-300 mb-1">Mood</h4>
              <p className="text-gray-200">{enrichedData.mood}</p>
            </div>
          )}
          
          {/* Narrative Style */}
          {enrichedData.narrativeStyle && (
            <div>
              <h4 className="text-sm font-medium text-indigo-300 mb-1">Narrative Style</h4>
              <p className="text-gray-200">{enrichedData.narrativeStyle}</p>
            </div>
          )}
          
          {/* Target Audience */}
          {enrichedData.targetAudience && (
            <div>
              <h4 className="text-sm font-medium text-indigo-300 mb-1">Target Audience</h4>
              <p className="text-gray-200">{enrichedData.targetAudience}</p>
            </div>
          )}
          
          {/* Pacing */}
          {enrichedData.pacing && (
            <div>
              <h4 className="text-sm font-medium text-indigo-300 mb-1">Pacing</h4>
              <p className="text-gray-200">{enrichedData.pacing}</p>
            </div>
          )}
          
          {/* Similar Books */}
          {enrichedData.similarBooks && enrichedData.similarBooks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-indigo-300 mb-2">Similar Books</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                {enrichedData.similarBooks.map((book, idx) => (
                  <li key={idx}>{book}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Cultural Significance */}
          {enrichedData.culturalSignificance && (
            <div>
              <h4 className="text-sm font-medium text-indigo-300 mb-1">Cultural Significance</h4>
              <p className="text-gray-200">{enrichedData.culturalSignificance}</p>
            </div>
          )}
          
          {/* AI Analysis */}
          {enrichedData.aiAnalysis && (
            <div>
              <h4 className="text-sm font-medium text-indigo-300 mb-1">AI Analysis</h4>
              <p className="text-gray-200">{enrichedData.aiAnalysis}</p>
            </div>
          )}
          
          <div className="pt-4 flex justify-end space-x-3">
            <button
              onClick={onEnrichmentComplete}
              className="px-3 py-1 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-800 focus:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyEnrichment}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Save Enriched Metadata
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookMetadataEnrichment; 