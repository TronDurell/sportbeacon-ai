import React, { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { useAgentOrchestration } from '../../contexts/AgentOrchestrationContext';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'fitness' | 'skill' | 'team' | 'personal';
  target: number;
  current: number;
  unit: string;
  deadline: Date;
  completed: boolean;
}

const Goals: React.FC = () => {
  const { sendRequest } = useAgentOrchestration();
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Improve Shooting Accuracy',
      description: 'Increase shooting accuracy from 60% to 80%',
      category: 'skill',
      target: 80,
      current: 65,
      unit: '%',
      deadline: new Date('2024-03-31'),
      completed: false
    },
    {
      id: '2',
      title: 'Run 5K',
      description: 'Complete a 5K run in under 25 minutes',
      category: 'fitness',
      target: 25,
      current: 28,
      unit: 'minutes',
      deadline: new Date('2024-04-15'),
      completed: false
    },
    {
      id: '3',
      title: 'Team Leadership',
      description: 'Lead 5 team practices as captain',
      category: 'team',
      target: 5,
      current: 3,
      unit: 'practices',
      deadline: new Date('2024-05-01'),
      completed: false
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'skill' as Goal['category'],
    target: 0,
    unit: '',
    deadline: ''
  });

  const addGoal = async () => {
    if (!newGoal.title || !newGoal.description) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category,
      target: newGoal.target,
      current: 0,
      unit: newGoal.unit,
      deadline: new Date(newGoal.deadline),
      completed: false
    };

    setGoals(prev => [...prev, goal]);
    setShowAddForm(false);
    setNewGoal({
      title: '',
      description: '',
      category: 'skill',
      target: 0,
      unit: '',
      deadline: ''
    });

    await sendRequest({
      type: 'add_goal',
      goal
    });
  };

  const updateProgress = async (id: string, newProgress: number) => {
    setGoals(prev => 
      prev.map(goal => 
        goal.id === id 
          ? { 
              ...goal, 
              current: Math.min(newProgress, goal.target),
              completed: newProgress >= goal.target
            }
          : goal
      )
    );

    await sendRequest({
      type: 'update_goal_progress',
      goalId: id,
      progress: newProgress
    });
  };

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
    
    await sendRequest({
      type: 'delete_goal',
      goalId: id
    });
  };

  const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'fitness': return 'bg-red-100 text-red-800';
      case 'skill': return 'bg-blue-100 text-blue-800';
      case 'team': return 'bg-green-100 text-green-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-600';
    if (progress >= 75) return 'bg-blue-600';
    if (progress >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Goals & Targets</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Goal title"
              value={newGoal.title}
              onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newGoal.category}
              onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value as Goal['category'] }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fitness">Fitness</option>
              <option value="skill">Skill</option>
              <option value="team">Team</option>
              <option value="personal">Personal</option>
            </select>
            <input
              type="number"
              placeholder="Target value"
              value={newGoal.target}
              onChange={(e) => setNewGoal(prev => ({ ...prev, target: Number(e.target.value) }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Unit (%, min, etc.)"
              value={newGoal.unit}
              onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={newGoal.deadline}
              onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description"
              value={newGoal.description}
              onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <button
              onClick={addGoal}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Goal
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = (goal.current / goal.target) * 100;
          
          return (
            <div
              key={goal.id}
              className={`bg-white rounded-lg shadow p-6 border-2 ${
                goal.completed ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(goal.category)}`}>
                  {goal.category}
                </span>
                {goal.completed && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{goal.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{goal.description}</p>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-900">
                    {goal.current}/{goal.target} {goal.unit}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>Deadline: {goal.deadline.toLocaleDateString()}</span>
                  <span>{Math.round(progress)}%</span>
                </div>

                {!goal.completed && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max={goal.target}
                      value={goal.current}
                      onChange={(e) => updateProgress(goal.id, Number(e.target.value))}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Goals; 