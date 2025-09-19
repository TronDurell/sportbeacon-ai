/* SportBeaconAI - Trainer Storybook Stories
   Component stories for trainer functionality
*/
import { Trainer } from './Trainer';
// ============================================================================
// META CONFIGURATION
// ============================================================================
const meta = {
    title: 'Components/Trainer',
    component: Trainer,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Training component for coaches to manage athlete training sessions, drills, and progress tracking.'
            }
        }
    },
    tags: ['autodocs'],
    argTypes: {
        onSessionStart: { action: 'session-started' },
        onSessionEnd: { action: 'session-ended' },
        onDrillComplete: { action: 'drill-completed' },
        onProgressUpdate: { action: 'progress-updated' }
    }
};
export default meta;
// ============================================================================
// MOCK DATA
// ============================================================================
const mockTrainingSession = {
    id: 'session_1',
    date: new Date(),
    duration: 90,
    type: 'practice',
    sport: 'basketball',
    participants: [
        { athleteId: 'athlete_1', name: 'John Doe', position: 'Point Guard' },
        { athleteId: 'athlete_2', name: 'Jane Smith', position: 'Center' }
    ],
    drills: [
        {
            id: 'drill_1',
            name: 'Free Throw Practice',
            duration: 15,
            completed: false,
            progress: 0
        },
        {
            id: 'drill_2',
            name: 'Defensive Drills',
            duration: 20,
            completed: true,
            progress: 100
        }
    ]
};
// ============================================================================
// STORIES
// ============================================================================
export const Default = {
    args: {
        session: mockTrainingSession,
        loading: false,
        error: null
    }
};
export const Loading = {
    args: {
        session: null,
        loading: true,
        error: null
    }
};
export const Error = {
    args: {
        session: null,
        loading: false,
        error: 'Failed to load training session'
    }
};
export const InProgress = {
    args: {
        session: {
            ...mockTrainingSession,
            status: 'in_progress',
            startTime: new Date(Date.now() - 30 * 60 * 1000) // Started 30 minutes ago
        },
        loading: false,
        error: null
    }
};
export const Completed = {
    args: {
        session: {
            ...mockTrainingSession,
            status: 'completed',
            startTime: new Date(Date.now() - 90 * 60 * 1000),
            endTime: new Date(),
            drills: mockTrainingSession.drills.map(drill => ({ ...drill, completed: true, progress: 100 }))
        },
        loading: false,
        error: null
    }
};
export const FootballTraining = {
    args: {
        session: {
            ...mockTrainingSession,
            sport: 'football',
            type: 'conditioning',
            participants: [
                { athleteId: 'athlete_3', name: 'Tom Brady', position: 'Quarterback' },
                { athleteId: 'athlete_4', name: 'Jerry Rice', position: 'Wide Receiver' }
            ],
            drills: [
                {
                    id: 'drill_3',
                    name: 'Passing Accuracy',
                    duration: 25,
                    completed: false,
                    progress: 0
                },
                {
                    id: 'drill_4',
                    name: 'Route Running',
                    duration: 30,
                    completed: false,
                    progress: 0
                }
            ]
        },
        loading: false,
        error: null
    }
};
export const WithNotes = {
    args: {
        session: {
            ...mockTrainingSession,
            notes: 'Great effort from all players today. John showed excellent improvement in free throw shooting.',
            observations: [
                'Player 1: Improved shooting form',
                'Player 2: Needs work on defensive positioning',
                'Team: Better communication during drills'
            ]
        },
        loading: false,
        error: null
    }
};
export const WithStatistics = {
    args: {
        session: {
            ...mockTrainingSession,
            statistics: {
                totalDrills: 5,
                completedDrills: 3,
                averageCompletionTime: 18.5,
                playerAttendance: 100,
                overallRating: 4.2
            }
        },
        loading: false,
        error: null
    }
};
export const ReadOnly = {
    args: {
        session: mockTrainingSession,
        loading: false,
        error: null,
        readOnly: true
    }
};
