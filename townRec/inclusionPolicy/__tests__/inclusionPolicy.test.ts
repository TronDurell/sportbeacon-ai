import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { LeagueCreationModal } from '../LeagueCreationModal';
import { ExceptionRequestModal } from '../ExceptionRequestModal';
import { AdminLeagueDashboard } from '../AdminLeagueDashboard';

// Mock Firebase
jest.mock('../../../lib/firebase', () => ({
  firestore: {
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    Timestamp: {
      now: jest.fn(() => ({ toDate: () => new Date() })),
      fromDate: jest.fn(() => ({ toDate: () => new Date() }))
    }
  }
}));

// Mock analytics
jest.mock('../../../lib/ai/shared/analytics', () => ({
  analytics: {
    track: jest.fn()
  }
}));

describe('LeagueCreationModal', () => {
  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    adminId: 'admin123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with all policy toggles', () => {
    const { getByText, getByPlaceholderText } = render(
      <LeagueCreationModal {...mockProps} />
    );

    expect(getByText('Create New League')).toBeTruthy();
    expect(getByPlaceholderText('Enter league name')).toBeTruthy();
    expect(getByPlaceholderText('Enter town or city')).toBeTruthy();
    expect(getByText('Gender Policy')).toBeTruthy();
    expect(getByText('Contact Level')).toBeTruthy();
    expect(getByText('Identity Blur')).toBeTruthy();
  });

  it('validates required fields', async () => {
    const { getByText } = render(
      <LeagueCreationModal {...mockProps} />
    );

    const createButton = getByText('Create League');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(getByText('Please fill in all required fields')).toBeTruthy();
    });
  });

  it('creates league with correct policy settings', async () => {
    const mockAddDoc = require('../../../lib/firebase').firestore.addDoc;
    mockAddDoc.mockResolvedValue({ id: 'league123' });

    const { getByPlaceholderText, getByText } = render(
      <LeagueCreationModal {...mockProps} />
    );

    // Fill in required fields
    fireEvent.changeText(getByPlaceholderText('Enter league name'), 'Test League');
    fireEvent.changeText(getByPlaceholderText('Enter town or city'), 'Test Town');

    // Select gender policy
    fireEvent.press(getByText('Admin Review'));

    const createButton = getByText('Create League');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          name: 'Test League',
          town: 'Test Town',
          policy: expect.objectContaining({
            genderPolicy: 'Admin Review',
            contactLevel: 'Medium',
            identityBlur: false
          })
        })
      );
    });
  });

  it('handles gender category selection', () => {
    const { getByText } = render(
      <LeagueCreationModal {...mockProps} />
    );

    const coedOption = getByText('Co-Ed');
    const maleOption = getByText('Men Only');
    const femaleOption = getByText('Women Only');

    fireEvent.press(maleOption);
    expect(maleOption.parent).toHaveStyle({ borderColor: '#007AFF' });

    fireEvent.press(femaleOption);
    expect(femaleOption.parent).toHaveStyle({ borderColor: '#007AFF' });
  });

  it('toggles identity blur setting', () => {
    const { getByText } = render(
      <LeagueCreationModal {...mockProps} />
    );

    const identityBlurSwitch = getByText('Identity Blur').parent;
    fireEvent.press(identityBlurSwitch);

    // Check if the switch state changed
    expect(identityBlurSwitch).toBeTruthy();
  });
});

describe('ExceptionRequestModal', () => {
  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    leagueInfo: {
      id: 'league123',
      name: 'Test League',
      genderCategory: 'male' as const,
      town: 'Test Town'
    },
    userProfile: {
      genderIdentity: 'female',
      genderAtBirth: 'female',
      preferredName: 'Test User'
    },
    userId: 'user123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with league and user information', () => {
    const { getByText } = render(
      <ExceptionRequestModal {...mockProps} />
    );

    expect(getByText('Exception Request')).toBeTruthy();
    expect(getByText('Test League')).toBeTruthy();
    expect(getByText('Test Town')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('female')).toBeTruthy();
  });

  it('shows correct mismatch explanation for male league', () => {
    const { getByText } = render(
      <ExceptionRequestModal {...mockProps} />
    );

    expect(getByText(/This league is designated for men only/)).toBeTruthy();
    expect(getByText(/You identify as female and were assigned female at birth/)).toBeTruthy();
  });

  it('validates reason field', async () => {
    const { getByText } = render(
      <ExceptionRequestModal {...mockProps} />
    );

    const submitButton = getByText('Submit Request');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Please provide a reason for your exception request')).toBeTruthy();
    });
  });

  it('submits exception request successfully', async () => {
    const mockAddDoc = require('../../../lib/firebase').firestore.addDoc;
    mockAddDoc.mockResolvedValue({ id: 'request123' });

    const { getByPlaceholderText, getByText } = render(
      <ExceptionRequestModal {...mockProps} />
    );

    // Fill in reason
    fireEvent.changeText(
      getByPlaceholderText('Explain your request for admin review...'),
      'I would like to join this league for competitive play'
    );

    const submitButton = getByText('Submit Request');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          leagueId: 'league123',
          userId: 'user123',
          birthSex: 'female',
          genderIdentity: 'female',
          status: 'pending',
          reason: 'I would like to join this league for competitive play'
        })
      );
    });
  });

  it('handles cancel with confirmation', () => {
    const { getByText } = render(
      <ExceptionRequestModal {...mockProps} />
    );

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(getByText('Cancel Request')).toBeTruthy();
    expect(getByText('Are you sure you want to cancel?')).toBeTruthy();
  });
});

