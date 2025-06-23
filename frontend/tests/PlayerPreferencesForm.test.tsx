import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import PlayerPreferencesForm from '../components/PlayerPreferencesForm';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PlayerPreferencesForm', () => {
  const defaultProps = {
    walletAddress: '0x1234567890abcdef',
    signature: '0xsignature123',
    message: 'test_message',
    onPreferencesSaved: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with all sections', () => {
    render(<PlayerPreferencesForm {...defaultProps} />);
    
    expect(screen.getByText('Personalize Your Training')).toBeInTheDocument();
    expect(screen.getByText('Skill Goals')).toBeInTheDocument();
    expect(screen.getByText('Coach Style')).toBeInTheDocument();
    expect(screen.getByText('Rest Days')).toBeInTheDocument();
    expect(screen.getByText('Injury & Health Information')).toBeInTheDocument();
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
  });

  it('loads existing preferences on mount', async () => {
    const mockPreferences = {
      skill_goals: {
        shooting: { target_score: 85, priority: 'high' }
      },
      coach_tone: 'technical',
      training_intensity: 'high'
    };

    mockedAxios.get.mockResolvedValueOnce({ data: { preferences: mockPreferences } });

    render(<PlayerPreferencesForm {...defaultProps} />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/player/preferences', {
        params: {
          wallet_address: defaultProps.walletAddress,
          signature: defaultProps.signature,
          message: defaultProps.message
        }
      });
    });
  });

  it('handles skill goal changes', () => {
    render(<PlayerPreferencesForm {...defaultProps} />);
    
    const shootingTargetInput = screen.getByDisplayValue('75');
    fireEvent.change(shootingTargetInput, { target: { value: '90' } });
    
    expect(shootingTargetInput).toHaveValue(90);
  });

  it('handles coach tone selection', () => {
    render(<PlayerPreferencesForm {...defaultProps} />);
    
    const coachToneSelect = screen.getByDisplayValue('Encouraging & Supportive');
    fireEvent.change(coachToneSelect, { target: { value: 'technical' } });
    
    expect(coachToneSelect).toHaveValue('technical');
  });

  it('handles rest day toggles', () => {
    render(<PlayerPreferencesForm {...defaultProps} />);
    
    const mondayCheckbox = screen.getByLabelText('Monday');
    fireEvent.click(mondayCheckbox);
    
    expect(mondayCheckbox).toBeChecked();
  });

  it('handles injury data input', () => {
    render(<PlayerPreferencesForm {...defaultProps} />);
    
    const injuriesInput = screen.getByPlaceholderText('e.g., ankle sprain, knee strain');
    fireEvent.change(injuriesInput, { target: { value: 'ankle sprain, knee strain' } });
    
    expect(injuriesInput).toHaveValue('ankle sprain, knee strain');
  });

  it('handles notification preference changes', () => {
    render(<PlayerPreferencesForm {...defaultProps} />);
    
    const voiceFeedbackCheckbox = screen.getByLabelText('Voice Feedback During Drills');
    fireEvent.click(voiceFeedbackCheckbox);
    
    expect(voiceFeedbackCheckbox).not.toBeChecked();
  });

  it('submits form successfully', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Preferences saved successfully'
      }
    });

    render(<PlayerPreferencesForm {...defaultProps} />);
    
    const submitButton = screen.getByText('Save Preferences');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/player/preferences', {
        wallet_address: defaultProps.walletAddress,
        signature: defaultProps.signature,
        message: defaultProps.message,
        preferences: expect.objectContaining({
          skill_goals: expect.any(Object),
          coach_tone: 'encouraging',
          training_intensity: 'medium'
        })
      });
    });

    expect(screen.getByText('✅ Preferences saved successfully!')).toBeInTheDocument();
    expect(defaultProps.onPreferencesSaved).toHaveBeenCalled();
  });

  it('handles submission error', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Failed to save preferences' } }
    });

    render(<PlayerPreferencesForm {...defaultProps} />);
    
    const submitButton = screen.getByText('Save Preferences');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('❌ Failed to save preferences')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockedAxios.post.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<PlayerPreferencesForm {...defaultProps} />);
    
    const submitButton = screen.getByText('Save Preferences');
    fireEvent.click(submitButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Invalid preferences structure' } }
    });

    render(<PlayerPreferencesForm {...defaultProps} />);
    
    // Clear required fields
    const shootingTargetInput = screen.getByDisplayValue('75');
    fireEvent.change(shootingTargetInput, { target: { value: '' } });
    
    const submitButton = screen.getByText('Save Preferences');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/❌/)).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

    render(<PlayerPreferencesForm {...defaultProps} />);
    
    const submitButton = screen.getByText('Save Preferences');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('❌ Failed to save preferences')).toBeInTheDocument();
    });
  });

  it('updates form state correctly', () => {
    render(<PlayerPreferencesForm {...defaultProps} />);
    
    // Change multiple fields
    const shootingTargetInput = screen.getByDisplayValue('75');
    const coachToneSelect = screen.getByDisplayValue('Encouraging & Supportive');
    const durationInput = screen.getByDisplayValue('45');
    
    fireEvent.change(shootingTargetInput, { target: { value: '90' } });
    fireEvent.change(coachToneSelect, { target: { value: 'strict' } });
    fireEvent.change(durationInput, { target: { value: '60' } });
    
    expect(shootingTargetInput).toHaveValue(90);
    expect(coachToneSelect).toHaveValue('strict');
    expect(durationInput).toHaveValue(60);
  });

  it('clears success message after timeout', async () => {
    jest.useFakeTimers();
    
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, message: 'Preferences saved successfully' }
    });

    render(<PlayerPreferencesForm {...defaultProps} />);
    
    const submitButton = screen.getByText('Save Preferences');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('✅ Preferences saved successfully!')).toBeInTheDocument();
    });

    // Fast-forward time
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('✅ Preferences saved successfully!')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });
}); 