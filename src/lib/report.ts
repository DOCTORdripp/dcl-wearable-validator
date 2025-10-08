// src/lib/report.ts

import type { ValidationReport } from './types';

/**
 * Download validation report as JSON
 */
export function downloadReport(report: ValidationReport): void {
  const dataStr = JSON.stringify(report, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.fileName.replace(/\.[^/.]+$/, '')}_validation_report.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate a summary text report
 */
export function generateSummaryReport(report: ValidationReport): string {
  const { overall, targetSlot, appliedTriangleBudget, results, fileName } = report;
  
  let summary = `DCL Wearable Validation Report\n`;
  summary += `================================\n\n`;
  summary += `File: ${fileName}\n`;
  summary += `Target Slot: ${targetSlot}\n`;
  summary += `Triangle Budget: ${appliedTriangleBudget.toLocaleString()}\n`;
  summary += `Overall Status: ${overall}\n\n`;
  
  // Group results by category
  const resultsByCategory = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category]!.push(result);
    return acc;
  }, {} as Record<string, typeof results>);
  
  // Add results by category
  Object.entries(resultsByCategory).forEach(([category, categoryResults]) => {
    summary += `${category}:\n`;
    categoryResults.forEach(result => {
      const icon = result.result === 'PASS' ? '✅' : 
                   result.result === 'WARN' ? '⚠️' : '❌';
      summary += `  ${icon} ${result.expected} (${result.actual})\n`;
      if (result.tip) {
        summary += `     💡 ${result.tip}\n`;
      }
    });
    summary += `\n`;
  });
  
  return summary;
}
