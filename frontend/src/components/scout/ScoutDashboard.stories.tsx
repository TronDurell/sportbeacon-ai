/* SportBeaconAI - ScoutDashboard Storybook Stories
   Component stories for scout dashboard functionality
*/

import type { Meta, StoryObj } from '@storybook/react';
import { ScoutDashboard } from './ScoutDashboard';

// ============================================================================
// META CONFIGURATION
// ============================================================================

const meta: Meta<typeof ScoutDashboard> = {
  title: 'Scout/ScoutDashboard',
  component: ScoutDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main dashboard for scouts to view and manage athlete profiles, stats, and highlights.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onAthleteSelect: { action: 'athlete-selected' },
    onFilterChange: { action: 'filter-changed' },
    onSearch: { action: 'search-performed' }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// STORIES
// ============================================================================

export const Default: Story = {
  args: {
    athletes: [
      {
        id: 'athlete_1',
        firstName: 'John',
        lastName: 'Doe',
        preferredName: 'Johnny',
        sports: ['basketball'],
        primarySport: 'basketball',
        graduationYear: 2024,
        currentSchool: 'Lincoln High School',
        verificationStatus: 'verified',
        qualityScore: 0.85
      },
      {
        id: 'athlete_2',
        firstName: 'Jane',
        lastName: 'Smith',
        sports: ['football'],
        primarySport: 'football',
        graduationYear: 2023,
        currentSchool: 'Washington High School',
        verificationStatus: 'pending',
        qualityScore: 0.72
      }
    ],
    loading: false,
    error: null
  }
};

export const Loading: Story = {
  args: {
    athletes: [],
    loading: true,
    error: null
  }
};

export const Error: Story = {
  args: {
    athletes: [],
    loading: false,
    error: 'Failed to load athlete data'
  }
};

export const Empty: Story = {
  args: {
    athletes: [],
    loading: false,
    error: null
  }
};

export const WithManyAthletes: Story = {
  args: {
    athletes: Array.from({ length: 20 }, (_, i) => ({
      id: `athlete_${i + 1}`,
      firstName: `Athlete${i + 1}`,
      lastName: 'Last',
      sports: ['basketball', 'football'],
      primarySport: 'basketball',
      graduationYear: 2024,
      currentSchool: `School ${i + 1}`,
      verificationStatus: i % 3 === 0 ? 'verified' : 'pending',
      qualityScore: 0.6 + Math.random() * 0.4
    })),
    loading: false,
    error: null
  }
};

export const Filtered: Story = {
  args: {
    athletes: [
      {
        id: 'athlete_1',
        firstName: 'John',
        lastName: 'Doe',
        sports: ['basketball'],
        primarySport: 'basketball',
        graduationYear: 2024,
        currentSchool: 'Lincoln High School',
        verificationStatus: 'verified',
        qualityScore: 0.85
      }
    ],
    loading: false,
    error: null,
    filters: {
      sport: 'basketball',
      graduationYear: 2024,
      verificationStatus: 'verified'
    }
  }
};

export const WithSearch: Story = {
  args: {
    athletes: [
      {
        id: 'athlete_1',
        firstName: 'John',
        lastName: 'Doe',
        sports: ['basketball'],
        primarySport: 'basketball',
        graduationYear: 2024,
        currentSchool: 'Lincoln High School',
        verificationStatus: 'verified',
        qualityScore: 0.85
      }
    ],
    loading: false,
    error: null,
    searchQuery: 'John'
  }
};
