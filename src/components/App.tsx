// src/components/App.tsx

import React from 'react';
import { useStore } from '../state/useStore';
import SimpleViewer from './SimpleViewer';
import FileDrop from './FileDrop';
import ControlsPanel from './ControlsPanel';
import ResultsPanel from './ResultsPanel';

const App: React.FC = () => {
  const { 
    isDarkMode, 
    toggleDarkMode, 
    model, 
    validationReport
  } = useStore();

  return (
    <div className="min-h-screen dark flex flex-col">
      <div className="bg-gray-900 text-white relative overflow-hidden flex-1 flex flex-col">
        {/* Rainbow animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-pulse overflow-hidden" style={{ opacity: 0.05 }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 animate-pulse overflow-hidden" style={{ opacity: 0.03, animationDelay: '1s' }}></div>
        
        {/* Header */}
        <header className="relative border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-white relative">
                  <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent animate-pulse">
                    DCL Wearable Validator
                  </span>
                </h1>
              </div>
              <div className="flex items-center">
                <a
                  href="https://doctordripp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover:bg-gray-700/50 transition-colors duration-300"
                  aria-label="Visit Doctor Dripp"
                >
                  <img 
                    src="/src/logo192.png" 
                    alt="Doctor Dripp Logo" 
                    className="w-8 h-8"
                  />
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
          {!model ? (
            /* Full Width File Drop */
            <div className="w-full bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse"></div>
              <div className="p-4 border-b border-gray-700 relative">
                <h2 className="text-lg font-medium text-white">
                  <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                    3D Viewer
                  </span>
                </h2>
              </div>
              <div className="h-[70vh]">
                <FileDrop />
              </div>
            </div>
          ) : (
            /* Two Column Layout when model is loaded */
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column - Viewer */}
              <div className="w-full lg:w-1/2">
                <div className="w-full bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse"></div>
                  <div className="p-4 border-b border-gray-700 relative">
                    <h2 className="text-lg font-medium text-white">
                      <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                        3D Viewer
                      </span>
                    </h2>
                  </div>
                  <div className="h-96">
                    <SimpleViewer />
                  </div>
                </div>
              </div>

              {/* Right Column - Controls and Results */}
              <div className="space-y-6 w-full lg:w-1/2">
              {/* Controls Panel */}
              {model && (
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 animate-pulse"></div>
                  <h2 className="text-lg font-medium text-white mb-4 relative">
                    <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                      Validation Settings
                    </span>
                  </h2>
                  <div className="relative">
                    <ControlsPanel />
                  </div>
                </div>
              )}

              {/* Results Panel */}
              {model && validationReport && (
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-red-500/20 to-pink-500/20 animate-pulse"></div>
                  <h2 className="text-lg font-medium text-white mb-4 relative">
                    <span className="bg-gradient-to-r from-yellow-400 to-red-400 bg-clip-text text-transparent">
                      Validation Results
                    </span>
                  </h2>
                  <div className="relative">
                    <ResultsPanel />
                  </div>
                </div>
              )}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-700 mt-auto relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
            <div className="text-center text-sm text-gray-300">
              <p className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                DCL Wearable Validator - Validate your Decentraland wearables against technical constraints
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
