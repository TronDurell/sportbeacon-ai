import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { TownRecIntegrityModule } from '../town-rec-integrity/TownRecIntegrityModule';
import { LeagueCreationModal } from '../town-rec-integrity/LeagueCreationModal';
import { ExceptionRequestModal } from '../town-rec-integrity/ExceptionRequestModal';
import { AdminLeagueDashboard } from '../town-rec-integrity/AdminLeagueDashboard';

// Mock Firebase
jest.mock('firebase/app');
jest.mock('firebase/firestore');

const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() }))
  }
};

(getFirestore as jest.Mock).mockReturnValue(mockFirestore);

describe('TownRec Integrity Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Gender Policy Toggles', () => {
    it('should validate "Open" gender policy allows all users', async () => {
      const mockLeague = {
        id: 'league-1',
        name: 'Test League',
        genderPolicy: 'open',
        ageGroup: '8-10',
        sport: 'soccer'
      };

      const integrityModule = new TownRecIntegrityModule();
      const result = await integrityModule.validateUserEligibility({
        userId: 'user-1',
        leagueId: 'league-1',
        userGender: 'male',
        userAge: 9
      });

      expect(result.eligible).toBe(true);
      expect(result.reason).toBe('User meets all eligibility requirements');
    });

    it('should validate "Birth-Sex Only" policy restricts based on birth sex', async () => {
      const mockLeague = {
        id: 'league-1',
        name: 'Boys Only League',
        genderPolicy: 'birth-sex-only',
        ageGroup: '8-10',
        sport: 'soccer'
      };

      const integrityModule = new TownRecIntegrityModule();
      const result = await integrityModule.validateUserEligibility({
        userId: 'user-1',
        leagueId: 'league-1',
        userGender: 'female',
        userAge: 9,
        birthSex: 'female'
      });

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('League restricted to birth-assigned males only');
    });

    it('should validate "Admin Review" policy flags for manual review', async () => {
      const mockLeague = {
        id: 'league-1',
        name: 'Review League',
        genderPolicy: 'admin-review',
        ageGroup: '8-10',
        sport: 'soccer'
      };

      const integrityModule = new TownRecIntegrityModule();
      const result = await integrityModule.validateUserEligibility({
        userId: 'user-1',
        leagueId: 'league-1',
        userGender: 'non-binary',
        userAge: 9
      });

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Requires admin review for gender policy compliance');
      expect(result.requiresReview).toBe(true);
    });
  });

  describe('Policy Mismatch Detection', () => {
    it('should auto-detect male user trying to join female-only league', async () => {
      const mockLeague = {
        id: 'league-1',
        name: 'Girls Soccer',
        genderPolicy: 'girls-only',
        ageGroup: '8-10',
        sport: 'soccer'
      };

      const integrityModule = new TownRecIntegrityModule();
      const result = await integrityModule.validateUserEligibility({
        userId: 'user-1',
        leagueId: 'league-1',
        userGender: 'male',
        userAge: 9
      });

      expect(result.eligible).toBe(false);
      expect(result.conflictType).toBe('gender-policy-mismatch');
      expect(result.suggestedAction).toBe('submit-exception-request');
    });

    it('should auto-detect age group mismatch', async () => {
      const mockLeague = {
        id: 'league-1',
        name: 'U10 Soccer',
        genderPolicy: 'open',
        ageGroup: '8-10',
        sport: 'soccer'
      };

      const integrityModule = new TownRecIntegrityModule();
      const result = await integrityModule.validateUserEligibility({
        userId: 'user-1',
        leagueId: 'league-1',
        userGender: 'male',
        userAge: 12
      });

      expect(result.eligible).toBe(false);
      expect(result.conflictType).toBe('age-group-mismatch');
      expect(result.suggestedAction).toBe('find-alternative-league');
    });

    it('should detect skill level mismatch', async () => {
      const mockLeague = {
        id: 'league-1',
        name: 'Advanced Soccer',
        genderPolicy: 'open',
        ageGroup: '8-10',
        sport: 'soccer',
        skillLevel: 'advanced'
      };

      const integrityModule = new TownRecIntegrityModule();
      const result = await integrityModule.validateUserEligibility({
        userId: 'user-1',
        leagueId: 'league-1',
        userGender: 'male',
        userAge: 9,
        skillLevel: 'beginner'
      });

      expect(result.eligible).toBe(false);
      expect(result.conflictType).toBe('skill-level-mismatch');
      expect(result.suggestedAction).toBe('recommend-training-program');
    });
  });

  describe('Exception Request Workflow', () => {
    it('should create exception request when user submits', async () => {
      const mockAddDoc = addDoc as jest.Mock;
      mockAddDoc.mockResolvedValue({ id: 'exception-1' });

      const integrityModule = new TownRecIntegrityModule();
      const exceptionId = await integrityModule.submitExceptionRequest({
        userId: 'user-1',
        leagueId: 'league-1',
        reason: 'Gender identity accommodation needed',
        supportingDocuments: ['medical-note.pdf'],
        urgency: 'medium'
      });

      expect(exceptionId).toBe('exception-1');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          userId: 'user-1',
          leagueId: 'league-1',
          reason: 'Gender identity accommodation needed',
          status: 'pending',
          timestamp: expect.any(Object)
        })
      );
    });

    it('should create audit log entry for exception submission', async () => {
      const mockAddDoc = addDoc as jest.Mock;
      mockAddDoc.mockResolvedValue({ id: 'audit-1' });

      const integrityModule = new TownRecIntegrityModule();
      await integrityModule.submitExceptionRequest({
        userId: 'user-1',
        leagueId: 'league-1',
        reason: 'Test exception',
        urgency: 'low'
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          action: 'exception_request_submitted',
          userId: 'user-1',
          leagueId: 'league-1',
          timestamp: expect.any(Object)
        })
      );
    });

    it('should notify admin of new exception request', async () => {
      const mockAddDoc = addDoc as jest.Mock;
      mockAddDoc.mockResolvedValue({ id: 'notification-1' });

      const integrityModule = new TownRecIntegrityModule();
      await integrityModule.submitExceptionRequest({
        userId: 'user-1',
        leagueId: 'league-1',
        reason: 'Test exception',
        urgency: 'high'
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          type: 'exception_request',
          priority: 'high',
          userId: 'user-1',
          leagueId: 'league-1',
          timestamp: expect.any(Object)
        })
      );
    });
  });

  describe('Admin Approval Workflow', () => {
    it('should allow admin to approve exception request', async () => {
      const mockUpdateDoc = updateDoc as jest.Mock;
      mockUpdateDoc.mockResolvedValue(undefined);

      const integrityModule = new TownRecIntegrityModule();
      await integrityModule.approveExceptionRequest('exception-1', {
        adminId: 'admin-1',
        reason: 'Approved based on medical documentation',
        overridePolicy: true
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          status: 'approved',
          approvedBy: 'admin-1',
          approvedAt: expect.any(Object),
          approvalReason: 'Approved based on medical documentation'
        })
      );
    });

    it('should allow admin to deny exception request', async () => {
      const mockUpdateDoc = updateDoc as jest.Mock;
      mockUpdateDoc.mockResolvedValue(undefined);

      const integrityModule = new TownRecIntegrityModule();
      await integrityModule.denyExceptionRequest('exception-1', {
        adminId: 'admin-1',
        reason: 'Insufficient documentation provided',
        alternativeSuggestions: ['Co-ed league available', 'Individual training program']
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          status: 'denied',
          deniedBy: 'admin-1',
          deniedAt: expect.any(Object),
          denialReason: 'Insufficient documentation provided',
          alternativeSuggestions: ['Co-ed league available', 'Individual training program']
        })
      );
    });

    it('should create audit trail for admin actions', async () => {
      const mockAddDoc = addDoc as jest.Mock;
      mockAddDoc.mockResolvedValue({ id: 'audit-1' });

      const integrityModule = new TownRecIntegrityModule();
      await integrityModule.approveExceptionRequest('exception-1', {
        adminId: 'admin-1',
        reason: 'Test approval',
        overridePolicy: true
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          action: 'exception_request_approved',
          adminId: 'admin-1',
          exceptionId: 'exception-1',
          overridePolicy: true,
          timestamp: expect.any(Object)
        })
      );
    });

    it('should notify user of approval/denial decision', async () => {
      const mockAddDoc = addDoc as jest.Mock;
      mockAddDoc.mockResolvedValue({ id: 'notification-1' });

      const integrityModule = new TownRecIntegrityModule();
      await integrityModule.approveExceptionRequest('exception-1', {
        adminId: 'admin-1',
        reason: 'Approved',
        overridePolicy: false
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          type: 'exception_decision',
          userId: expect.any(String),
          decision: 'approved',
          reason: 'Approved',
          timestamp: expect.any(Object)
        })
      );
    });
  });

  describe('Daily DEI Report Generation', () => {
    it('should generate daily DEI metrics report', async () => {
      const mockGetDocs = getDocs as jest.Mock;
      mockGetDocs.mockResolvedValue({
        docs: [
          { data: () => ({ status: 'approved', timestamp: new Date() }) },
          { data: () => ({ status: 'denied', timestamp: new Date() }) },
          { data: () => ({ status: 'pending', timestamp: new Date() }) }
        ]
      });

      const integrityModule = new TownRecIntegrityModule();
      const report = await integrityModule.generateDailyDEIReport();

      expect(report).toHaveProperty('totalRequests');
      expect(report).toHaveProperty('approvalRate');
      expect(report).toHaveProperty('pendingRequests');
      expect(report).toHaveProperty('byTown');
      expect(report).toHaveProperty('byLeague');
    });

    it('should export report in multiple formats', async () => {
      const integrityModule = new TownRecIntegrityModule();
      const report = {
        totalRequests: 10,
        approvalRate: 70,
        pendingRequests: 2,
        byTown: { 'Test Town': 5 },
        byLeague: { 'Test League': 3 }
      };

      const csvExport = await integrityModule.exportReport(report, 'csv');
      const jsonExport = await integrityModule.exportReport(report, 'json');
      const xlsxExport = await integrityModule.exportReport(report, 'xlsx');

      expect(csvExport).toContain('totalRequests,approvalRate');
      expect(jsonExport).toHaveProperty('totalRequests', 10);
      expect(xlsxExport).toBeDefined();
    });
  });

  describe('League Creation Modal', () => {
    it('should render league creation form with gender policy options', () => {
      const { getByText, getByTestId } = render(
        <LeagueCreationModal
          visible={true}
          onClose={() => {}}
          onSubmit={() => {}}
        />
      );

      expect(getByText('Create New League')).toBeTruthy();
      expect(getByText('Gender Policy')).toBeTruthy();
      expect(getByTestId('gender-policy-open')).toBeTruthy();
      expect(getByTestId('gender-policy-birth-sex')).toBeTruthy();
      expect(getByTestId('gender-policy-admin-review')).toBeTruthy();
    });

    it('should validate required fields before submission', async () => {
      const mockOnSubmit = jest.fn();
      const { getByText, getByTestId } = render(
        <LeagueCreationModal
          visible={true}
          onClose={() => {}}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.press(getByText('Create League'));

      await waitFor(() => {
        expect(getByText('League name is required')).toBeTruthy();
        expect(getByText('Sport is required')).toBeTruthy();
        expect(getByText('Age group is required')).toBeTruthy();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit league with selected gender policy', async () => {
      const mockOnSubmit = jest.fn();
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <LeagueCreationModal
          visible={true}
          onClose={() => {}}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.changeText(getByPlaceholderText('League Name'), 'Test League');
      fireEvent.changeText(getByPlaceholderText('Sport'), 'Soccer');
      fireEvent.changeText(getByPlaceholderText('Age Group'), '8-10');
      fireEvent.press(getByTestId('gender-policy-open'));

      fireEvent.press(getByText('Create League'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test League',
            sport: 'Soccer',
            ageGroup: '8-10',
            genderPolicy: 'open'
          })
        );
      });
    });
  });

  describe('Exception Request Modal', () => {
    it('should render exception request form', () => {
      const { getByText, getByPlaceholderText } = render(
        <ExceptionRequestModal
          visible={true}
          onClose={() => {}}
          onSubmit={() => {}}
          leagueId="league-1"
          userId="user-1"
        />
      );

      expect(getByText('Request Exception')).toBeTruthy();
      expect(getByPlaceholderText('Explain your reason for requesting an exception...')).toBeTruthy();
      expect(getByText('Submit Request')).toBeTruthy();
    });

    it('should validate reason field before submission', async () => {
      const mockOnSubmit = jest.fn();
      const { getByText } = render(
        <ExceptionRequestModal
          visible={true}
          onClose={() => {}}
          onSubmit={mockOnSubmit}
          leagueId="league-1"
          userId="user-1"
        />
      );

      fireEvent.press(getByText('Submit Request'));

      await waitFor(() => {
        expect(getByText('Please provide a reason for your request')).toBeTruthy();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit exception request with reason', async () => {
      const mockOnSubmit = jest.fn();
      const { getByText, getByPlaceholderText } = render(
        <ExceptionRequestModal
          visible={true}
          onClose={() => {}}
          onSubmit={mockOnSubmit}
          leagueId="league-1"
          userId="user-1"
        />
      );

      fireEvent.changeText(
        getByPlaceholderText('Explain your reason for requesting an exception...'),
        'Medical accommodation needed'
      );

      fireEvent.press(getByText('Submit Request'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            reason: 'Medical accommodation needed',
            leagueId: 'league-1',
            userId: 'user-1'
          })
        );
      });
    });
  });

  describe('Admin League Dashboard', () => {
    it('should render admin dashboard with exception requests', () => {
      const { getByText } = render(
        <AdminLeagueDashboard
          leagueId="league-1"
          adminId="admin-1"
        />
      );

      expect(getByText('League Administration')).toBeTruthy();
      expect(getByText('Exception Requests')).toBeTruthy();
      expect(getByText('DEI Metrics')).toBeTruthy();
    });

    it('should filter exception requests by status', async () => {
      const { getByText, getByTestId } = render(
        <AdminLeagueDashboard
          leagueId="league-1"
          adminId="admin-1"
        />
      );

      fireEvent.press(getByTestId('filter-pending'));
      
      await waitFor(() => {
        expect(getByText('Pending Requests')).toBeTruthy();
      });
    });

    it('should allow admin to approve request inline', async () => {
      const { getByText, getByTestId } = render(
        <AdminLeagueDashboard
          leagueId="league-1"
          adminId="admin-1"
        />
      );

      fireEvent.press(getByTestId('approve-request-1'));

      await waitFor(() => {
        expect(getByText('Request approved successfully')).toBeTruthy();
      });
    });

    it('should allow admin to deny request with reason', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <AdminLeagueDashboard
          leagueId="league-1"
          adminId="admin-1"
        />
      );

      fireEvent.press(getByTestId('deny-request-1'));
      fireEvent.changeText(
        getByPlaceholderText('Reason for denial...'),
        'Insufficient documentation'
      );
      fireEvent.press(getByText('Confirm Denial'));

      await waitFor(() => {
        expect(getByText('Request denied successfully')).toBeTruthy();
      });
    });
  });
}); 