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

  // Add more tests for different states and interactions
}); 