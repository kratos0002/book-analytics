import React from 'react';
import BookCard from './BookCard';

interface Book {
  title: string;
  author: string;
  isbn: string;
  thumbnail?: string;
}

interface BookListProps {
  books: Book[];
  onDeleteBook: (isbn: string) => void;
}

export default function BookList({ books, onDeleteBook }: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No books added yet. Start by searching for a book above!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {books.map((book) => (
        <BookCard
          key={book.isbn}
          title={book.title}
          author={book.author}
          isbn={book.isbn}
          thumbnail={book.thumbnail}
          onDelete={() => onDeleteBook(book.isbn)}
        />
      ))}
    </div>
  );
} 