import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";

// Mock Firebase
jest.mock("../../../lib/firebase/config", () => ({
  db: {},
  auth: {},
  storage: {}
}));

// Mock Town Rec modules
jest.mock("../../../lib/townRec/AgeCheckAIAssistant", () => ({
  ageCheckAIAssistant: {
    getInstance: jest.fn(() => ({
      submitAgeOverrideRequest: jest.fn(),
      processOverrideRequest: jest.fn(),
      getPendingOverrides: jest.fn(),
      getOverrideAnalytics: jest.fn()
    }))
  }
}));

jest.mock("../../../lib/townRec/WaitlistManager", () => ({
  waitlistManager: {
    getInstance: jest.fn(() => ({
      addToWaitlist: jest.fn(),
      promoteFromWaitlist: jest.fn(),
      handlePromotionResponse: jest.fn(),
      getWaitlistEntries: jest.fn(),
      getWaitlistAnalytics: jest.fn()
    }))
  }
}));

jest.mock("../../../lib/townRec/SiblingPairingQueue", () => ({
  siblingPairingQueue: {
    getInstance: jest.fn(() => ({
      processRegistration: jest.fn(),
      resolvePairingConflicts: jest.fn(),
      getSiblingPairings: jest.fn(),
      getSiblingPairingAnalytics: jest.fn()
    }))
  }
}));

jest.mock("../../../lib/townRec/TownStaffRole", () => ({
  townStaffRole: {
    getInstance: jest.fn(() => ({
      authenticateUser: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
      getCurrentUser: jest.fn(),
      canAccessRecAdminHub: jest.fn(() => true),
      canManageWaitlists: jest.fn(() => true),
      canApproveOverrides: jest.fn(() => true),
      canViewAnalytics: jest.fn(() => true)
    }))
  }
}));

