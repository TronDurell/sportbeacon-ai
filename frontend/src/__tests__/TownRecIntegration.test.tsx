import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";

// Mock all Town Rec modules
jest.mock("../../../lib/townRec/AgeCheckAIAssistant");
jest.mock("../../../lib/townRec/WaitlistManager");
jest.mock("../../../lib/townRec/SiblingPairingQueue");
jest.mock("../../../lib/townRec/TownStaffRole");
jest.mock("../../../lib/townRec/TownStaffRole");
jest.mock("../../../lib/firebase/config");

// Mock AdminAuthContext
const mockAuthContext = {
  user: {
    uid: "test-director-123",
    email: "rec.director@cary.gov",
    role: "RecDirector",
    permissions: ["waitlist_manage", "overrides_approve", "analytics_view", "users_manage"]
  },
  isAuthenticated: true,
  loading: false,
  login: jest.fn(),
  logout: jest.fn()
};

jest.mock("../../contexts/AdminAuthContext", () => ({
  useAuth: () => mockAuthContext
}));

// Import components
import RecAdminHub from "../modules/TownRecSystem/RecAdminHub";
import RecAuditPanel from "../modules/AdminTools/RecAuditPanel";
import TownCarySandbox from "../modules/TownRecSystem/TownCarySandbox";

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe("Town Rec System Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Complete Waitlist Workflow", () => {
    test("full waitlist promotion workflow", async () => {
      const { waitlistManager } = await import("../../../lib/townRec/WaitlistManager");
      const mockWaitlistInstance = {
        addToWaitlist: jest.fn().mockResolvedValue("waitlist-entry-123"),
        promoteFromWaitlist: jest.fn().mockResolvedValue(["promoted-entry"]),
        handlePromotionResponse: jest.fn().mockResolvedValue(undefined),
        getWaitlistEntries: jest.fn().mockResolvedValue([
          {
            id: "waitlist-entry-123",
            childName: "Emma Johnson",
            parentName: "Sarah Johnson",
            parentEmail: "sarah.johnson@email.com",
            league: "Youth Soccer U10",
            waitlistPosition: 1,
            status: "waiting"
          }
        ])
      };
      waitlistManager.getInstance.mockReturnValue(mockWaitlistInstance);

      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );

      // Navigate to waitlists tab
      await waitFor(() => {
        expect(screen.getByText("Emma Johnson")).toBeInTheDocument();
      });

      // Promote from waitlist
      const promoteButton = screen.getByTestId("promote-button");
      fireEvent.click(promoteButton);

      await waitFor(() => {
        expect(mockWaitlistInstance.promoteFromWaitlist).toHaveBeenCalledWith("Youth Soccer U10", 1);
      });

      // Verify promotion response handling
      await mockWaitlistInstance.handlePromotionResponse("waitlist-entry-123", "accepted");
      expect(mockWaitlistInstance.handlePromotionResponse).toHaveBeenCalledWith("waitlist-entry-123", "accepted");
    });

    test("waitlist with age override integration", async () => {
      const { ageCheckAIAssistant } = require("../../../lib/townRec/AgeCheckAIAssistant");
      const { waitlistManager } = await import("../../../lib/townRec/WaitlistManager");

      const mockAgeInstance = {
        submitAgeOverrideRequest: jest.fn().mockResolvedValue("override-123"),
        processOverrideRequest: jest.fn().mockResolvedValue(undefined),
        getPendingOverrides: jest.fn().mockResolvedValue([
          {
            id: "override-123",
            childName: "Riley Thompson",
            parentEmail: "mark.thompson@email.com",
            currentAge: 9,
            requestedLeague: "Youth Soccer U10",
            status: "pending"
          }
        ])
      };

      const mockWaitlistInstance = {
        addToWaitlist: jest.fn().mockResolvedValue("waitlist-entry-456"),
        promoteFromWaitlist: jest.fn().mockResolvedValue([])
      };

      ageCheckAIAssistant.getInstance.mockReturnValue(mockAgeInstance);
      waitlistManager.getInstance.mockReturnValue(mockWaitlistInstance);

      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );

      // Navigate to age overrides tab
      const overridesTab = screen.getByText("Age Overrides");
      fireEvent.click(overridesTab);

      await waitFor(() => {
        expect(screen.getByText("Riley Thompson")).toBeInTheDocument();
      });

      // Approve override
      const approveButton = screen.getByText("Approve");
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockAgeInstance.processOverrideRequest).toHaveBeenCalledWith("override-123", "approve", "test-director-123", undefined);
      });
    });
  });

  describe("Sibling Pairing Workflow", () => {
    test("sibling pairing with conflict resolution", async () => {
      const { siblingPairingQueue } = await import("../../../lib/townRec/SiblingPairingQueue");
      const mockSiblingInstance = {
        processRegistration: jest.fn().mockResolvedValue(undefined),
        resolvePairingConflicts: jest.fn().mockResolvedValue(undefined),
        getSiblingPairings: jest.fn().mockResolvedValue([
          {
            id: "pairing-123",
            familyId: "fam_001",
            parentName: "Jennifer Smith",
            parentEmail: "jennifer.smith@email.com",
            children: [
              { name: "Alex Smith", age: 10, league: "Youth Soccer" },
              { name: "Jordan Smith", age: 8, league: "Youth Soccer" }
            ],
            status: "conflict",
            conflicts: [
              { childId: "child-1", childName: "Alex Smith", issue: "Age difference exceeds maximum allowed" }
            ]
          }
        ])
      };
      siblingPairingQueue.getInstance.mockReturnValue(mockSiblingInstance);

      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );

      // Navigate to sibling pairing tab
      const siblingsTab = screen.getByText("Sibling Pairing");
      fireEvent.click(siblingsTab);

      await waitFor(() => {
        expect(screen.getByText("Jennifer Smith")).toBeInTheDocument();
        expect(screen.getByText("Alex Smith")).toBeInTheDocument();
        expect(screen.getByText("Jordan Smith")).toBeInTheDocument();
      });

      // Resolve conflict
      const resolveButton = screen.getByText("Resolve Conflict");
      fireEvent.click(resolveButton);

      await waitFor(() => {
        expect(mockSiblingInstance.resolvePairingConflicts).toHaveBeenCalledWith("pairing-123", expect.any(Object));
      });
    });
  });

  describe("Audit Trail Integration", () => {
    test("complete audit trail for all actions", async () => {
      render(
        <TestWrapper>
          <RecAuditPanel />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Age override approved for Riley Thompson")).toBeInTheDocument();
        expect(screen.getByText("Emma Johnson promoted from waitlist")).toBeInTheDocument();
        expect(screen.getByText("Sibling pairing conflict detected for Smith family")).toBeInTheDocument();
      });

      // Test audit log filtering
      const categoryFilter = screen.getByDisplayValue("All Categories");
      fireEvent.change(categoryFilter, { target: { value: "overrides" } });

      await waitFor(() => {
        expect(screen.getByText("Age override approved for Riley Thompson")).toBeInTheDocument();
        expect(screen.queryByText("Emma Johnson promoted from waitlist")).not.toBeInTheDocument();
      });

      // Test audit log export
      const exportButton = screen.getByText("Export CSV");
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(exportButton).toBeDisabled();
      });
    });
  });

  describe("Sandbox Environment Integration", () => {
    test("complete sandbox scenario execution", async () => {
      render(
        <TestWrapper>
          <TownCarySandbox />
        </TestWrapper>
      );

      // Start sandbox
      const startButton = screen.getByText("Start");
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("Running")).toBeInTheDocument();
      });

      // Start a scenario
      await waitFor(() => {
        const scenarioButton = screen.getByText("Start Scenario");
        fireEvent.click(scenarioButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Active Scenario: Waitlist Promotion")).toBeInTheDocument();
      });

      // Complete scenario
      const completeButton = screen.getByText("Complete Scenario");
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.queryByText("Active Scenario: Waitlist Promotion")).not.toBeInTheDocument();
      });
    });

    test("sandbox user management", async () => {
      render(
        <TestWrapper>
          <TownCarySandbox />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Sarah Johnson")).toBeInTheDocument();
        expect(screen.getByText("Michael Chen")).toBeInTheDocument();
      });

      // View user details
      const viewDetailsButton = screen.getAllByText("View Details")[0];
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText("User Details")).toBeInTheDocument();
        expect(screen.getByText("sarah.johnson@cary.gov")).toBeInTheDocument();
        expect(screen.getByText("RecDirector")).toBeInTheDocument();
      });
    });

    test("sandbox league management", async () => {
      render(
        <TestWrapper>
          <TownCarySandbox />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Youth Soccer U8")).toBeInTheDocument();
        expect(screen.getByText("Youth Soccer U10")).toBeInTheDocument();
      });

      // View league details
      const viewLeagueButton = screen.getAllByTestId("view-league-button")[0];
      fireEvent.click(viewLeagueButton);

      await waitFor(() => {
        expect(screen.getByText("League Details")).toBeInTheDocument();
        expect(screen.getByText("Soccer")).toBeInTheDocument();
        expect(screen.getByText("U8")).toBeInTheDocument();
      });
    });
  });

  describe("Cross-Component Integration", () => {
    test("data consistency across components", async () => {
      // Test that data flows correctly between RecAdminHub and RecAuditPanel
      const { RecAdminHub: AdminHub, RecAuditPanel: AuditPanel } = require("../modules/TownRecSystem/RecAdminHub");
      
      render(
        <TestWrapper>
          <div>
            <RecAdminHub />
            <RecAuditPanel />
          </div>
        </TestWrapper>
      );

      await waitFor(() => {
        // Verify that actions in RecAdminHub appear in RecAuditPanel
        expect(screen.getByText("Emma Johnson")).toBeInTheDocument(); // From RecAdminHub
        expect(screen.getByText("Age override approved for Riley Thompson")).toBeInTheDocument(); // From RecAuditPanel
      });
    });

    test("role-based access control integration", () => {
      const { townStaffRole } = await import("../../../lib/townRec/TownStaffRole");
      const mockRoleInstance = {
        canAccessRecAdminHub: jest.fn().mockReturnValue(true),
        canManageWaitlists: jest.fn().mockReturnValue(true),
        canApproveOverrides: jest.fn().mockReturnValue(true),
        canViewAnalytics: jest.fn().mockReturnValue(true),
        hasPermission: jest.fn().mockReturnValue(true)
      };
      townStaffRole.getInstance.mockReturnValue(mockRoleInstance);

      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );

      expect(mockRoleInstance.canAccessRecAdminHub).toHaveBeenCalled();
      expect(mockRoleInstance.canManageWaitlists).toHaveBeenCalled();
      expect(mockRoleInstance.canApproveOverrides).toHaveBeenCalled();
    });
  });

  describe("Error Handling Integration", () => {
    test("graceful error handling across components", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Mock API failures
      const { ageCheckAIAssistant } = require("../../../lib/townRec/AgeCheckAIAssistant");
      const mockAgeInstance = {
        submitAgeOverrideRequest: jest.fn().mockRejectedValue(new Error("API Error")),
        getPendingOverrides: jest.fn().mockRejectedValue(new Error("API Error"))
      };
      ageCheckAIAssistant.getInstance.mockReturnValue(mockAgeInstance);

      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );

      // Navigate to age overrides tab
      const overridesTab = screen.getByText("Age Overrides");
      fireEvent.click(overridesTab);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    test("network error recovery", async () => {
      const { waitlistManager } = await import("../../../lib/townRec/WaitlistManager");
      const mockWaitlistInstance = {
        addToWaitlist: jest.fn()
          .mockRejectedValueOnce(new Error("Network Error"))
          .mockResolvedValueOnce("success-entry"),
        getWaitlistEntries: jest.fn().mockResolvedValue([])
      };
      waitlistManager.getInstance.mockReturnValue(mockWaitlistInstance);

      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );

      // First call should fail
      await waitFor(() => {
        expect(mockWaitlistInstance.addToWaitlist).toHaveBeenCalled();
      });

      // Second call should succeed
      await waitFor(() => {
        expect(mockWaitlistInstance.addToWaitlist).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Performance Integration", () => {
    test("large dataset handling", async () => {
      const { waitlistManager } = await import("../../../lib/townRec/WaitlistManager");
      
      // Mock large dataset
      const largeWaitlistData = Array.from({ length: 100 }, (_, i) => ({
        id: `entry-${i}`,
        childName: `Child ${i}`,
        parentName: `Parent ${i}`,
        parentEmail: `parent${i}@email.com`,
        league: "Youth Soccer U10",
        waitlistPosition: i + 1,
        status: "waiting"
      }));

      const mockWaitlistInstance = {
        getWaitlistEntries: jest.fn().mockResolvedValue(largeWaitlistData),
        addToWaitlist: jest.fn().mockResolvedValue("new-entry")
      };
      waitlistManager.getInstance.mockReturnValue(mockWaitlistInstance);

      const startTime = performance.now();

      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Child 0")).toBeInTheDocument();
        expect(screen.getByText("Child 99")).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(5000); // 5 seconds
    });
  });

  describe("Data Persistence Integration", () => {
    test("data persistence across component unmounts", async () => {
      const { waitlistManager } = await import("../../../lib/townRec/WaitlistManager");
      const mockWaitlistInstance = {
        getWaitlistEntries: jest.fn().mockResolvedValue([
          {
            id: "persistent-entry",
            childName: "Persistent Child",
            parentName: "Persistent Parent",
            parentEmail: "persistent@email.com",
            league: "Youth Soccer U10",
            waitlistPosition: 1,
            status: "waiting"
          }
        ])
      };
      waitlistManager.getInstance.mockReturnValue(mockWaitlistInstance);

      const { unmount } = render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Persistent Child")).toBeInTheDocument();
      });

      // Unmount and remount
      unmount();

      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Persistent Child")).toBeInTheDocument();
      });
    });
  });
}); 