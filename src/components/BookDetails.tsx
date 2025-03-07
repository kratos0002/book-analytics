import React from 'react';
import { Book, ReadingStatus } from '../models/BookTypes';
import { bookEnrichmentOrchestrator } from '../services/BookEnrichmentOrchestrator';

interface BookDetailsProps {
  book: Book;
  onClose: () => void;
}

const BookDetails: React.FC<BookDetailsProps> = ({ book, onClose }) => {
  // Check if the book is currently being enriched
  const isEnriching = book.isbn ? bookEnrichmentOrchestrator.isInEnrichmentQueue(book.isbn) : false;
  
  // Determine completion level of the book metadata
  const metadataCompleteness = (): {percentage: number; status: 'low' | 'medium' | 'high'} => {
    let filledFields = 0;
    let totalFields = 0;
    
    // Check themes
    if (book.themes && book.themes.length > 0) filledFields++;
    totalFields++;
    
    // Check characters
    if (book.characters && book.characters.length > 0) filledFields++;
    totalFields++;
    
    // Check locations
    if (book.locations && book.locations.length > 0) filledFields++;
    totalFields++;
    
    // Check narrative structure
    if (book.narrativeStructure && Object.keys(book.narrativeStructure).length > 0) filledFields++;
    totalFields++;
    
    // Check genres
    if (book.genres && book.genres.length > 0) filledFields++;
    totalFields++;
    
    // Check subgenres
    if (book.subgenres && book.subgenres.length > 0) filledFields++;
    totalFields++;
    
    // Check enrichedData
    if (book.enrichedData) filledFields++;
    totalFields++;
    
    const percentage = Math.round((filledFields / totalFields) * 100);
    
    let status: 'low' | 'medium' | 'high' = 'low';
    if (percentage >= 80) status = 'high';
    else if (percentage >= 40) status = 'medium';
    
    return { percentage, status };
  };
  
  const completeness = metadataCompleteness();
  
  // Get reading status display text
  const getStatusText = (status: ReadingStatus): string => {
    switch (status) {
      case 'to-read': return 'To Read';
      case 'reading': return 'Currently Reading';
      case 'completed': return 'Completed';
      case 'abandoned': return 'Abandoned';
      case 'reference': return 'Reference';
      default: return status;
    }
  };
  
  // Get reading status color class
  const getStatusClass = (status: ReadingStatus): string => {
    switch (status) {
      case 'to-read': return 'bg-gray-700 text-gray-200';
      case 'reading': return 'bg-blue-700 text-blue-100';
      case 'completed': return 'bg-green-700 text-green-100';
      case 'abandoned': return 'bg-red-700 text-red-100';
      case 'reference': return 'bg-purple-700 text-purple-100';
      default: return 'bg-gray-700 text-gray-200';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header with cover and basic info */}
        <div className="flex flex-col md:flex-row p-6 border-b border-gray-800">
          <div className="w-full md:w-1/3 flex justify-center mb-6 md:mb-0">
            {book.coverImage ? (
              <img 
                src={book.coverImage} 
                alt={`Cover of ${book.title}`} 
                className="h-64 w-auto object-contain rounded-lg shadow-lg"
              />
            ) : (
              <div className="h-64 w-48 bg-gray-800 flex items-center justify-center rounded-lg shadow-lg">
                <svg className="w-16 h-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="w-full md:w-2/3 md:pl-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{book.title}</h1>
            {book.subtitle && <h2 className="text-xl text-gray-300 mt-1">{book.subtitle}</h2>}
            
            <div className="flex flex-wrap items-center mt-2 text-gray-300">
              <span className="text-lg">by {book.authors.map(author => author.name).join(', ')}</span>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              {book.genres?.map((genre, index) => (
                <span key={index} className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                  {genre}
                </span>
              ))}
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400 text-sm">Published:</span>
                <p>{book.publishedDate || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Publisher:</span>
                <p>{book.publisher || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Pages:</span>
                <p>{book.pageCount || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">ISBN:</span>
                <p>{book.isbn || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Language:</span>
                <p>{book.language || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Format:</span>
                <p className="capitalize">{book.format || 'Unknown'}</p>
              </div>
            </div>
            
            <div className="mt-4 flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusClass(book.readingStatus)}`}>
                {getStatusText(book.readingStatus)}
              </span>
              {book.userRating > 0 && (
                <div className="ml-3 flex items-center">
                  <span className="text-yellow-400 mr-1">★</span>
                  <span>{book.userRating.toFixed(1)}</span>
                </div>
              )}
              <div className="ml-auto">
                <span className="text-gray-400 text-sm">Added on:</span>
                <p>{new Date(book.dateAdded).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Metadata enrichment status */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Book Metadata</h3>
            <div className="flex items-center">
              {isEnriching ? (
                <div className="flex items-center text-indigo-400">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Enriching...</span>
                </div>
              ) : (
                <div className="text-sm">
                  <span className="text-gray-400">Completeness: </span>
                  <span className={`ml-1 font-medium ${
                    completeness.status === 'high' 
                      ? 'text-green-400' 
                      : completeness.status === 'medium' 
                        ? 'text-yellow-400' 
                        : 'text-red-400'
                  }`}>
                    {completeness.percentage}%
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
            <div 
              className={`h-2.5 rounded-full ${
                completeness.status === 'high' 
                  ? 'bg-green-500' 
                  : completeness.status === 'medium' 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              }`} 
              style={{width: `${completeness.percentage}%`}}
            ></div>
          </div>
          
          {isEnriching && (
            <p className="text-sm text-indigo-300 italic mb-4">
              This book is currently being enriched with AI-generated metadata. Refresh later to see updated information.
            </p>
          )}
        </div>
        
        {/* Book description */}
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-semibold mb-3">Description</h3>
          <div className="prose prose-sm prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{book.description || 'No description available.'}</p>
          </div>
        </div>
        
        {/* AI Analysis (if available) */}
        {book.enrichedData?.aiAnalysis && (
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold mb-3">AI Analysis</h3>
            <div className="prose prose-sm prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{book.enrichedData.aiAnalysis}</p>
            </div>
          </div>
        )}
        
        {/* Themes (if available) */}
        {book.themes && book.themes.length > 0 && (
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold mb-3">Themes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {book.themes.map((theme, index) => (
                <div key={index} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{theme.name}</h4>
                    <div className="flex">
                      {Array.from({length: 5}).map((_, i) => (
                        <span 
                          key={i} 
                          className={`w-4 h-4 ${i < theme.relevance ? 'text-indigo-400' : 'text-gray-600'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {theme.userNotes && <p className="text-sm text-gray-400 mt-1">{theme.userNotes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Characters (if available) */}
        {book.characters && book.characters.length > 0 && (
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold mb-3">Characters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {book.characters.map((character, index) => (
                <div key={index} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{character.name}</h4>
                    <span className="text-xs px-2 py-1 rounded bg-gray-700">
                      {character.role}
                    </span>
                  </div>
                  {character.archetype && (
                    <p className="text-sm text-gray-400 mt-1">Archetype: {character.archetype}</p>
                  )}
                  {character.demographics && (
                    <div className="mt-2 text-sm">
                      {character.demographics.gender && <span className="mr-2">Gender: {character.demographics.gender}</span>}
                      {character.demographics.age && <span className="mr-2">Age: {character.demographics.age}</span>}
                      {character.demographics.occupation && <span>Occupation: {character.demographics.occupation}</span>}
                    </div>
                  )}
                  {character.personalityTraits && character.personalityTraits.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {character.personalityTraits.map((trait, i) => (
                        <span key={i} className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Locations (if available) */}
        {book.locations && book.locations.length > 0 && (
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold mb-3">Locations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {book.locations.map((location, index) => (
                <div key={index} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{location.name}</h4>
                    <div className="flex items-center">
                      <span className="text-xs px-2 py-1 rounded bg-gray-700 mr-2">
                        {location.type}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        {location.realWorld ? 'Real' : 'Fictional'}
                      </span>
                    </div>
                  </div>
                  {location.description && <p className="text-sm mt-2">{location.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Similar Books (if available) */}
        {book.enrichedData?.similarBooks && book.enrichedData.similarBooks.length > 0 && (
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold mb-3">Similar Books</h3>
            <ul className="list-disc pl-5 text-gray-300 space-y-1">
              {book.enrichedData.similarBooks.map((similar, index) => (
                <li key={index}>{similar}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Additional Metadata */}
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {book.format && (
              <div>
                <span className="text-gray-400 text-sm">Format:</span>
                <p className="capitalize">{book.format}</p>
              </div>
            )}
            {book.fiction !== undefined && (
              <div>
                <span className="text-gray-400 text-sm">Fiction/Non-Fiction:</span>
                <p>{book.fiction ? 'Fiction' : 'Non-Fiction'}</p>
              </div>
            )}
            {book.audience && (
              <div>
                <span className="text-gray-400 text-sm">Target Audience:</span>
                <p className="capitalize">{book.audience}</p>
              </div>
            )}
            {book.enrichedData?.complexity && (
              <div>
                <span className="text-gray-400 text-sm">Complexity:</span>
                <p>{book.enrichedData.complexity}</p>
              </div>
            )}
            {book.enrichedData?.mood && (
              <div>
                <span className="text-gray-400 text-sm">Mood:</span>
                <p>{book.enrichedData.mood}</p>
              </div>
            )}
            {book.enrichedData?.narrativeStyle && (
              <div>
                <span className="text-gray-400 text-sm">Narrative Style:</span>
                <p>{book.enrichedData.narrativeStyle}</p>
              </div>
            )}
            {book.enrichedData?.pacing && (
              <div>
                <span className="text-gray-400 text-sm">Pacing:</span>
                <p>{book.enrichedData.pacing}</p>
              </div>
            )}
            {book.enrichedData?.culturalSignificance && (
              <div>
                <span className="text-gray-400 text-sm">Cultural Significance:</span>
                <p>{book.enrichedData.culturalSignificance}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails; 