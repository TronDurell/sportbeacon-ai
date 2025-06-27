import React from 'react';
import { render, screen } from '@testing-library/react';
import ImmersiveMapInterface from './ImmersiveMapInterface';
import '@testing-library/jest-dom';

describe('ImmersiveMapInterface', () => {
  it('renders map and filter controls', () => {
    render(<ImmersiveMapInterface />);
    expect(screen.getByLabelText(/immersive map/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/highlight filter controls/i)).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    render(<ImmersiveMapInterface />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('handles Firestore errors gracefully', () => {
    // Simulate Firestore error by mocking onSnapshot
    // ...mock logic here...
    // expect fallback UI
  });
}); 