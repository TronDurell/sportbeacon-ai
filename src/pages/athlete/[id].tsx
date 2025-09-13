/* SportBeaconAI - Athlete Profile Page
   Comprehensive athlete profile with tabs for Profile, Stats, Highlights, Timeline, Activity
*/

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Athlete, 
  Season, 
  Game, 
  StatLine, 
  Highlight, 
  FeedbackEvent,
  Sport 
} from '../../domain/types';
import { athleteMemoryStore } from '../../learning/memory';
import { feedbackProcessor } from '../../learning/feedback';
import { useAuth } from '../../hooks/useAuth';
import { useMemory } from '../../hooks/useMemory';

// ============================================================================
// COMPONENT IMPORTS (to be created)
// ============================================================================

// import { AthleteProfileCard } from '../../components/athlete/AthleteProfileCard';
// import { StatsTab } from '../../components/athlete/StatsTab';
// import { HighlightsTab } from '../../components/athlete/HighlightsTab';
// import { TimelineTab } from '../../components/athlete/TimelineTab';
// import { ActivityTab } from '../../components/athlete/ActivityTab';
// import { AddHighlightModal } from '../../components/AddHighlightModal';
// import { CsvImportDialog } from '../../components/CsvImportDialog';
// import { ManualStatForm } from '../../components/ManualStatForm';
// import { ProvenanceChip } from '../../components/ProvenanceChip';

// ============================================================================
// INTERFACES
// ============================================================================

interface AthletePageState {
  athlete: Athlete | null;
  seasons: Season[];
  games: Game[];
  statLines: StatLine[];
  highlights: Highlight[];
  feedbackEvents: FeedbackEvent[];
  loading: boolean;
  error: string | null;
  activeTab: 'profile' | 'stats' | 'highlights' | 'timeline' | 'activity';
  showAddHighlight: boolean;
  showCsvImport: boolean;
  showManualStat: boolean;
  selectedSeason: string | null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AthleteProfilePage() {
  const { id: athleteId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { captureEvent } = useMemory({ enabled: true, autoCapture: false });

  const [state, setState] = useState<AthletePageState>({
    athlete: null,
    seasons: [],
    games: [],
    statLines: [],
    highlights: [],
    feedbackEvents: [],
    loading: true,
    error: null,
    activeTab: 'profile',
    showAddHighlight: false,
    showCsvImport: false,
    showManualStat: false,
    selectedSeason: null
  });

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (athleteId) {
      loadAthleteData(athleteId);
    }
  }, [athleteId]);

  const loadAthleteData = async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // TODO: Implement actual data loading from Firestore
      // This is a placeholder implementation
      const mockAthlete: Athlete = {
        id: id,
        firstName: 'John',
        lastName: 'Doe',
        preferredName: 'Johnny',
        dateOfBirth: new Date('2005-06-15'),
        gender: 'male',
        sports: ['basketball', 'football'],
        primarySport: 'basketball',
        positions: {
          basketball: ['Point Guard', 'Shooting Guard'],
          football: ['Quarterback']
        },
        graduationYear: 2023,
        currentSchool: 'Lincoln High School',
        schoolType: 'high_school',
        isPublic: true,
        isClaimed: true,
        claimedBy: user?.uid || 'unknown',
        claimedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        lastModifiedBy: user?.uid || 'system',
        verificationStatus: 'verified',
        qualityScore: 0.85,
        tags: ['varsity', 'captain'],
        metadata: {}
      };

      setState(prev => ({
        ...prev,
        athlete: mockAthlete,
        loading: false
      }));

