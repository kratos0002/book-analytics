import React, { useState, useEffect } from 'react';
import { useBookMetadata } from '../providers/BookMetadataProvider';
import { Book, BookAIEnrichment } from '../models/BookTypes';
import { bookMetadataService } from '../services/BookMetadataService';
import { bookEnrichmentOrchestrator } from '../services/BookEnrichmentOrchestrator';
import { aiEnrichmentService } from '../services/AIEnrichmentService';

// Component props
interface BookMetadataEnrichmentProps {
  book: Book;
  onClose?: () => void;
}

// Component
const BookMetadataEnrichment: React.FC<BookMetadataEnrichmentProps> = ({ 
  book, 
  onClose 
}) => {
  const { updateBookMetadata, refreshBooks } = useBookMetadata();
  const [enrichedData, setEnrichedData] = useState<BookAIEnrichment | undefined>(book.enrichedData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState<string>('idle');
  const [missingFields, setMissingFields] = useState<(keyof Book)[]>([]);
  const [enrichedBook, setEnrichedBook] = useState<Book | null>(null);
  
  // Check if API key is available
  const apiKeyAvailable = aiEnrichmentService.hasAPIKey();
  
  // Calculate completion percentage
  const metadataCompletionPercentage = (): number => {
    if (!book) return 0;
    
    // Define important fields that should ideally be filled
    const importantFields: (keyof Book)[] = [
      'themes', 'characters', 'locations', 'narrativeStructure', 
      'genres', 'subgenres', 'culturalContext', 'complexity'
    ];
    
    // Count how many important fields are filled
    let filledFields = 0;
    
    importantFields.forEach(field => {
      const value = book[field];
      if (
        (Array.isArray(value) && value.length > 0) || 
        (typeof value === 'object' && value !== null && Object.keys(value).length > 0)
      ) {
        filledFields += 1;
      }
    });
    
    return Math.round((filledFields / importantFields.length) * 100);
  };
  
  // Get missing fields on component mount
  useEffect(() => {
    if (book) {
      const missing = aiEnrichmentService.identifyMissingData(book);
      setMissingFields(missing);
    }
  }, [book]);
  
  // Start the enrichment process
  const startEnrichment = async () => {
    if (!book) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setEnrichmentStatus('enriching');
      
      // Enrich the book metadata
      const enriched = await aiEnrichmentService.enrichBookMetadata(book);
      setEnrichedBook(enriched);
      
      // Save the enriched book
      if (book.isbn) {
        // Save to shared database for other users
        bookEnrichmentOrchestrator.saveEnrichedBook(enriched);
      }
      
      // Update in user's library
      refreshBooks();
      
      setEnrichmentStatus('completed');
    } catch (error) {
      console.error('Error enriching book metadata:', error);
      setError('An error occurred while enriching book metadata. Please try again.');
      setEnrichmentStatus('error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate AI analysis
  const generateAnalysis = async () => {
    if (!book) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setEnrichmentStatus('analyzing');
      
      // Generate detailed analysis
      const analysis = await aiEnrichmentService.generateBookAnalysis(book);
      
      // Update the book with the analysis
      const updatedBook = { 
        ...book, 
        enrichedData: {
          ...(book.enrichedData || {}),
          ...analysis,
          enrichmentDate: new Date().toISOString()
        }
      };
      
      setEnrichedBook(updatedBook);
      
      // Save the updated book
      if (book.isbn) {
        // Save to shared database for other users
        bookEnrichmentOrchestrator.saveEnrichedBook(updatedBook);
      }
      
      // Update in user's library
      refreshBooks();
      
      setEnrichmentStatus('completed');
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      setError('An error occurred while generating AI analysis. Please try again.');
      setEnrichmentStatus('error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render completion percentage as a progress bar
  const renderCompletionProgress = () => {
    const percentage = metadataCompletionPercentage();
    let barClass = 'bg-red-500';
    
    if (percentage >= 80) {
      barClass = 'bg-green-500';
    } else if (percentage >= 50) {
      barClass = 'bg-yellow-500';
    }
    
    return (
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Metadata Completion</span>
          <span className="text-sm font-medium">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div className={`${barClass} h-2.5 rounded-full`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  };
  
  // Render information about missing data
  const renderMissingDataInfo = () => {
    if (missingFields.length === 0) {
      return (
        <div className="p-4 bg-green-900/30 border border-green-800 rounded-lg mb-6">
          <p className="text-green-300 font-medium">
            This book has complete metadata! There's nothing more to enrich.
          </p>
        </div>
      );
    }
    
    return (
      <div className="p-4 bg-indigo-900/30 border border-indigo-800 rounded-lg mb-6">
        <h3 className="text-indigo-300 font-medium mb-2">Missing Information</h3>
        <p className="text-gray-300 mb-3">
          The following information can be enriched with AI assistance:
        </p>
        <ul className="list-disc pl-5 text-gray-300 space-y-1">
          {missingFields.map(field => (
            <li key={field as string}>{field as string}</li>
          ))}
        </ul>
      </div>
    );
  };
  
  // Render AI enrichment details if available
  const renderEnrichmentDetails = () => {
    const enrichmentData = enrichedBook?.enrichedData || book?.enrichedData;
    
    if (!enrichmentData) return null;
    
    return (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">AI Enrichment Details</h3>
        
        {enrichmentData.enrichmentDate && (
          <p className="text-sm text-gray-400 mb-4">
            Last enriched: {new Date(enrichmentData.enrichmentDate).toLocaleString()}
          </p>
        )}
        
        {enrichmentData.aiAnalysis && (
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-2">AI Analysis</h4>
            <p className="text-gray-300 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              {enrichmentData.aiAnalysis}
            </p>
          </div>
        )}
        
        {enrichmentData.themes && enrichmentData.themes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-2">Themes</h4>
            <div className="flex flex-wrap gap-2">
              {enrichmentData.themes.map((theme, index) => (
                <span key={index} className="px-3 py-1 bg-indigo-900/50 rounded-full text-indigo-200 text-sm">
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {enrichmentData.similarBooks && enrichmentData.similarBooks.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-2">Similar Books</h4>
            <ul className="list-disc pl-5 text-gray-300 space-y-1">
              {enrichmentData.similarBooks.map((book, index) => (
                <li key={index}>{book}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {enrichmentData.targetAudience && (
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-1">Target Audience</h4>
              <p className="text-white">{enrichmentData.targetAudience}</p>
            </div>
          )}
          
          {enrichmentData.complexity && (
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-1">Complexity</h4>
              <p className="text-white">{enrichmentData.complexity}</p>
            </div>
          )}
          
          {enrichmentData.narrativeStyle && (
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-1">Narrative Style</h4>
              <p className="text-white">{enrichmentData.narrativeStyle}</p>
            </div>
          )}
          
          {enrichmentData.mood && (
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-1">Mood</h4>
              <p className="text-white">{enrichmentData.mood}</p>
            </div>
          )}
          
          {enrichmentData.pacing && (
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-1">Pacing</h4>
              <p className="text-white">{enrichmentData.pacing}</p>
            </div>
          )}
          
          {enrichmentData.culturalSignificance && (
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-1">Cultural Significance</h4>
              <p className="text-white">{enrichmentData.culturalSignificance}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!book) {
    return <div className="text-center py-8">Book not found</div>;
  }

  return (
    <div className="p-6 bg-gray-900 rounded-xl shadow-xl max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-white">AI Metadata Enrichment</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4 text-white">
          {book.title}
        </h3>
        <p className="text-gray-400">
          by {book.authors.map(author => author.name).join(', ')}
        </p>
      </div>
      
      {renderCompletionProgress()}
      
      {renderMissingDataInfo()}
      
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg mb-6">
          <p className="text-red-300">{error}</p>
        </div>
      )}
      
      <div className="flex flex-col space-y-4">
        <button
          onClick={startEnrichment}
          disabled={isLoading || missingFields.length === 0 || !apiKeyAvailable}
          className={`py-2 px-4 rounded-lg font-medium transition-colors ${
            isLoading || missingFields.length === 0 || !apiKeyAvailable
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isLoading && enrichmentStatus === 'enriching' ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enriching Book Metadata...
            </span>
          ) : missingFields.length === 0 ? (
            'Metadata Complete'
          ) : !apiKeyAvailable ? (
            'API Key Required'
          ) : (
            'Enrich with Perplexity AI'
          )}
        </button>
        
        <button
          onClick={generateAnalysis}
          disabled={isLoading || !apiKeyAvailable}
          className={`py-2 px-4 rounded-lg font-medium transition-colors ${
            isLoading || !apiKeyAvailable
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isLoading && enrichmentStatus === 'analyzing' ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Analysis...
            </span>
          ) : !apiKeyAvailable ? (
            'API Key Required'
          ) : (
            'Generate AI Book Analysis'
          )}
        </button>
      </div>
      
      {renderEnrichmentDetails()}
    </div>
  );
};

export default BookMetadataEnrichment; 