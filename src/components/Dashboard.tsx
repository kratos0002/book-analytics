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
    <div>
      {books.length === 0 ? (
        <div className="empty-state">
          <svg 
            className="empty-state-icon" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
            />
          </svg>
          <h3 className="empty-state-title">No books in your library</h3>
          <p className="empty-state-message">Get started by adding some books to your collection.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="summary-card">
              <h3 className="summary-card-title">
                <span className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </span>
                Total Books
              </h3>
              <p className="summary-card-value">{stats.totalBooks}</p>
              <p className="summary-card-detail">{stats.completedBooks} with page count</p>
            </div>

            <div className="summary-card">
              <h3 className="summary-card-title">
                <span className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
                Unique Authors
              </h3>
              <p className="summary-card-value">{stats.uniqueAuthors}</p>
              <p className="summary-card-detail">Genre diversity: {(stats.genreDiversity * 100).toFixed(1)}%</p>
            </div>

            <div className="summary-card">
              <h3 className="summary-card-title">
                <span className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </span>
                Average Rating
              </h3>
              <p className="summary-card-value">
                {stats.averageRating.toFixed(1)}
              </p>
              <p className="summary-card-detail">out of 5.0</p>
            </div>

            <div className="summary-card">
              <h3 className="summary-card-title">
                <span className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                Total Pages
              </h3>
              <p className="summary-card-value">{stats.totalPages}</p>
              <p className="summary-card-detail">Avg: {Math.round(stats.averagePages)} per book</p>
            </div>
          </div>

          {/* Charts */}
          <div>
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 3, md: 2, sm: 2, xs: 1, xxs: 1 }}
              rowHeight={250}
              onLayoutChange={handleLayoutChange}
              isDraggable={true}
              isResizable={true}
            >
              {activeVisualizations.map((viz) => (
                <div key={viz.id} data-grid={viz.layout} className="chart-container">
                  <ChartWidget
                    type={viz.type as any}
                    title={viz.title}
                    data={viz.getData(books)}
                    dataKey={viz.dataKey}
                    description={viz.description}
                  />
                </div>
              ))}
            </ResponsiveGridLayout>
          </div>
        </>
      )}
    </div>
  );
}