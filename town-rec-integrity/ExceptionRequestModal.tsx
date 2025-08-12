import React, { useState } from 'react';

interface ExceptionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestData: ExceptionRequestData) => Promise<void>;
  userId: string;
  leagueId: string;
}

interface ExceptionRequestData {
  userId: string;
  leagueId: string;
  reason: string;
  supportingDocuments?: string[];
  urgency: 'low' | 'medium' | 'high';
  additionalInfo?: string;
}

export const ExceptionRequestModal: React.FC<ExceptionRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userId,
  leagueId,
}) => {
  const [formData, setFormData] = useState<ExceptionRequestData>({
    userId,
    leagueId,
    reason: '',
    urgency: 'medium',
    additionalInfo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit exception request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Submit Exception Request</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reason for Exception</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select a reason</option>
                <option value="age-exception">Age Exception</option>
                <option value="gender-exception">Gender Exception</option>
                <option value="skill-level-exception">Skill Level Exception</option>
                <option value="medical-exception">Medical Exception</option>
                <option value="sibling-placement">Sibling Placement</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Urgency Level</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Additional Information</label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                placeholder="Please provide additional details about your request..."
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Exception requests are reviewed by league administrators. 
                Please allow 2-3 business days for a response.
              </p>
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
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 