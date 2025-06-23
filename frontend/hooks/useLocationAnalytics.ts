import { useState, useCallback } from 'react';

interface LocationPreferences {
  latitude: number;
  longitude: number;
  type: string;
  equipment: string[];
}

const defaultPreferences: LocationPreferences = {
  latitude: 40.7128, // Default to NYC
  longitude: -74.0060,
  type: 'calisthenics',
  equipment: [],
};

export const useLocationAnalytics = () => {
  const [preferences, setPreferences] = useState<LocationPreferences>(defaultPreferences);

  const extractLocationPreferences = useCallback((question: string) => {
    const newPreferences = { ...defaultPreferences };

    if (question.toLowerCase().includes('gym')) {
      newPreferences.type = 'gym';
    } else if (question.toLowerCase().includes('park')) {
      newPreferences.type = 'calisthenics';
    }

    if (question.toLowerCase().includes('weights')) {
      newPreferences.equipment.push('weights');
    }
    if (question.toLowerCase().includes('pull-up')) {
      newPreferences.equipment.push('pull-up bar');
    }

    setPreferences(newPreferences);
  }, []);

  return {
    preferences,
    extractLocationPreferences,
  };
}; 