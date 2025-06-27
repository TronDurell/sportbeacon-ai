import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayerDashboard } from './PlayerDashboard';

const queryClient = new QueryClient();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('PlayerDashboard', () => {
  it('renders loading state initially', () => {
    renderWithProviders(<PlayerDashboard playerId="123" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders player profile after loading', async () => {
    renderWithProviders(<PlayerDashboard playerId="123" />);
    await waitFor(() => expect(screen.getByText(/Player Profile:/i)).toBeInTheDocument());
  });

  it('shows error state if profile not found', async () => {
    // Mock playerAPI.getProfile to throw
    // ...mock logic here...
    renderWithProviders(<PlayerDashboard playerId="notfound" />);
    // ...simulate error...
    // expect fallback UI
  });

  it('shows empty state if no drills assigned', async () => {
    // Mock playerAPI.getAssignedDrills to return []
    // ...mock logic here...
    renderWithProviders(<PlayerDashboard playerId="nodrills" />);
    // ...simulate empty drills...
    // expect fallback UI
  });

  // Add more tests for different states and interactions
}); 