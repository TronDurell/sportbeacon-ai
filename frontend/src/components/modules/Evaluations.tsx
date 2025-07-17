import React from 'react';
import { Star } from 'lucide-react';

interface Evaluation {
  id: string;
  title: string;
  evaluator: string;
  date: Date;
  category: 'technical' | 'tactical' | 'physical' | 'mental';
  score: number;
  maxScore: number;
  comments: string;
  status: 'pending' | 'completed' | 'reviewed';
}

const Evaluations: React.FC = () => {
  const evaluations: Evaluation[] = [
    {
      id: '1',
      title: 'Technical Skills Assessment',
      evaluator: 'Coach Smith',
      date: new Date('2024-01-20'),
      category: 'technical',
      score: 8,
      maxScore: 10,
      comments: 'Excellent ball control and passing accuracy. Needs improvement in shooting technique.',
      status: 'completed'
    },
    {
      id: '2',
      title: 'Tactical Understanding',
      evaluator: 'Coach Johnson',
      date: new Date('2024-01-18'),
      category: 'tactical',
      score: 7,
      maxScore: 10,
      comments: 'Good understanding of team formations. Could improve decision-making under pressure.',
      status: 'reviewed'
    },
    {
      id: '3',
      title: 'Physical Fitness Test',
      evaluator: 'Trainer Wilson',
      date: new Date('2024-01-22'),
      category: 'physical',
      score: 9,
      maxScore: 10,
      comments: 'Outstanding endurance and speed. Maintains high performance throughout the game.',
      status: 'pending'
    }
  ];

  const getCategoryColor = (category: Evaluation['category']) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'tactical': return 'bg-green-100 text-green-800';
      case 'physical': return 'bg-red-100 text-red-800';
      case 'mental': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Evaluation['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'reviewed': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStars = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 5;
    const fullStars = Math.floor(percentage);
    const hasHalfStar = percentage % 1 >= 0.5;

    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars
                ? 'text-yellow-400 fill-current'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-current opacity-50'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Evaluations & Assessments</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Average Score: 8.0/10
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {evaluations.map((evaluation) => (
          <div
            key={evaluation.id}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{evaluation.title}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(evaluation.category)}`}>
                    {evaluation.category}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(evaluation.status)}`}>
                    {evaluation.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Evaluated by {evaluation.evaluator} on {evaluation.date.toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(evaluation.score, evaluation.maxScore)}`}>
                  {evaluation.score}/{evaluation.maxScore}
                </div>
                {renderStars(evaluation.score, evaluation.maxScore)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Comments</h4>
              <p className="text-sm text-gray-700">{evaluation.comments}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Category: {evaluation.category}
                </span>
                <span className="text-sm text-gray-600">
                  Date: {evaluation.date.toLocaleDateString()}
                </span>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Evaluations; 