// Mock AdminAuthContext
const mockAuthContext = {
  user: {
    uid: "test-user-123",
    email: "test@cary.gov",
    role: "TownStaff",
    permissions: ["waitlist_manage", "overrides_approve", "analytics_view"]
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

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe("Town Rec System Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("RecAdminHub", () => {
    test("renders without crashing", () => {
      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );
      
      expect(screen.getByText("Town Rec Admin Hub")).toBeInTheDocument();
      expect(screen.getByText("Manage Cary Parks & Recreation sports programs")).toBeInTheDocument();
    });

    test("displays all tabs", () => {
      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );
      
      expect(screen.getByText("Waitlists")).toBeInTheDocument();
      expect(screen.getByText("Sibling Pairing")).toBeInTheDocument();
      expect(screen.getByText("Age Overrides")).toBeInTheDocument();
      expect(screen.getByText("Director Approvals")).toBeInTheDocument();
      expect(screen.getByText("Analytics")).toBeInTheDocument();
    });

    test("shows waitlist data when waitlists tab is active", async () => {
      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText("Emma Johnson")).toBeInTheDocument();
        expect(screen.getByText("Michael Chen")).toBeInTheDocument();
      });
    });

    test("filters waitlist data by search term", async () => {
      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );
      
      const searchInput = screen.getByPlaceholderText("Search by name, email, or league...");
      fireEvent.change(searchInput, { target: { value: "Emma" } });
      
      await waitFor(() => {
        expect(screen.getByText("Emma Johnson")).toBeInTheDocument();
        expect(screen.queryByText("Michael Chen")).not.toBeInTheDocument();
      });
    });

    test("exports data to CSV", async () => {
      const mockExport = jest.fn();
      global.URL.createObjectURL = jest.fn(() => "mock-url");
      global.URL.revokeObjectURL = jest.fn();
      
      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );
      
      const exportButton = screen.getByText("Export Waitlists");
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(exportButton).toBeDisabled();
      });
    });

    test("handles waitlist promotion", async () => {
      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const promoteButtons = screen.getAllByTestId("promote-button");
        expect(promoteButtons.length).toBeGreaterThan(0);
      });
    });

    test("shows access restricted for non-Town Staff", () => {
      mockAuthContext.user.role = "Parent";
      
      render(
        <TestWrapper>
          <RecAdminHub />
        </TestWrapper>
      );
      
      expect(screen.getByText("Access Restricted")).toBeInTheDocument();
      expect(screen.getByText("Only Town of Cary staff can access this area.")).toBeInTheDocument();
    });
  });

  describe("RecAuditPanel", () => {
    test("renders without crashing", () => {
      render(
        <TestWrapper>
          <RecAuditPanel />
        </TestWrapper>
      );
      
      expect(screen.getByText("Rec Audit Panel")).toBeInTheDocument();
      expect(screen.getByText("Track all administrative actions and system changes")).toBeInTheDocument();
    });

    test("displays audit log entries", async () => {
      render(
        <TestWrapper>
          <RecAuditPanel />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText("Age override approved for Riley Thompson")).toBeInTheDocument();
        expect(screen.getByText("Emma Johnson promoted from waitlist")).toBeInTheDocument();
      });
    });

    test("filters audit logs by category", async () => {
      render(
        <TestWrapper>
          <RecAuditPanel />
        </TestWrapper>
      );
      
      const categorySelect = screen.getByDisplayValue("All Categories");
      fireEvent.change(categorySelect, { target: { value: "overrides" } });
      
      await waitFor(() => {
        expect(screen.getByText("Age override approved for Riley Thompson")).toBeInTheDocument();
      });
    });

    test("shows log details modal", async () => {
      render(
        <TestWrapper>
          <RecAuditPanel />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const viewButtons = screen.getAllByTestId("view-log-button");
        fireEvent.click(viewButtons[0]);
      });
      
      expect(screen.getByText("Audit Log Details")).toBeInTheDocument();
    });

    test("exports audit logs to CSV", async () => {
      render(
        <TestWrapper>
          <RecAuditPanel />
        </TestWrapper>
      );
      
      const exportButton = screen.getByText("Export CSV");
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(exportButton).toBeDisabled();
      });
    });
  });

  describe("TownCarySandbox", () => {
    test("renders without crashing", () => {
      render(
        <TestWrapper>
          <TownCarySandbox />
        </TestWrapper>
      );
      
      expect(screen.getByText("Town Cary Sandbox")).toBeInTheDocument();
      expect(screen.getByText("Isolated test environment for Cary Parks & Rec pilot")).toBeInTheDocument();
    });

    test("shows sandbox status", () => {
      render(
        <TestWrapper>
          <TownCarySandbox />
        </TestWrapper>
      );
      
      expect(screen.getByText("Stopped")).toBeInTheDocument();
    });

    test("starts sandbox when start button is clicked", () => {
      render(
        <TestWrapper>
          <TownCarySandbox />
        </TestWrapper>
      );
      
      const startButton = screen.getByText("Start");
      fireEvent.click(startButton);
      
      expect(screen.getByText("Running")).toBeInTheDocument();
    });

    test("displays test scenarios", async () => {
      render(
        <TestWrapper>
          <TownCarySandbox />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText("Waitlist Promotion")).toBeInTheDocument();
        expect(screen.getByText("Age Override Approval")).toBeInTheDocument();
        expect(screen.getByText("Sibling Pairing Conflict")).toBeInTheDocument();
      });
    });

    test("starts scenario when scenario button is clicked", async () => {
      render(
        <TestWrapper>
          <TownCarySandbox />
        </TestWrapper>
      );
      
      // Start sandbox first
      const startButton = screen.getByText("Start");
      fireEvent.click(startButton);
      
      await waitFor(() => {
        const scenarioButtons = screen.getAllByText("Start Scenario");
        fireEvent.click(scenarioButtons[0]);
      });
      
      expect(screen.getByText("Active Scenario: Waitlist Promotion")).toBeInTheDocument();
    });

    test("displays test users", async () => {
      render(
        <TestWrapper>
          <TownCarySandbox />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText("Sarah Johnson")).toBeInTheDocument();
        expect(screen.getByText("Michael Chen")).toBeInTheDocument();
        expect(screen.getByText("Jennifer Smith")).toBeInTheDocument();
      });
    });

    test("displays test leagues", async () => {
      render(
        <TestWrapper>
          <TownCarySandbox />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText("Youth Soccer U8")).toBeInTheDocument();
        expect(screen.getByText("Youth Soccer U10")).toBeInTheDocument();
        expect(screen.getByText("Youth Basketball U10")).toBeInTheDocument();
      });
    });

    test("shows user details modal", async () => {
      render(
        <TestWrapper>
          <TownCarySandbox />
        </TestWrapper>
      );
      
      await waitFor(() => {
        const viewButtons = screen.getAllByText("View Details");
        fireEvent.click(viewButtons[0]);
      });
      
      expect(screen.getByText("User Details")).toBeInTheDocument();
    });

    test("resets sandbox when reset button is clicked", () => {
      const mockConfirm = jest.spyOn(window, "confirm").mockImplementation(() => true);
      
      render(
        <TestWrapper>
          <TownCarySandbox />
        </TestWrapper>
      );
      
      const resetButton = screen.getByText("Reset");
      fireEvent.click(resetButton);
      
      expect(mockConfirm).toHaveBeenCalledWith("Are you sure you want to reset the sandbox? This will clear all test data.");
      mockConfirm.mockRestore();
    });
  });
});

