import { Book } from '../types';

const LIBRARY_STORAGE_KEY = 'userLibrary';

export const getLibrary = (): Book[] => {
  const stored = localStorage.getItem(LIBRARY_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addToLibrary = (book: Book): void => {
  const library = getLibrary();
  if (!library.some(b => b.id === book.id)) {
    library.push(book);
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
  }
};

export const removeFromLibrary = (bookId: string): void => {
  const library = getLibrary();
  const updatedLibrary = library.filter(book => book.id !== bookId);
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updatedLibrary));
};

export const isInLibrary = (bookId: string): boolean => {
  const library = getLibrary();
  return library.some(book => book.id === bookId);
}; 