      // Capture page view event
      await captureEvent('observation', {
        page: 'athlete-profile',
        athleteId: id,
        userId: user?.uid
      }, ['athlete', 'profile-view'], 'athlete-profile-view');

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load athlete data',
        loading: false
      }));
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleTabChange = (tab: AthletePageState['activeTab']) => {
    setState(prev => ({ ...prev, activeTab: tab }));
    
    // Capture tab change event
    captureEvent('observation', {
      page: 'athlete-profile',
      tab: tab,
      athleteId: athleteId
    }, ['athlete', 'tab-change'], 'athlete-tab-change');
  };

  const handleAddHighlight = async (highlightData: any) => {
    try {
      // TODO: Implement highlight creation
      console.log('Adding highlight:', highlightData);
      
      // Capture highlight addition event
      await captureEvent('result', {
        action: 'add-highlight',
        athleteId: athleteId,
        highlightType: highlightData.type,
        source: highlightData.source
      }, ['athlete', 'highlight', 'add'], 'athlete-highlight-add');

      setState(prev => ({ ...prev, showAddHighlight: false }));
    } catch (error) {
      console.error('Failed to add highlight:', error);
    }
  };

  const handleCsvImport = async (csvData: any) => {
    try {
      // TODO: Implement CSV import
      console.log('Importing CSV:', csvData);
      
      // Capture CSV import event
      await captureEvent('result', {
        action: 'csv-import',
        athleteId: athleteId,
        rowsImported: csvData.rows?.length || 0,
        sport: csvData.sport
      }, ['athlete', 'csv-import'], 'athlete-csv-import');

      setState(prev => ({ ...prev, showCsvImport: false }));
    } catch (error) {
      console.error('Failed to import CSV:', error);
    }
  };

  const handleManualStatSubmit = async (statData: any) => {
    try {
      // TODO: Implement manual stat submission
      console.log('Submitting manual stat:', statData);
      
      // Capture manual stat submission event
      await captureEvent('result', {
        action: 'manual-stat',
        athleteId: athleteId,
        statType: statData.type,
        sport: statData.sport
      }, ['athlete', 'manual-stat'], 'athlete-manual-stat');

      setState(prev => ({ ...prev, showManualStat: false }));
    } catch (error) {
      console.error('Failed to submit manual stat:', error);
    }
  };

  const handleFeedbackSubmit = async (feedbackData: any) => {
    try {
      if (!athleteId) return;

      const feedbackEvent = await feedbackProcessor.processFeedback({
        athleteId,
        type: feedbackData.type,
        submittedBy: user?.uid || 'anonymous',
        targetType: feedbackData.targetType,
        targetId: feedbackData.targetId,
        description: feedbackData.description,
        metadata: feedbackData.metadata
      });

      // Capture feedback submission event
      await captureEvent('result', {
        action: 'feedback-submit',
        athleteId: athleteId,
        feedbackType: feedbackData.type,
        feedbackId: feedbackEvent.feedbackEvent.id
      }, ['athlete', 'feedback'], 'athlete-feedback-submit');

    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {state.error}
        </div>
      </div>
    );
  }

  if (!state.athlete) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Athlete Not Found</h1>
          <p className="text-gray-600">The athlete you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {state.athlete.preferredName || `${state.athlete.firstName} ${state.athlete.lastName}`}
            </h1>
            <p className="text-gray-600">
              {state.athlete.currentSchool} • Class of {state.athlete.graduationYear}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setState(prev => ({ ...prev, showAddHighlight: true }))}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Add Highlight
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, showCsvImport: true }))}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Import CSV
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, showManualStat: true }))}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              Add Stats
            </button>
          </div>
        </div>

        {/* Verification Status */}
        <div className="flex items-center space-x-4 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            state.athlete.verificationStatus === 'verified' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {state.athlete.verificationStatus === 'verified' ? '✓ Verified' : '⚠ Pending Verification'}
          </span>
          
          {state.athlete.qualityScore > 0 && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Quality Score: {Math.round(state.athlete.qualityScore * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'stats', label: 'Stats' },
            { id: 'highlights', label: 'Highlights' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'activity', label: 'Activity' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as AthletePageState['activeTab'])}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                state.activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {state.activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {state.athlete.firstName} {state.athlete.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Name</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {state.athlete.preferredName || 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {state.athlete.dateOfBirth?.toLocaleDateString() || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current School</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {state.athlete.currentSchool || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sports and Positions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sports and Positions</h3>
              <div className="space-y-4">
                {state.athlete.sports.map((sport) => (
                  <div key={sport}>
                    <label className="block text-sm font-medium text-gray-700 capitalize">{sport}</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {state.athlete.positions[sport]?.join(', ') || 'No positions specified'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {state.activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Season Stats</h3>
              <p className="text-gray-600">Stats will be displayed here once data is available.</p>
            </div>
          </div>
        )}

        {state.activeTab === 'highlights' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Highlights</h3>
              <p className="text-gray-600">Highlights will be displayed here once data is available.</p>
            </div>
          </div>
        )}

        {state.activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <p className="text-gray-600">Timeline will be displayed here once data is available.</p>
            </div>
          </div>
        )}

        {state.activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <p className="text-gray-600">Activity feed will be displayed here once data is available.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {state.showAddHighlight && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Highlight</h3>
              <p className="text-gray-600 mb-4">Highlight modal will be implemented here.</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setState(prev => ({ ...prev, showAddHighlight: false }))}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddHighlight({ type: 'placeholder' })}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {state.showCsvImport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import CSV</h3>
              <p className="text-gray-600 mb-4">CSV import dialog will be implemented here.</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setState(prev => ({ ...prev, showCsvImport: false }))}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCsvImport({ sport: 'basketball' })}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {state.showManualStat && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Manual Stats</h3>
              <p className="text-gray-600 mb-4">Manual stat form will be implemented here.</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setState(prev => ({ ...prev, showManualStat: false }))}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleManualStatSubmit({ type: 'basketball' })}
                  className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
