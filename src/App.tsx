import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BookSearchBar from './components/BookSearchBar';
import BookLibrary from './components/BookLibrary';
import { BookMetadataProvider } from './providers/BookMetadataProvider';
import './index.css';

function App() {
  return (
    <BookMetadataProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Book Analytics Dashboard
            </h1>
            <p className="text-gray-400">
              Search for books, manage your library, and gain insights about your reading habits
            </p>
            <div className="mt-4">
              <BookSearchBar />
            </div>
          </header>
          
          <main>
            <Router>
              <Routes>
                <Route path="/" element={<BookLibrary />} />
              </Routes>
            </Router>
          </main>
          
          <footer className="mt-12 pt-8 border-t border-gray-800 text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Book Analytics Dashboard. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </BookMetadataProvider>
  );
}

export default App;
