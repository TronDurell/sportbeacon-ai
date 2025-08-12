import React, { useState } from 'react';

interface LeagueCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leagueData: LeagueFormData) => Promise<void>;
}

interface LeagueFormData {
  name: string;
  genderPolicy: 'open' | 'boys-only' | 'girls-only' | 'birth-sex-only' | 'admin-review';
  ageGroup: string;
  skillLevel: string;
  maxPlayers: number;
  description: string;
}

export const LeagueCreationModal: React.FC<LeagueCreationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<LeagueFormData>({
    name: '',
    genderPolicy: 'open',
    ageGroup: '',
    skillLevel: '',
    maxPlayers: 20,
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to create league:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New League</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">League Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Gender Policy</label>
              <select
                value={formData.genderPolicy}
                onChange={(e) => setFormData({ ...formData, genderPolicy: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="open">Open to All</option>
                <option value="boys-only">Boys Only</option>
                <option value="girls-only">Girls Only</option>
                <option value="birth-sex-only">Birth Sex Only</option>
                <option value="admin-review">Admin Review Required</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Age Group</label>
              <input
                type="text"
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., U12, U14, U16"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Skill Level</label>
              <select
                value={formData.skillLevel}
                onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select Skill Level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="competitive">Competitive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Max Players</label>
              <input
                type="number"
                value={formData.maxPlayers}
                onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="50"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="League description..."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create League'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 