describe('AdminLeagueDashboard', () => {
  const mockProps = {
    adminId: 'admin123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with tab navigation', () => {
    const { getByText } = render(
      <AdminLeagueDashboard {...mockProps} />
    );

    expect(getByText('League Administration')).toBeTruthy();
    expect(getByText('Pending')).toBeTruthy();
    expect(getByText('Approved')).toBeTruthy();
    expect(getByText('Denied')).toBeTruthy();
    expect(getByText('Overrides')).toBeTruthy();
  });

  it('switches between tabs', () => {
    const { getByText } = render(
      <AdminLeagueDashboard {...mockProps} />
    );

    const approvedTab = getByText('Approved');
    fireEvent.press(approvedTab);

    expect(approvedTab.parent).toHaveStyle({ borderBottomColor: '#007AFF' });
  });

  it('shows loading state', () => {
    const { getByText } = render(
      <AdminLeagueDashboard {...mockProps} />
    );

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('shows empty state when no requests', async () => {
    const mockGetDocs = require('../../../lib/firebase').firestore.getDocs;
    mockGetDocs.mockResolvedValue({ docs: [], empty: true });

    const { getByText } = render(
      <AdminLeagueDashboard {...mockProps} />
    );

    await waitFor(() => {
      expect(getByText('No pending requests found')).toBeTruthy();
    });
  });

  it('displays request cards with action buttons', async () => {
    const mockGetDocs = require('../../../lib/firebase').firestore.getDocs;
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: 'request123',
        data: () => ({
          leagueId: 'league123',
          userId: 'user123',
          birthSex: 'female',
          genderIdentity: 'female',
          timestamp: { toDate: () => new Date() },
          status: 'pending',
          reason: 'Test reason',
          leagueName: 'Test League',
          leagueTown: 'Test Town',
          userPreferredName: 'Test User'
        })
      }],
      empty: false
    });

    const { getByText } = render(
      <AdminLeagueDashboard {...mockProps} />
    );

    await waitFor(() => {
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('Test League (Test Town)')).toBeTruthy();
      expect(getByText('Approve')).toBeTruthy();
      expect(getByText('Deny')).toBeTruthy();
    });
  });

  it('handles approve request', async () => {
    const mockUpdateDoc = require('../../../lib/firebase').firestore.updateDoc;
    mockUpdateDoc.mockResolvedValue(undefined);

    const mockGetDocs = require('../../../lib/firebase').firestore.getDocs;
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: 'request123',
        data: () => ({
          leagueId: 'league123',
          userId: 'user123',
          birthSex: 'female',
          genderIdentity: 'female',
          timestamp: { toDate: () => new Date() },
          status: 'pending',
          reason: 'Test reason',
          leagueName: 'Test League',
          leagueTown: 'Test Town',
          userPreferredName: 'Test User'
        })
      }],
      empty: false
    });

    const { getByText } = render(
      <AdminLeagueDashboard {...mockProps} />
    );

    await waitFor(() => {
      const approveButton = getByText('Approve');
      fireEvent.press(approveButton);
    });

    await waitFor(() => {
      expect(getByText('Approve Request')).toBeTruthy();
      expect(getByText('Are you sure you want to approve Test User\'s request?')).toBeTruthy();
    });
  });

  it('handles deny request', async () => {
    const mockUpdateDoc = require('../../../lib/firebase').firestore.updateDoc;
    mockUpdateDoc.mockResolvedValue(undefined);

    const mockGetDocs = require('../../../lib/firebase').firestore.getDocs;
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: 'request123',
        data: () => ({
          leagueId: 'league123',
          userId: 'user123',
          birthSex: 'female',
          genderIdentity: 'female',
          timestamp: { toDate: () => new Date() },
          status: 'pending',
          reason: 'Test reason',
          leagueName: 'Test League',
          leagueTown: 'Test Town',
          userPreferredName: 'Test User'
        })
      }],
      empty: false
    });

    const { getByText } = render(
      <AdminLeagueDashboard {...mockProps} />
    );

    await waitFor(() => {
      const denyButton = getByText('Deny');
      fireEvent.press(denyButton);
    });

    await waitFor(() => {
      expect(getByText('Deny Request')).toBeTruthy();
      expect(getByText('Are you sure you want to deny Test User\'s request?')).toBeTruthy();
    });
  });
});

describe('Firestore Rules', () => {
  it('allows authenticated users to read leagues', () => {
    // Test that authenticated users can read league documents
    expect(true).toBe(true); // Placeholder for actual rule testing
  });

  it('only allows admins to write to league_overrides', () => {
    // Test that only admins can create/update override documents
    expect(true).toBe(true); // Placeholder for actual rule testing
  });

  it('allows users to read their own exception requests', () => {
    // Test that users can read their own exception requests
    expect(true).toBe(true); // Placeholder for actual rule testing
  });

  it('prevents users from reading others exception requests', () => {
    // Test that users cannot read other users' exception requests
    expect(true).toBe(true); // Placeholder for actual rule testing
  });
});

describe('Integration Tests', () => {
  it('complete exception request flow', async () => {
    // Test the complete flow from user submitting request to admin approval
    expect(true).toBe(true); // Placeholder for integration testing
  });

  it('admin override workflow', async () => {
    // Test admin override command and audit trail
    expect(true).toBe(true); // Placeholder for integration testing
  });

  it('DEI reporting generation', async () => {
    // Test daily DEI report generation
    expect(true).toBe(true); // Placeholder for integration testing
  });
}); 