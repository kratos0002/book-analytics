import { Book } from '../types';

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any; // Allow for additional properties that might be needed for specific visualizations
}

export interface BookStats {
  totalBooks: number;
  uniqueAuthors: number;
  averageRating: number;
  totalPages: number;
  averagePages: number;
  completedBooks: number;
  genreDiversity: number;
}

export const calculateBookStats = (books: Book[]): BookStats => {
  const totalBooks = books.length;
  const uniqueAuthors = new Set(books.flatMap(book => book.authors)).size;
  const booksWithRatings = books.filter(book => book.averageRating);
  const averageRating = booksWithRatings.length
    ? booksWithRatings.reduce((sum, book) => sum + (book.averageRating || 0), 0) / booksWithRatings.length
    : 0;
  const booksWithPages = books.filter(book => book.pageCount);
  const totalPages = booksWithPages.reduce((sum, book) => sum + (book.pageCount || 0), 0);
  const averagePages = booksWithPages.length
    ? totalPages / booksWithPages.length
    : 0;
  const completedBooks = books.filter(book => book.pageCount).length;
  const uniqueGenres = new Set(books.flatMap(book => book.categories || ['Uncategorized'])).size;
  const genreDiversity = totalBooks ? uniqueGenres / totalBooks : 0;

  return {
    totalBooks,
    uniqueAuthors,
    averageRating,
    totalPages,
    averagePages,
    completedBooks,
    genreDiversity
  };
};

export const getGenreDistribution = (books: Book[]): ChartData[] => {
  const genreMap = new Map<string, number>();

  books.forEach(book => {
    const genres = book.categories?.length ? book.categories : ['Uncategorized'];
    genres.forEach(genre => {
      genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });
  });

  return Array.from(genreMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const getAuthorStats = (books: Book[]): ChartData[] => {
  const authorMap = new Map<string, number>();

  books.forEach(book => {
    book.authors.forEach(author => {
      authorMap.set(author, (authorMap.get(author) || 0) + 1);
    });
  });

  return Array.from(authorMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const getPageCountDistribution = (books: Book[]): ChartData[] => {
  return books
    .filter(book => book.pageCount)
    .map(book => ({
      name: truncateTitle(book.title),
      value: book.pageCount || 0
    }))
    .sort((a, b) => b.value - a.value);
};

export const getRatingDistribution = (books: Book[]): ChartData[] => {
  return books
    .filter(book => book.averageRating)
    .map(book => ({
      name: truncateTitle(book.title),
      value: book.averageRating || 0
    }))
    .sort((a, b) => b.value - a.value);
};

export const getPublishingYearDistribution = (books: Book[]): ChartData[] => {
  const yearMap = new Map<string, number>();

  books.forEach(book => {
    if (book.publishedDate) {
      const year = new Date(book.publishedDate).getFullYear().toString();
      yearMap.set(year, (yearMap.get(year) || 0) + 1);
    }
  });

  return Array.from(yearMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const truncateTitle = (title: string, maxLength: number = 20): string => {
  return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
}; 