export interface Book {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  categories?: string[];
  pageCount?: number;
  publishedDate?: string;
  averageRating?: number;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
}

export interface GoogleBookItem {
  volumeInfo: {
    title: string;
    authors?: string[];
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    categories?: string[];
    pageCount?: number;
    averageRating?: number;
    imageLinks?: {
      thumbnail: string;
    };
    description?: string;
    publishedDate?: string;
  };
} 