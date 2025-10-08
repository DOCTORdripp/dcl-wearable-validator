// src/components/ResultsPanel.tsx

import React, { useState } from 'react';
import { useStore } from '../state/useStore';
import { downloadReport } from '../lib/report';

const ResultsPanel: React.FC = () => {
  const { validationReport } = useStore();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  if (!validationReport) {
    return (
      <div className="text-center text-gray-400 py-8">
        No validation results yet. Load a model and click "Analyze" to see results.
      </div>
    );
  }

  const { overall, results, notes } = validationReport;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'PASS': return 'text-green-400';
      case 'WARN': return 'text-yellow-400';
      case 'FAIL': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'PASS': return '✅';
      case 'WARN': return '⚠️';
      case 'FAIL': return '❌';
      default: return '❓';
    }
  };

  const getOverallColor = (overall: string) => {
    switch (overall) {
      case 'PASS': return 'bg-green-900/20 border-green-700';
      case 'WARN': return 'bg-yellow-900/20 border-yellow-700';
      case 'FAIL': return 'bg-red-900/20 border-red-700';
      default: return 'bg-gray-900/20 border-gray-700';
    }
  };

  // Group results by category
  const resultsByCategory = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category]!.push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  const handleDownloadReport = () => {
    downloadReport(validationReport);
  };

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className={`border rounded-lg p-4 ${getOverallColor(overall)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getSeverityIcon(overall)}</span>
            <div>
              <h3 className="text-lg font-medium">Overall Status</h3>
              <p className={`text-sm font-medium ${getSeverityColor(overall)}`}>
                {overall}
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadReport}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
          >
            Download Report
          </button>
        </div>
      </div>

      {/* Results by Category */}
      <div className="space-y-2">
        {Object.entries(resultsByCategory).map(([category, categoryResults]) => {
          const isExpanded = expandedSections.has(category);
          const categorySeverity = categoryResults.some(r => r.result === 'FAIL') ? 'FAIL' :
                                 categoryResults.some(r => r.result === 'WARN') ? 'WARN' : 'PASS';
          
          return (
            <div key={category} className="border border-gray-700 rounded-lg">
              <button
                onClick={() => toggleSection(category)}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>{getSeverityIcon(categorySeverity)}</span>
                  <span className="font-medium text-white">
                    {category}
                  </span>
                  <span className="text-sm text-gray-400">
                    ({categoryResults.length} rules)
                  </span>
                </div>
                <span className="text-gray-400">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>
              
              {isExpanded && (
                <div className="border-t border-gray-700">
                  {categoryResults.map((result) => (
                    <div key={result.id} className="px-4 py-3 border-b border-gray-800 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm">{getSeverityIcon(result.result)}</span>
                            <span className="text-sm font-medium text-white">
                              {result.expected}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 mb-1">
                            Actual: {result.actual}
                          </div>
                          {result.tip && (
                            <div className="text-xs text-blue-400 bg-blue-900/20 p-2 rounded">
                              💡 {result.tip}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {notes && notes.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-2">
            Notes
          </h4>
          <ul className="text-sm text-gray-400 space-y-1">
            {notes.map((note, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-gray-400">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;
