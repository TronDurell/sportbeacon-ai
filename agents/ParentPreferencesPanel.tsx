// ParentPreferencesPanel - Panel for managing parent preferences
import React from 'react';

export interface ParentPreferencesPanelProps {
  parentId: string;
  preferences: any;
  onUpdatePreferences: (preferences: any) => void;
}

export const ParentPreferencesPanel: React.FC<ParentPreferencesPanelProps> = ({ 
  parentId, 
  preferences, 
  onUpdatePreferences 
}) => {
  return (
    <div data-testid="parent-preferences-panel">
      <h3>Parent Preferences Panel</h3>
      <p>Parent ID: {parentId}</p>
      <p>Preferences: {JSON.stringify(preferences)}</p>
      <button onClick={() => onUpdatePreferences({ test: true })}>
        Update Preferences
      </button>
    </div>
  );
};

export default ParentPreferencesPanel;
