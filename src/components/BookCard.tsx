import React from 'react';

interface BookCardProps {
  title: string;
  author: string;
  isbn: string;
  thumbnail?: string;
  onDelete?: () => void;
}

export default function BookCard({ title, author, isbn, thumbnail, onDelete }: BookCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex-1">
        {thumbnail ? (
          <div className="flex justify-center mb-3">
            <img 
              src={thumbnail} 
              alt={`Cover of ${title}`} 
              className="h-40 object-contain rounded"
            />
          </div>
        ) : (
          <div className="h-40 bg-gray-200 flex items-center justify-center mb-3 rounded">
            <span className="text-gray-500 text-sm">No cover available</span>
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{title}</h3>
        <p className="text-gray-600 text-sm">by {author}</p>
        <p className="text-xs text-gray-500 mt-1">ISBN: {isbn}</p>
      </div>
      {onDelete && (
        <button
          onClick={onDelete}
          className="mt-3 text-sm text-red-600 hover:text-red-800 self-start"
        >
          Remove
        </button>
      )}
    </div>
  );
} 