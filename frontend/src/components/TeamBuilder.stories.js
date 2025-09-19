/* SportBeaconAI - TeamBuilder Storybook Stories
   Component stories for team building functionality
*/
import { TeamBuilder } from './TeamBuilder';
// ============================================================================
// META CONFIGURATION
// ============================================================================
const meta = {
    title: 'Components/TeamBuilder',
    component: TeamBuilder,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Interactive team builder component for creating and managing sports teams with athlete selection.'
            }
        }
    },
    tags: ['autodocs'],
    argTypes: {
        onTeamSave: { action: 'team-saved' },
        onAthleteAdd: { action: 'athlete-added' },
        onAthleteRemove: { action: 'athlete-removed' },
        onPositionChange: { action: 'position-changed' }
    }
};
export default meta;
// ============================================================================
// MOCK DATA
// ============================================================================
const mockAthletes = [
    {
        id: 'athlete_1',
        firstName: 'John',
        lastName: 'Doe',
        sports: ['basketball'],
        positions: { basketball: ['Point Guard', 'Shooting Guard'] },
        graduationYear: 2024,
        currentSchool: 'Lincoln High School'
    },
    {
        id: 'athlete_2',
        firstName: 'Jane',
        lastName: 'Smith',
        sports: ['basketball'],
        positions: { basketball: ['Center', 'Power Forward'] },
        graduationYear: 2024,
        currentSchool: 'Lincoln High School'
    },
    {
        id: 'athlete_3',
        firstName: 'Mike',
        lastName: 'Johnson',
        sports: ['basketball'],
        positions: { basketball: ['Small Forward', 'Power Forward'] },
        graduationYear: 2023,
        currentSchool: 'Lincoln High School'
    }
];
// ============================================================================
// STORIES
// ============================================================================
export const Default = {
    args: {
        sport: 'basketball',
        athletes: mockAthletes,
        selectedAthletes: [],
        teamName: '',
        season: '2024-25',
        loading: false
    }
};
export const WithSelectedAthletes = {
    args: {
        sport: 'basketball',
        athletes: mockAthletes,
        selectedAthletes: [
            { athleteId: 'athlete_1', position: 'Point Guard' },
            { athleteId: 'athlete_2', position: 'Center' }
        ],
        teamName: 'Lincoln High Varsity',
        season: '2024-25',
        loading: false
    }
};
export const Loading = {
    args: {
        sport: 'basketball',
        athletes: [],
        selectedAthletes: [],
        teamName: '',
        season: '2024-25',
        loading: true
    }
};
export const FootballTeam = {
    args: {
        sport: 'football',
        athletes: [
            {
                id: 'athlete_4',
                firstName: 'Tom',
                lastName: 'Brady',
                sports: ['football'],
                positions: { football: ['Quarterback'] },
                graduationYear: 2024,
                currentSchool: 'Lincoln High School'
            },
            {
                id: 'athlete_5',
                firstName: 'Jerry',
                lastName: 'Rice',
                sports: ['football'],
                positions: { football: ['Wide Receiver'] },
                graduationYear: 2024,
                currentSchool: 'Lincoln High School'
            }
        ],
        selectedAthletes: [
            { athleteId: 'athlete_4', position: 'Quarterback' },
            { athleteId: 'athlete_5', position: 'Wide Receiver' }
        ],
        teamName: 'Lincoln High Football',
        season: '2024-25',
        loading: false
    }
};
export const CompleteTeam = {
    args: {
        sport: 'basketball',
        athletes: mockAthletes,
        selectedAthletes: [
            { athleteId: 'athlete_1', position: 'Point Guard' },
            { athleteId: 'athlete_2', position: 'Center' },
            { athleteId: 'athlete_3', position: 'Small Forward' }
        ],
        teamName: 'Lincoln High Varsity Basketball',
        season: '2024-25',
        loading: false,
        isComplete: true
    }
};
export const WithValidationErrors = {
    args: {
        sport: 'basketball',
        athletes: mockAthletes,
        selectedAthletes: [],
        teamName: '',
        season: '2024-25',
        loading: false,
        errors: {
            teamName: 'Team name is required',
            athletes: 'At least 5 players are required'
        }
    }
};
export const ReadOnly = {
    args: {
        sport: 'basketball',
        athletes: mockAthletes,
        selectedAthletes: [
            { athleteId: 'athlete_1', position: 'Point Guard' },
            { athleteId: 'athlete_2', position: 'Center' }
        ],
        teamName: 'Lincoln High Varsity',
        season: '2024-25',
        loading: false,
        readOnly: true
    }
};