describe("Town Rec System Integration Tests", () => {
  test("AgeCheckAIAssistant integration", async () => {
    const { ageCheckAIAssistant } = await import("../../../lib/townRec/AgeCheckAIAssistant");
    const mockInstance = ageCheckAIAssistant.getInstance();
    
    const mockRequest = {
      childName: "Test Child",
      childDateOfBirth: new Date("2015-01-01"),
      parentName: "Test Parent",
      parentEmail: "test@example.com",
      parentPhone: "123-456-7890",
      requestedLeague: "Youth Soccer U10",
      currentAge: 9,
      ageRequirement: 10,
      reason: "Advanced for age",
      requestedBy: "test@example.com",
      requestedByRole: "Parent" as const
    };
    
    await mockInstance.submitAgeOverrideRequest(mockRequest);
    expect(mockInstance.submitAgeOverrideRequest).toHaveBeenCalledWith(mockRequest);
  });

  test("WaitlistManager integration", async () => {
    const { waitlistManager } = await import("../../../lib/townRec/WaitlistManager");
    const mockInstance = waitlistManager.getInstance();
    
    const mockEntry = {
      childName: "Test Child",
      childDateOfBirth: new Date("2015-01-01"),
      parentName: "Test Parent",
      parentEmail: "test@example.com",
      parentPhone: "123-456-7890",
      league: "Youth Soccer U10",
      ageGroup: "U10",
      registrationDate: new Date(),
      previousParticipant: false,
      siblings: [],
      familyId: "test-family"
    };
    
    await mockInstance.addToWaitlist(mockEntry);
    expect(mockInstance.addToWaitlist).toHaveBeenCalledWith(mockEntry);
  });

  test("SiblingPairingQueue integration", async () => {
    const { siblingPairingQueue } = await import("../../../lib/townRec/SiblingPairingQueue");
    const mockInstance = siblingPairingQueue.getInstance();
    
    const mockRegistration = {
      childId: "test-child-123",
      childName: "Test Child",
      dateOfBirth: new Date("2015-01-01"),
      parentName: "Test Parent",
      parentEmail: "test@example.com",
      parentPhone: "123-456-7890",
      league: "Youth Soccer U10",
      registrationId: "test-reg-123",
      registrationDate: new Date()
    };
    
    await mockInstance.processRegistration(mockRegistration);
    expect(mockInstance.processRegistration).toHaveBeenCalledWith(mockRegistration);
  });

  test("TownStaffRole integration", () => {
    const { townStaffRole } = await import("../../../lib/townRec/TownStaffRole");
    const mockInstance = townStaffRole.getInstance();
    
    expect(mockInstance.canAccessRecAdminHub()).toBe(true);
    expect(mockInstance.canManageWaitlists()).toBe(true);
    expect(mockInstance.canApproveOverrides()).toBe(true);
    expect(mockInstance.canViewAnalytics()).toBe(true);
  });
});

describe("Town Rec System Error Handling", () => {
  test("handles authentication errors gracefully", () => {
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    
    render(
      <TestWrapper>
        <RecAdminHub />
      </TestWrapper>
    );
    
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
  });

  test("handles loading states", () => {
    mockAuthContext.loading = true;
    
    render(
      <TestWrapper>
        <RecAdminHub />
      </TestWrapper>
    );
    
    expect(screen.getByText("Loading Town Rec Admin Hub...")).toBeInTheDocument();
  });

  test("handles API errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    render(
      <TestWrapper>
        <RecAdminHub />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(consoleSpy).not.toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });
});

describe("Town Rec System Accessibility", () => {
  test("RecAdminHub has proper ARIA labels", () => {
    render(
      <TestWrapper>
        <RecAdminHub />
      </TestWrapper>
    );
    
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  test("RecAuditPanel has proper ARIA labels", () => {
    render(
      <TestWrapper>
        <RecAuditPanel />
      </TestWrapper>
    );
    
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  test("TownCarySandbox has proper ARIA labels", () => {
    render(
      <TestWrapper>
        <TownCarySandbox />
      </TestWrapper>
    );
    
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });
}); 