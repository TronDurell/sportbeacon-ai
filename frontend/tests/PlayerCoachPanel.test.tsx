import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerCoachPanel from '../components/PlayerCoachPanel';

describe('PlayerCoachPanel', () => {
  it('renders loading state', () => {
    render(<PlayerCoachPanel playerId="1" sport="basketball" walletAddress="0x123" signature="sig" message="msg" />);
    expect(screen.getByText(/Loading coaching insights/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    // Simulate error by passing bad props or mocking fetch
    // ...
  });

  it('renders data and audio feedback', async () => {
    // Mock fetchCoachingRecommendations to return sample data
    // ...
  });
}); 