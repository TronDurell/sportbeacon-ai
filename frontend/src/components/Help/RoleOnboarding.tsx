import React, { useState } from 'react';
import { useAuth } from '../../contexts/AdminAuthContext';
import { UserRole } from '../../types';

interface RoleOnboardingProps {
  onComplete?: () => void;
}

const RoleOnboarding: React.FC<RoleOnboardingProps> = ({ onComplete }) => {
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    role: user?.role || 'player',
    experience: '',
    goals: '',
    preferences: {}
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateUser(formData);
      onComplete?.();
    } catch (error) {
      }
  };

  const steps = [
    {
      id: 1,
      title: 'Choose Your Role',
      description: 'Select the role that best describes you in the sports community.'
    },
    {
      id: 2,
      title: 'Experience Level',
      description: 'Tell us about your experience in sports.'
    },
    {
      id: 3,
      title: 'Goals & Preferences',
      description: 'What are your goals and preferences?'
    }
  ];

  const roles: { value: UserRole; label: string; description: string }[] = [
    {
      value: 'player',
      label: 'Player',
      description: 'I am a player participating in sports activities'
    },
    {
      value: 'coach',
      label: 'Coach',
      description: 'I coach teams and help players develop'
    },
    {
      value: 'parent',
      label: 'Parent',
      description: 'I am a parent supporting my child\'s sports activities'
    },
    {
      value: 'admin',
      label: 'Administrator',
      description: 'I manage leagues, teams, or facilities'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to SportBeacon AI
        </h1>
        <p className="text-gray-600">
          Let's get you set up with the perfect experience for your role.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > step.id ? 'bg-blue-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{steps[0].title}</h2>
            <p className="text-gray-600 mb-6">{steps[0].description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => (
                <div
                  key={role.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.role === role.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                >
                  <h3 className="font-semibold text-gray-900">{role.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{steps[1].title}</h2>
            <p className="text-gray-600 mb-6">{steps[1].description}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select your experience level</option>
                  <option value="beginner">Beginner (0-2 years)</option>
                  <option value="intermediate">Intermediate (3-5 years)</option>
                  <option value="advanced">Advanced (6+ years)</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{steps[2].title}</h2>
            <p className="text-gray-600 mb-6">{steps[2].description}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are your main goals?
                </label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Improve skills, win championships, stay active, support my child..."
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="ml-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="ml-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Complete Setup
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RoleOnboarding; 