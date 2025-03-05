import { Book } from '../types';
import { Layouts } from 'react-grid-layout';

const STORAGE_KEYS = {
  BOOKS: 'bookanalytics_books',
  LAYOUTS: 'bookanalytics_layouts',
  LAST_UPDATED: 'bookanalytics_last_updated'
} as const;

export const saveBooks = (books: Book[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
  } catch (error) {
    console.error('Error saving books to localStorage:', error);
  }
};

export const loadBooks = (): Book[] => {
  try {
    const booksJson = localStorage.getItem(STORAGE_KEYS.BOOKS);
    return booksJson ? JSON.parse(booksJson) : [];
  } catch (error) {
    console.error('Error loading books from localStorage:', error);
    return [];
  }
};

export const saveLayouts = (layouts: Layouts): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(layouts));
  } catch (error) {
    console.error('Error saving layouts to localStorage:', error);
  }
};

export const loadLayouts = (): Layouts | null => {
  try {
    const layoutsJson = localStorage.getItem(STORAGE_KEYS.LAYOUTS);
    return layoutsJson ? JSON.parse(layoutsJson) : null;
  } catch (error) {
    console.error('Error loading layouts from localStorage:', error);
    return null;
  }
};

export const getLastUpdated = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
};

export const clearStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}; 