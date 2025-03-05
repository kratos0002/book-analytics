import { Book } from '../types';
import { ChartData } from './bookAnalytics';

export interface VisualizationConfig {
  id: string;
  title: string;
  type: 'pie' | 'bar' | 'line';
  minBooks: number;
  dataKey: string;
  layout: { x: number; y: number; w: number; h: number };
  isVisible: (books: Book[]) => boolean;
  getData: (books: Book[]) => ChartData[];
  description: string;
}

const hasMultipleGenres = (books: Book[]): boolean => {
  const genres = new Set(books.flatMap(book => book.categories || ['Uncategorized']));
  return genres.size > 1;
};

const hasMultipleAuthors = (books: Book[]): boolean => {
  const authors = new Set(books.flatMap(book => book.authors));
  return authors.size > 1;
};

const hasRatings = (books: Book[]): boolean => {
  return books.some(book => book.averageRating !== undefined);
};

const hasPageCounts = (books: Book[]): boolean => {
  return books.some(book => book.pageCount !== undefined);
};

const hasPublishDates = (books: Book[]): boolean => {
  return books.some(book => book.publishedDate !== undefined);
};

const hasEnoughBooksForTimeline = (books: Book[]): boolean => {
  const yearsWithBooks = new Set(
    books
      .filter(book => book.publishedDate)
      .map(book => new Date(book.publishedDate!).getFullYear())
  );
  return yearsWithBooks.size >= 2;
};

export const visualizations: VisualizationConfig[] = [
  {
    id: 'genres',
    title: 'Books by Genre',
    type: 'pie',
    minBooks: 1,
    dataKey: 'value',
    layout: { x: 0, y: 0, w: 6, h: 4 },
    isVisible: (books) => hasMultipleGenres(books),
    getData: (books) => {
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
    },
    description: 'Distribution of books across different genres'
  },
  {
    id: 'authors',
    title: 'Books per Author',
    type: 'bar',
    minBooks: 2,
    dataKey: 'value',
    layout: { x: 6, y: 0, w: 6, h: 4 },
    isVisible: (books) => hasMultipleAuthors(books),
    getData: (books) => {
      const authorMap = new Map<string, number>();
      books.forEach(book => {
        book.authors.forEach(author => {
          authorMap.set(author, (authorMap.get(author) || 0) + 1);
        });
      });
      return Array.from(authorMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
    description: 'Number of books by each author in your collection'
  },
  {
    id: 'ratings',
    title: 'Book Ratings',
    type: 'bar',
    minBooks: 1,
    dataKey: 'value',
    layout: { x: 0, y: 4, w: 6, h: 4 },
    isVisible: (books) => hasRatings(books),
    getData: (books) => {
      return books
        .filter(book => book.averageRating)
        .map(book => ({
          name: book.title.length > 20 ? book.title.substring(0, 20) + '...' : book.title,
          value: book.averageRating || 0
        }))
        .sort((a, b) => b.value - a.value);
    },
    description: 'Average ratings of books in your collection'
  },
  {
    id: 'pages',
    title: 'Page Count Distribution',
    type: 'bar',
    minBooks: 1,
    dataKey: 'value',
    layout: { x: 6, y: 4, w: 6, h: 4 },
    isVisible: (books) => hasPageCounts(books),
    getData: (books) => {
      return books
        .filter(book => book.pageCount)
        .map(book => ({
          name: book.title.length > 20 ? book.title.substring(0, 20) + '...' : book.title,
          value: book.pageCount || 0
        }))
        .sort((a, b) => b.value - a.value);
    },
    description: 'Distribution of book lengths in your collection'
  },
  {
    id: 'timeline',
    title: 'Publication Timeline',
    type: 'line',
    minBooks: 3,
    dataKey: 'value',
    layout: { x: 0, y: 8, w: 12, h: 4 },
    isVisible: (books) => hasPublishDates(books) && hasEnoughBooksForTimeline(books),
    getData: (books) => {
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
    },
    description: 'Timeline showing when your books were published'
  }
]; 