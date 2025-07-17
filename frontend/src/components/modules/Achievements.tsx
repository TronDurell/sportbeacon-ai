import React from 'react';
import { Trophy, Star, Target, Award } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'performance' | 'participation' | 'leadership' | 'skill';
  unlocked: boolean;
  unlockedDate?: Date;
  progress?: number;
  maxProgress?: number;
}

const Achievements: React.FC = () => {
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Goal',
      description: 'Score your first goal in a match',
      icon: '⚽',
      category: 'performance',
      unlocked: true,
      unlockedDate: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'Perfect Attendance',
      description: 'Attend 10 consecutive practices',
      icon: '📅',
      category: 'participation',
      unlocked: false,
      progress: 7,
      maxProgress: 10
    },
    {
      id: '3',
      title: 'Team Captain',
      description: 'Be selected as team captain',
      icon: '👑',
      category: 'leadership',
      unlocked: true,
      unlockedDate: new Date('2024-01-20')
    },
    {
      id: '4',
      title: 'Skill Master',
      description: 'Complete 50 skill drills',
      icon: '🎯',
      category: 'skill',
      unlocked: false,
      progress: 32,
      maxProgress: 50
    }
  ];

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'performance': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'participation': return <Star className="w-5 h-5 text-blue-500" />;
      case 'leadership': return <Award className="w-5 h-5 text-purple-500" />;
      case 'skill': return <Target className="w-5 h-5 text-green-500" />;
      default: return <Star className="w-5 h-5 text-gray-500" />;
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{unlockedCount}/{totalCount}</p>
          <p className="text-sm text-gray-600">Achievements Unlocked</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`bg-white rounded-lg shadow p-6 border-2 ${
              achievement.unlocked ? 'border-green-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(achievement.category)}
                <span className="text-2xl">{achievement.icon}</span>
              </div>
              {achievement.unlocked && (
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Unlocked
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{achievement.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>

            {achievement.unlocked ? (
              <div className="text-sm text-green-600">
                Unlocked on {achievement.unlockedDate?.toLocaleDateString()}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-900">
                    {achievement.progress}/{achievement.maxProgress}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((achievement.progress || 0) / (achievement.maxProgress || 1)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements; 