/* SportBeaconAI - CSV Import Dialog
   Dialog for importing CSV files with sport-specific mapping
*/

import React, { useState, useRef } from 'react';
import { Sport } from '../domain/types';

// ============================================================================
// INTERFACES
// ============================================================================

interface CsvImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (importData: CsvImportData) => Promise<void>;
  athleteName: string;
  defaultSport?: Sport;
}

interface CsvImportData {
  sport: Sport;
  csvData: CsvRow[];
  mapping: ColumnMapping;
  validationResults: ValidationResult[];
  metadata: {
    fileName: string;
    rowCount: number;
    importedAt: Date;
    importedBy: string;
  };
}

interface CsvRow {
  [key: string]: string | number;
}

interface ColumnMapping {
  [csvColumn: string]: string; // maps CSV column to stat field
}

interface ValidationResult {
  row: number;
  isValid: boolean;
  errors: string[];
  data: CsvRow;
}

// ============================================================================
// SPORT-SPECIFIC FIELD MAPPINGS
// ============================================================================

const SPORT_FIELD_MAPPINGS = {
  basketball: {
    'Player Name': 'playerName',
    'Points': 'points',
    'Rebounds': 'rebounds',
    'Assists': 'assists',
    'Steals': 'steals',
    'Blocks': 'blocks',
    'Turnovers': 'turnovers',
    'Field Goals Made': 'fieldGoalsMade',
    'Field Goals Attempted': 'fieldGoalsAttempted',
    '3-Pointers Made': 'threePointersMade',
    '3-Pointers Attempted': 'threePointersAttempted',
    'Free Throws Made': 'freeThrowsMade',
    'Free Throws Attempted': 'freeThrowsAttempted',
    'Minutes Played': 'minutesPlayed',
    'Date': 'gameDate',
    'Opponent': 'opponent'
  },
  football: {
    'Player Name': 'playerName',
    'Passing Yards': 'passingYards',
    'Passing Attempts': 'passingAttempts',
    'Passing Completions': 'passingCompletions',
    'Passing Touchdowns': 'passingTouchdowns',
    'Interceptions': 'interceptions',
    'Rushing Yards': 'rushingYards',
    'Rushing Attempts': 'rushingAttempts',
    'Rushing Touchdowns': 'rushingTouchdowns',
    'Receiving Yards': 'receivingYards',
    'Receiving Receptions': 'receivingReceptions',
    'Receiving Touchdowns': 'receivingTouchdowns',
    'Tackles': 'tackles',
    'Sacks': 'sacks',
    'Date': 'gameDate',
    'Opponent': 'opponent'
  }
} as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CsvImportDialog: React.FC<CsvImportDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  athleteName,
  defaultSport = 'basketball'
}) => {
  const [sport, setSport] = useState<Sport>(defaultSport);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'map' | 'validate' | 'import'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // FILE PROCESSING
  // ============================================================================

  const parseCsvFile = (file: File): Promise<CsvRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }

          // Parse headers
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          // Parse data rows
          const data: CsvRow[] = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row: CsvRow = {};
            
            headers.forEach((header, index) => {
              const value = values[index] || '';
              // Try to parse as number, fallback to string
              row[header] = isNaN(Number(value)) ? value : Number(value);
            });
            
            data.push(row);
          }
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const autoMapColumns = (headers: string[], selectedSport: Sport): ColumnMapping => {
    const fieldMappings = SPORT_FIELD_MAPPINGS[selectedSport];
    const mapping: ColumnMapping = {};
    
    headers.forEach(header => {
      // Try exact match first
      if (fieldMappings[header]) {
        mapping[header] = fieldMappings[header];
        return;
      }
      
      // Try case-insensitive match
      const lowerHeader = header.toLowerCase();
      for (const [fieldName, fieldKey] of Object.entries(fieldMappings)) {
        if (fieldName.toLowerCase() === lowerHeader) {
          mapping[header] = fieldKey;
          break;
        }
      }
    });
    
    return mapping;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Please select a CSV file']);
      return;
    }

    setIsProcessing(true);
    setErrors([]);

    try {
      const data = await parseCsvFile(file);
      const headers = Object.keys(data[0] || {});
      
      setCsvFile(file);
      setCsvData(data);
      setCsvHeaders(headers);
      
      // Auto-map columns if possible
      const autoMapping = autoMapColumns(headers, sport);
      setMapping(autoMapping);
      
      setCurrentStep('map');
    } catch (error) {
      setErrors([`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsProcessing(false);
    }
  };


  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateData = (): ValidationResult[] => {
    const results: ValidationResult[] = [];
    
    csvData.forEach((row, index) => {
      const errors: string[] = [];
      
      // Check required fields
      const requiredFields = getRequiredFields(sport);
      requiredFields.forEach(field => {
        const mappedColumn = Object.keys(mapping).find(col => mapping[col] === field);
        if (mappedColumn && (!row[mappedColumn] || row[mappedColumn] === '')) {
          errors.push(`Missing required field: ${field}`);
        }
      });
      
      // Validate numeric fields
      const numericFields = getNumericFields(sport);
      numericFields.forEach(field => {
        const mappedColumn = Object.keys(mapping).find(col => mapping[col] === field);
        if (mappedColumn && row[mappedColumn] !== undefined && row[mappedColumn] !== '') {
          const value = Number(row[mappedColumn]);
          if (isNaN(value) || value < 0) {
            errors.push(`Invalid numeric value for ${field}: ${row[mappedColumn]}`);
          }
        }
      });
      
      // Validate date fields
      const dateFields = ['gameDate'];
      dateFields.forEach(field => {
        const mappedColumn = Object.keys(mapping).find(col => mapping[col] === field);
        if (mappedColumn && row[mappedColumn]) {
          const date = new Date(row[mappedColumn] as string);
          if (isNaN(date.getTime())) {
            errors.push(`Invalid date format for ${field}: ${row[mappedColumn]}`);
          }
        }
      });
      
      results.push({
        row: index + 1,
        isValid: errors.length === 0,
        errors,
        data: row
      });
    });
    
    return results;
  };

  const getRequiredFields = (selectedSport: Sport): string[] => {
    const baseFields = ['gameDate', 'opponent'];
    const sportFields = {
      basketball: ['points'],
      football: ['passingYards', 'rushingYards', 'receivingYards']
    };
    
    return [...baseFields, ...(sportFields[selectedSport] || [])];
  };

  const getNumericFields = (selectedSport: Sport): string[] => {
    const sportFields = {
      basketball: ['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'fieldGoalsMade', 'fieldGoalsAttempted', 'threePointersMade', 'threePointersAttempted', 'freeThrowsMade', 'freeThrowsAttempted', 'minutesPlayed'],
      football: ['passingYards', 'passingAttempts', 'passingCompletions', 'passingTouchdowns', 'interceptions', 'rushingYards', 'rushingAttempts', 'rushingTouchdowns', 'receivingYards', 'receivingReceptions', 'receivingTouchdowns', 'tackles', 'sacks']
    };
    
    return sportFields[selectedSport] || [];
  };

  const handleValidate = () => {
    const results = validateData();
    setValidationResults(results);
    setCurrentStep('validate');
  };

  const handleImport = async () => {
    if (!csvFile) return;
    
    setIsProcessing(true);
    try {
      const importData: CsvImportData = {
        sport,
        csvData,
        mapping,
        validationResults,
        metadata: {
          fileName: csvFile.name,
          rowCount: csvData.length,
          importedAt: new Date(),
          importedBy: 'current-user' // TODO: Get from auth context
        }
      };
      
      await onSubmit(importData);
      handleClose();
    } catch (error) {
      setErrors([`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSportChange = (newSport: Sport) => {
    setSport(newSport);
    
    // Re-auto-map columns for new sport
    if (csvHeaders.length > 0) {
      const newMapping = autoMapColumns(csvHeaders, newSport);
      setMapping(newMapping);
    }
  };

  const handleMappingChange = (csvColumn: string, statField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvColumn]: statField
    }));
  };

  const handleClose = () => {
    setCsvFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setMapping({});
    setValidationResults([]);
    setCurrentStep('upload');
    setErrors([]);
    setIsProcessing(false);
    onClose();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  const validRows = validationResults.filter(r => r.isValid).length;
  const invalidRows = validationResults.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Import CSV Data for {athleteName}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center">
              {[
                { key: 'upload', label: 'Upload' },
                { key: 'map', label: 'Map Columns' },
                { key: 'validate', label: 'Validate' },
                { key: 'import', label: 'Import' }
              ].map((step, index) => (
                <React.Fragment key={step.key}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep === step.key
                      ? 'bg-blue-600 text-white'
                      : ['upload', 'map', 'validate', 'import'].indexOf(currentStep) > index
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${
                    currentStep === step.key ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {index < 3 && <div className="flex-1 h-0.5 bg-gray-200 mx-4" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport
                </label>
                <select
                  value={sport}
                  onChange={(e) => handleSportChange(e.target.value as Sport)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="basketball">Basketball</option>
                  <option value="football">Football</option>
                  <option value="soccer">Soccer</option>
                  <option value="baseball">Baseball</option>
                  <option value="softball">Softball</option>
                  <option value="volleyball">Volleyball</option>
                  <option value="track">Track</option>
                  <option value="swimming">Swimming</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Select a CSV file containing {sport} statistics
                </p>
              </div>

              {isProcessing && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Processing CSV file...</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'map' && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Map CSV Columns to Stat Fields</h4>
              <p className="text-sm text-gray-600">
                Map each CSV column to the corresponding stat field for {sport}.
              </p>

              <div className="space-y-3">
                {csvHeaders.map(header => (
                  <div key={header} className="flex items-center space-x-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-medium text-gray-700">
                        CSV Column: {header}
                      </label>
                    </div>
                    <div className="w-1/3">
                      <select
                        value={mapping[header] || ''}
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select Field --</option>
                        {Object.entries(SPORT_FIELD_MAPPINGS[sport]).map(([fieldName, fieldKey]) => (
                          <option key={fieldKey} value={fieldKey}>
                            {fieldName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <span className="text-sm text-gray-500">
                        {mapping[header] ? '✓ Mapped' : 'Not mapped'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleValidate}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Validate Data
                </button>
              </div>
            </div>
          )}

          {currentStep === 'validate' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900">Validation Results</h4>
                <div className="flex space-x-4">
                  <span className="text-sm text-green-600">✓ {validRows} valid rows</span>
                  <span className="text-sm text-red-600">✗ {invalidRows} invalid rows</span>
                </div>
              </div>

              {validationResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {validationResults.map((result, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{result.row}</td>
                          <td className="px-3 py-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              result.isValid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.isValid ? 'Valid' : 'Invalid'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {result.errors.length > 0 ? (
                              <ul className="list-disc list-inside">
                                {result.errors.map((error, errorIndex) => (
                                  <li key={errorIndex}>{error}</li>
                                ))}
                              </ul>
                            ) : (
                              'No errors'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep('map')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back to Mapping
                </button>
                <button
                  onClick={handleImport}
                  disabled={invalidRows > 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import Data ({validRows} rows)
                </button>
              </div>
            </div>
          )}

          {currentStep === 'import' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Importing Data...</h4>
              <p className="text-sm text-gray-600">
                Please wait while we import your {sport} statistics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
