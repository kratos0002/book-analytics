import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import ChartWidget from './widgets/ChartWidget';
import { Book } from '../types';
import {
  calculateBookStats,
  getGenreDistribution,
  getAuthorStats,
  getPageCountDistribution,
  getRatingDistribution,
  getPublishingYearDistribution
} from '../utils/bookAnalytics';
import { loadLayouts, saveLayouts } from '../utils/storage';
import { visualizations, VisualizationConfig } from '../utils/visualizations';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardProps {
  books: Book[];
  onDeleteBook: (bookId: string) => void;
}

export default function Dashboard({ books, onDeleteBook }: DashboardProps) {
  const [layouts, setLayouts] = useState<Layouts>({});
  const [activeVisualizations, setActiveVisualizations] = useState<VisualizationConfig[]>([]);

  // Update active visualizations when books change
  useEffect(() => {
    const newActiveVisualizations = visualizations.filter(viz => 
      books.length >= viz.minBooks && viz.isVisible(books)
    );
    
    setActiveVisualizations(newActiveVisualizations);
    
    // Update layouts based on active visualizations
    const newLayouts = {
      lg: newActiveVisualizations.map(viz => ({
        i: viz.id,
        ...viz.layout
      }))
    };
    
    setLayouts(prevLayouts => {
      // Preserve existing layout positions if they exist
      const existingLayout = (prevLayouts.lg || []) as Layout[];
      const mergedLayout = newLayouts.lg.map(newItem => {
        const existing = existingLayout.find((item: Layout) => item.i === newItem.i);
        return existing || newItem;
      });
      return { lg: mergedLayout };
    });
  }, [books]);

  // Load saved layouts on initial render
  useEffect(() => {
    const savedLayouts = loadLayouts();
    if (savedLayouts) {
      setLayouts(savedLayouts);
    }
  }, []);

  // Calculate statistics
  const stats = calculateBookStats(books);

  const handleLayoutChange = (_: Layout[], allLayouts: Layouts) => {
    saveLayouts(allLayouts);
    setLayouts(allLayouts);
  };

  const defaultLayouts = {
    lg: [
      { i: 'genres', x: 0, y: 0, w: 6, h: 4 },
      { i: 'authors', x: 6, y: 0, w: 6, h: 4 },
      { i: 'pages', x: 0, y: 4, w: 6, h: 4 },
      { i: 'ratings', x: 6, y: 4, w: 6, h: 4 },
      { i: 'timeline', x: 0, y: 8, w: 12, h: 4 },
    ],
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Book Analytics Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Books</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalBooks}</p>
          <p className="text-sm text-gray-500">{stats.completedBooks} with page count</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Unique Authors</h3>
          <p className="text-2xl font-bold text-indigo-600">{stats.uniqueAuthors}</p>
          <p className="text-sm text-gray-500">Genre diversity: {(stats.genreDiversity * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats.averageRating.toFixed(1)} / 5
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pages</h3>
          <p className="text-2xl font-bold text-pink-600">{stats.totalPages}</p>
          <p className="text-sm text-gray-500">Avg: {Math.round(stats.averagePages)} per book</p>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Books Yet</h3>
          <p className="text-gray-500">
            Use the search bar above to add books to your collection and see analytics here.
          </p>
        </div>
      ) : activeVisualizations.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-2">Add More Books</h3>
          <p className="text-gray-500">
            Add more books to your collection to unlock visualizations and insights.
          </p>
        </div>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts || defaultLayouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          onLayoutChange={handleLayoutChange}
          isDraggable
          isResizable
        >
          <div key="genres">
            <ChartWidget
              type="pie"
              title="Books by Genre"
              data={getGenreDistribution(books)}
              dataKey="value"
              description="Distribution of books across different genres in your library"
            />
          </div>
          <div key="authors">
            <ChartWidget
              type="bar"
              title="Books per Author"
              data={getAuthorStats(books)}
              dataKey="value"
              description="Number of books by each author in your collection"
            />
          </div>
          <div key="pages">
            <ChartWidget
              type="bar"
              title="Page Count Distribution"
              data={getPageCountDistribution(books)}
              dataKey="value"
              description="Distribution of page counts across your books"
            />
          </div>
          <div key="ratings">
            <ChartWidget
              type="bar"
              title="Book Ratings"
              data={getRatingDistribution(books)}
              dataKey="value"
              description="Average ratings distribution of books in your library"
            />
          </div>
          <div key="timeline">
            <ChartWidget
              type="line"
              title="Publication Timeline"
              data={getPublishingYearDistribution(books)}
              dataKey="value"
              description="Number of books published each year in your collection"
            />
          </div>
        </ResponsiveGridLayout>
      )}
    </div>
  );
}