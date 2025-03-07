import React, { useMemo } from 'react';
import { useBookMetadata } from '../providers/BookMetadataProvider';
import ChartWidget from './widgets/ChartWidget';
import { ReadingStatus } from '../models/BookTypes';

const Dashboard: React.FC = () => {
  const { books, loading, error } = useBookMetadata();
  
  // Calculate statistics
  const stats = useMemo(() => {
    const totalBooks = books.length;
    
    // Calculate total genres (unique)
    const allGenres = new Set<string>();
    books.forEach(book => {
      book.genres.forEach(genre => allGenres.add(genre));
    });
    const totalGenres = allGenres.size;
    
    // Calculate total pages read
    const totalPagesRead = books.reduce((sum, book) => {
      // Only count pages for completed books
      if (book.readingStatus === 'completed' && book.pageCount) {
        return sum + book.pageCount;
      }
      return sum;
    }, 0);
    
    return {
      totalBooks,
      totalGenres,
      totalPagesRead
    };
  }, [books]);
  
  // Generate genre distribution data for charts
  const genreDistributionData = useMemo(() => {
    const genreCounts: Record<string, number> = {};
    
    books.forEach(book => {
      book.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    
    // Convert to array format for charts
    return Object.entries(genreCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 genres
  }, [books]);
  
  // Reading status distribution data
  const readingStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      'to-read': 0,
      'reading': 0,
      'completed': 0,
      'abandoned': 0,
      'reference': 0
    };
    
    books.forEach(book => {
      if (book.readingStatus in statusCounts) {
        statusCounts[book.readingStatus]++;
      }
    });
    
    return Object.entries(statusCounts)
      .map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '), 
        value 
      }));
  }, [books]);
  
  // Books read per month data
  const booksPerMonthData = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    const now = new Date();
    const lastYear = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    
    // Initialize all months with 0
    for (let i = 0; i < 12; i++) {
      const month = new Date(lastYear.getFullYear(), lastYear.getMonth() + i, 1);
      const monthLabel = month.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyData[monthLabel] = 0;
    }
    
    // Add data for completed books
    books.forEach(book => {
      if (book.readingStatus === 'completed' && book.finishDate) {
        // Using finishDate for completed books
        const completedDate = new Date(book.finishDate);
        if (completedDate >= lastYear && completedDate <= now) {
          const monthLabel = completedDate.toLocaleString('default', { month: 'short', year: '2-digit' });
          monthlyData[monthLabel] = (monthlyData[monthLabel] || 0) + 1;
        }
      }
    });
    
    // Convert to array format for charts
    return Object.entries(monthlyData)
      .map(([name, value]) => ({ name, value }));
  }, [books]);
  
  if (loading) {
    return <div className="text-center py-10">Loading your library data...</div>;
  }
  
  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }
  
  return (
    <div className="dashboard">
      {/* Summary Statistics */}
      <div className="stats-summary flex justify-between mb-8 gap-4">
        <div className="stat-card flex-1 bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold">My Library</h3>
          <p className="text-3xl font-bold">{stats.totalBooks}</p>
          <p className="text-gray-400">books in collection</p>
        </div>
        
        <div className="stat-card flex-1 bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold">Genres Explored</h3>
          <p className="text-3xl font-bold">{stats.totalGenres}</p>
          <p className="text-gray-400">unique genres</p>
        </div>
        
        <div className="stat-card flex-1 bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold">Pages Read</h3>
          <p className="text-3xl font-bold">{stats.totalPagesRead.toLocaleString()}</p>
          <p className="text-gray-400">total pages completed</p>
        </div>
      </div>
      
      {/* Dashboards */}
      <div className="dashboards grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dashboard 1: Genre Distribution */}
        <div className="dashboard-card bg-gray-800 p-4 rounded-lg shadow-lg">
          <ChartWidget 
            title="Genre Distribution" 
            type="pie"
            data={genreDistributionData}
            dataKey="value"
            nameKey="name"
            description="Top genres in your library"
          />
        </div>
        
        {/* Dashboard 2: Reading Status */}
        <div className="dashboard-card bg-gray-800 p-4 rounded-lg shadow-lg">
          <ChartWidget 
            title="Reading Status" 
            type="bar"
            data={readingStatusData}
            dataKey="value"
            nameKey="name"
            description="Distribution of books by reading status"
          />
        </div>
        
        {/* Dashboard 3: Reading Activity */}
        <div className="dashboard-card bg-gray-800 p-4 rounded-lg shadow-lg">
          <ChartWidget 
            title="Reading Activity" 
            type="line"
            data={booksPerMonthData}
            dataKey="value"
            nameKey="name"
            description="Books completed per month"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 