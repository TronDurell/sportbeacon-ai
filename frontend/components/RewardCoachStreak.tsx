import React from 'react';

interface RewardCoachStreakProps {
  rewardProgression: any;
  streak: number;
}

const RewardCoachStreak: React.FC<RewardCoachStreakProps> = ({ rewardProgression, streak }) => {
  if (!rewardProgression) return null;
  const { total_reward, current_streak, next_milestone, streak_bonus, currency } = rewardProgression;
  const canClaim = streak >= (next_milestone?.milestone || 3);

  return (
    <div className="reward-coach-streak">
      <h4>Streak Progress</h4>
      <div>
        <span>🔥 {current_streak} day streak</span><br />
        <span>Reward: <strong>{total_reward} {currency}</strong></span><br />
        <span>Streak Bonus: x{streak_bonus}</span><br />
        <span>Next Milestone: {next_milestone?.milestone} days ({next_milestone?.days_needed} to go)</span>
      </div>
      {canClaim && (
        <button style={{ marginTop: 8 }}>Claim BEACON Reward</button>
      )}
      {!canClaim && (
        <div style={{ color: '#888', marginTop: 8 }}>Keep going to unlock your next reward!</div>
      )}
    </div>
  );
};

export default RewardCoachStreak; 