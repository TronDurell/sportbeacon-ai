import React from 'react';
import { Clock, Users } from 'lucide-react';
import { useAgentOrchestration } from '../../contexts/AgentOrchestrationContext';

interface Drill {
  id: string;
  name: string;
  category: 'passing' | 'shooting' | 'defense' | 'fitness' | 'tactics';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  participants: number;
  description: string;
  completed: boolean;
}

const Drills: React.FC = () => {
  const { sendRequest } = useAgentOrchestration();

  const drills: Drill[] = [
    {
      id: '1',
      name: 'Triangle Passing',
      category: 'passing',
      duration: 15,
      difficulty: 'intermediate',
      participants: 6,
      description: 'Improve passing accuracy and team coordination',
      completed: false
    },
    {
      id: '2',
      name: 'Shooting Practice',
      category: 'shooting',
      duration: 20,
      difficulty: 'beginner',
      participants: 4,
      description: 'Focus on shooting technique and accuracy',
      completed: true
    },
    {
      id: '3',
      name: 'Defensive Positioning',
      category: 'defense',
      duration: 25,
      difficulty: 'advanced',
      participants: 8,
      description: 'Work on defensive formations and positioning',
      completed: false
    }
  ];

  const getCategoryColor = (category: Drill['category']) => {
    switch (category) {
      case 'passing': return 'bg-blue-100 text-blue-800';
      case 'shooting': return 'bg-red-100 text-red-800';
      case 'defense': return 'bg-green-100 text-green-800';
      case 'fitness': return 'bg-yellow-100 text-yellow-800';
      case 'tactics': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: Drill['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const startDrill = async (drillId: string) => {
    await sendRequest({
      type: 'start_drill',
      drillId,
      timestamp: new Date()
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Training Drills</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {drills.filter(d => d.completed).length}/{drills.length} completed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drills.map((drill) => (
          <div
            key={drill.id}
            className={`bg-white rounded-lg shadow p-6 border-2 ${
              drill.completed ? 'border-green-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(drill.category)}`}>
                {drill.category}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(drill.difficulty)}`}>
                {drill.difficulty}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{drill.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{drill.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                {drill.duration} minutes
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                {drill.participants} participants
              </div>
            </div>

            {drill.completed ? (
              <div className="text-center">
                <span className="text-green-600 font-medium">✓ Completed</span>
              </div>
            ) : (
              <button
                onClick={() => startDrill(drill.id)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Start Drill
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Drills; 