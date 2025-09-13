/* SportBeaconAI - Add Highlight Modal
   Modal for adding Hudl/YouTube highlights with validation
*/

import React, { useState } from 'react';
import { Sport, SourceLink, Highlight } from '../domain/types';

// ============================================================================
// INTERFACES
// ============================================================================

interface AddHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (highlightData: HighlightFormData) => Promise<void>;
  athleteId: string;
  athleteName: string;
  defaultSport?: Sport;
}

interface HighlightFormData {
  title: string;
  description: string;
  sport: Sport;
  highlightType: 'play' | 'game_highlights' | 'season_highlights' | 'training' | 'interview' | 'other';
  sourceLinks: SourceLink[];
  tags: string[];
  isPublic: boolean;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  sport?: string;
  sourceLinks?: string;
  embedCode?: string;
}

// ============================================================================
// SUPPORTED PLATFORMS
// ============================================================================

const SUPPORTED_PLATFORMS = [
  { id: 'hudl', name: 'Hudl', placeholder: 'https://www.hudl.com/video/...' },
  { id: 'youtube', name: 'YouTube', placeholder: 'https://www.youtube.com/watch?v=...' },
  { id: 'vimeo', name: 'Vimeo', placeholder: 'https://vimeo.com/...' },
  { id: 'instagram', name: 'Instagram', placeholder: 'https://www.instagram.com/p/...' },
  { id: 'twitter', name: 'Twitter', placeholder: 'https://twitter.com/.../status/...' },
  { id: 'website', name: 'Website', placeholder: 'https://example.com/video' }
] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AddHighlightModal: React.FC<AddHighlightModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  athleteId,
  athleteName,
  defaultSport = 'basketball'
}) => {
  const [formData, setFormData] = useState<HighlightFormData>({
    title: '',
    description: '',
    sport: defaultSport,
    highlightType: 'play',
    sourceLinks: [],
    tags: [],
    isPublic: true
  });

  const [embedCode, setEmbedCode] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('youtube');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    if (!formData.sport) {
      errors.sport = 'Sport is required';
    }

    if (formData.sourceLinks.length === 0) {
      errors.sourceLinks = 'At least one source link is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEmbedCode = (platform: string, code: string): boolean => {
    const patterns = {
      youtube: [
        /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]+/,
        /^https:\/\/youtu\.be\/[\w-]+/,
        /^https:\/\/www\.youtube\.com\/embed\/[\w-]+/
      ],
      hudl: [
        /^https:\/\/www\.hudl\.com\/video\/[\w-]+/,
        /^https:\/\/www\.hudl\.com\/embed\/[\w-]+/
      ],
      vimeo: [
        /^https:\/\/vimeo\.com\/\d+/,
        /^https:\/\/player\.vimeo\.com\/video\/\d+/
      ],
      instagram: [
        /^https:\/\/www\.instagram\.com\/p\/[\w-]+/,
        /^https:\/\/www\.instagram\.com\/reel\/[\w-]+/
      ],
      twitter: [
        /^https:\/\/twitter\.com\/\w+\/status\/\d+/
      ],
      website: [
        /^https?:\/\/.+/
      ]
    };

    const platformPatterns = patterns[platform as keyof typeof patterns];
    return platformPatterns?.some(pattern => pattern.test(code)) || false;
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleInputChange = (field: keyof HighlightFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleEmbedCodeChange = (value: string) => {
    setEmbedCode(value);
    
    if (validationErrors.embedCode) {
      setValidationErrors(prev => ({ ...prev, embedCode: undefined }));
    }
  };

  const handleAddSourceLink = () => {
    if (!embedCode.trim()) {
      setValidationErrors(prev => ({ ...prev, embedCode: 'Embed code is required' }));
      return;
    }

    if (!validateEmbedCode(selectedPlatform, embedCode)) {
      setValidationErrors(prev => ({ 
        ...prev, 
        embedCode: `Invalid ${SUPPORTED_PLATFORMS.find(p => p.id === selectedPlatform)?.name} URL` 
      }));
      return;
    }

    const newSourceLink: SourceLink = {
      id: `source_${Date.now()}`,
      type: selectedPlatform as SourceLink['type'],
      url: embedCode,
      title: formData.title,
      description: formData.description,
      addedBy: 'current-user', // TODO: Get from auth context
      addedAt: new Date(),
      isVerified: false,
      metadata: {}
    };

    setFormData(prev => ({
      ...prev,
      sourceLinks: [...prev.sourceLinks, newSourceLink]
    }));

    setEmbedCode('');
    setValidationErrors(prev => ({ ...prev, embedCode: undefined }));
  };

  const handleRemoveSourceLink = (sourceId: string) => {
    setFormData(prev => ({
      ...prev,
      sourceLinks: prev.sourceLinks.filter(link => link.id !== sourceId)
    }));
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Failed to submit highlight:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      sport: defaultSport,
      highlightType: 'play',
      sourceLinks: [],
      tags: [],
      isPublic: true
    });
    setEmbedCode('');
    setValidationErrors({});
    setIsSubmitting(false);
    onClose();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Add Highlight for {athleteName}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter highlight title"
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport *
                </label>
                <select
                  value={formData.sport}
                  onChange={(e) => handleInputChange('sport', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.sport ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="basketball">Basketball</option>
                  <option value="football">Football</option>
                  <option value="soccer">Soccer</option>
                  <option value="baseball">Baseball</option>
                  <option value="softball">Softball</option>
                  <option value="volleyball">Volleyball</option>
                  <option value="track">Track</option>
                  <option value="swimming">Swimming</option>
                </select>
                {validationErrors.sport && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.sport}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe the highlight (optional)"
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
              )}
            </div>

            {/* Highlight Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Highlight Type
              </label>
              <select
                value={formData.highlightType}
                onChange={(e) => handleInputChange('highlightType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="play">Single Play</option>
                <option value="game_highlights">Game Highlights</option>
                <option value="season_highlights">Season Highlights</option>
                <option value="training">Training</option>
                <option value="interview">Interview</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Source Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Links *
              </label>
              
              {/* Add Source Link */}
              <div className="flex space-x-2 mb-4">
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SUPPORTED_PLATFORMS.map(platform => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
                
                <input
                  type="url"
                  value={embedCode}
                  onChange={(e) => handleEmbedCodeChange(e.target.value)}
                  placeholder={SUPPORTED_PLATFORMS.find(p => p.id === selectedPlatform)?.placeholder}
                  className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.embedCode ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                
                <button
                  type="button"
                  onClick={handleAddSourceLink}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
              
              {validationErrors.embedCode && (
                <p className="mb-2 text-sm text-red-600">{validationErrors.embedCode}</p>
              )}
              
              {validationErrors.sourceLinks && (
                <p className="mb-2 text-sm text-red-600">{validationErrors.sourceLinks}</p>
              )}

              {/* Source Links List */}
              {formData.sourceLinks.length > 0 && (
                <div className="space-y-2">
                  {formData.sourceLinks.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {link.type.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-900 truncate">
                            {link.url}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSourceLink(link.id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tags (press Enter to add)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>

            {/* Privacy Settings */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Make this highlight public
                </span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Highlight'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
