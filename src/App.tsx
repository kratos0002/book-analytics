import React, { useState } from 'react';
import BookSearchBar from './components/BookSearchBar';
import BookLibrary from './components/BookLibrary';
import Dashboard from './components/Dashboard';
import { BookMetadataProvider } from './providers/BookMetadataProvider';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<'library' | 'dashboard'>('dashboard');
  
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
          
          {/* Navigation tabs */}
          <div className="mb-6 border-b border-gray-800">
            <div className="flex space-x-8">
              <button 
                className={`pb-3 px-1 ${activeTab === 'dashboard' ? 'border-b-2 border-blue-400 text-blue-400 font-medium' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
              <button 
                className={`pb-3 px-1 ${activeTab === 'library' ? 'border-b-2 border-blue-400 text-blue-400 font-medium' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('library')}
              >
                My Library
              </button>
            </div>
          </div>
          
          <main>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'library' && <BookLibrary />}
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
