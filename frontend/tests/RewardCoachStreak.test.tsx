import React from 'react';
import { render, screen } from '@testing-library/react';
import RewardCoachStreak from '../components/RewardCoachStreak';

describe('RewardCoachStreak', () => {
  it('shows streak and reward', () => {
    render(<RewardCoachStreak rewardProgression={{ total_reward: 10, current_streak: 3, next_milestone: { milestone: 5, days_needed: 2 }, streak_bonus: 1.2, currency: 'BEACON' }} streak={3} />);
    expect(screen.getByText(/3 day streak/i)).toBeInTheDocument();
    expect(screen.getByText(/10 BEACON/i)).toBeInTheDocument();
  });
}); 