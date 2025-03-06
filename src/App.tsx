import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import BookSearchBar from './components/BookSearchBar';
import BookList from './components/BookList';
import { BookMetadataProvider } from './providers/BookMetadataProvider';
import './index.css';

function App() {
  return (
    <BookMetadataProvider>
      <Router>
        <div className="app-container">
          <header className="app-header">
            <div className="header-content">
              <h1 className="app-title">Book Analytics</h1>
              <p className="app-subtitle">Track, analyze, and discover your reading journey</p>
              <BookSearchBar />
            </div>
          </header>
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/books" element={<BookList />} />
            </Routes>
          </main>
        </div>
      </Router>
    </BookMetadataProvider>
  );
}

export default App;
