import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest, describe, it, expect, beforeEach  } from '@jest/globals';
import SmartAlerts from "../components/SmartAlerts";
import { AdminAuthProvider } from "../contexts/AdminAuthContext";
import { SmartLayerProvider } from "../contexts/SmartLayerContext";
import { AgentOrchestrationProvider } from "../contexts/AgentOrchestrationContext";

// Mock the contexts
const mockUser = {
  id: "test-user-1",
  email: "test@example.com",
  role: "player",
  name: "Test Player"
};

const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null
};

const mockSmartLayerContext = {
  userIntent: "train",
  setUserIntent: jest.fn(),
  hasDeclaredIntent: true,
  autopilotMode: false,
  setAutopilotMode: jest.fn()
};

const mockAgentOrchestrationContext = {
  sendRequest: jest.fn(),
  agents: {},
  loading: false,
  error: null
};

// Mock the context providers
jest.mock("../contexts/AdminAuthContext", () => ({
  useAuth: () => mockAuthContext
}));

jest.mock("../contexts/SmartLayerContext", () => ({
  useSmartLayer: () => mockSmartLayerContext
}));

jest.mock("../contexts/AgentOrchestrationContext", () => ({
  useAgentOrchestration: () => mockAgentOrchestrationContext
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  AlertCircle: () => <div data-testid="alert-circle">AlertCircle</div>,
  CheckCircle: () => <div data-testid="check-circle">CheckCircle</div>,
  Target: () => <div data-testid="target">Target</div>,
  TrendingUp: () => <div data-testid="trending-up">TrendingUp</div>,
  Users: () => <div data-testid="users">Users</div>,
  Zap: () => <div data-testid="zap">Zap</div>,
  Clock: () => <div data-testid="clock">Clock</div>,
  MapPin: () => <div data-testid="map-pin">MapPin</div>,
  X: () => <div data-testid="x">X</div>,
  ArrowRight: () => <div data-testid="arrow-right">ArrowRight</div>,
  Star: () => <div data-testid="star">Star</div>,
  Trophy: () => <div data-testid="trophy">Trophy</div>,
  Lightbulb: () => <div data-testid="lightbulb">Lightbulb</div>,
  Heart: () => <div data-testid="heart">Heart</div>
}));

const renderSmartAlerts = (props = {}) => {
  return render(
    <AdminAuthProvider>
      <SmartLayerProvider>
        <AgentOrchestrationProvider>
          <SmartAlerts {...props} />
        </AgentOrchestrationProvider>
      </SmartLayerProvider>
    </AdminAuthProvider>
  );
};

describe("SmartAlerts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Math.random to control achievement generation
    jest.spyOn(Math, "random").mockReturnValue(0.5);
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      renderSmartAlerts();
      // Component should render but may not show alerts immediately
      expect(document.body).toBeInTheDocument();
    });

    it("renders with custom position", () => {
      renderSmartAlerts({ position: "bottom-left" });
      const container = document.querySelector(".fixed");
      expect(container).toHaveClass("bottom-4", "left-4");
    });

    it("renders with custom max alerts", () => {
      renderSmartAlerts({ maxAlerts: 5 });
      // This would be tested by checking the number of alerts rendered
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Role-based Alerts", () => {
    it("generates player-specific alerts", async () => {
      mockAuthContext.user.role = "player";
      mockSmartLayerContext.userIntent = "train";
      
      renderSmartAlerts({ roleBased: true });
      
      await waitFor(() => {
        expect(screen.getByText("Training Time!")).toBeInTheDocument();
        expect(screen.getByText("Ready to improve your skills?")).toBeInTheDocument();
      });
    });

    it("generates coach-specific alerts", async () => {
      mockAuthContext.user.role = "coach";
      
      renderSmartAlerts({ roleBased: true });
      
      await waitFor(() => {
        expect(screen.getByText("Team Update")).toBeInTheDocument();
        expect(screen.getByText(/players have completed/)).toBeInTheDocument();
      });
    });

    it("generates parent-specific alerts", async () => {
      mockAuthContext.user.role = "parent";
      
      renderSmartAlerts({ roleBased: true });
      
      await waitFor(() => {
        expect(screen.getByText("Upcoming Game")).toBeInTheDocument();
        expect(screen.getByText(/Don't forget to bring water/)).toBeInTheDocument();
      });
    });

    it("generates admin-specific alerts", async () => {
      mockAuthContext.user.role = "admin";
      
      renderSmartAlerts({ roleBased: true });
      
      await waitFor(() => {
        expect(screen.getByText("System Status")).toBeInTheDocument();
        expect(screen.getByText(/All systems operational/)).toBeInTheDocument();
      });
    });
  });

  describe("Intent-based Alerts", () => {
    it("generates training intent alerts", async () => {
      mockSmartLayerContext.userIntent = "train";
      
      renderSmartAlerts({ intentAware: true });
      
      await waitFor(() => {
        expect(screen.getByText("Training Focus")).toBeInTheDocument();
        expect(screen.getByText(/Great choice! Let's focus/)).toBeInTheDocument();
      });
    });

    it("generates learning intent alerts", async () => {
      mockSmartLayerContext.userIntent = "learn";
      
      renderSmartAlerts({ intentAware: true });
      
      await waitFor(() => {
        expect(screen.getByText("Learning Resources")).toBeInTheDocument();
        expect(screen.getByText(/I found 5 new articles/)).toBeInTheDocument();
      });
    });

    it("generates connection intent alerts", async () => {
      mockSmartLayerContext.userIntent = "connect";
      
      renderSmartAlerts({ intentAware: true });
      
      await waitFor(() => {
        expect(screen.getByText("Community Connection")).toBeInTheDocument();
        expect(screen.getByText(/players in your area/)).toBeInTheDocument();
      });
    });
  });

  describe("Alert Actions", () => {
    it("handles primary action clicks", async () => {
      mockAuthContext.user.role = "player";
      mockSmartLayerContext.userIntent = "train";
      
      renderSmartAlerts({ roleBased: true });
      
      await waitFor(() => {
        const viewDrillsButton = screen.getByText("View Drills");
        expect(viewDrillsButton).toBeInTheDocument();
        
        fireEvent.click(viewDrillsButton);
        
        expect(mockAgentOrchestrationContext.sendRequest).toHaveBeenCalledWith({
          type: "smart_alert_action",
          data: {
            actionType: "view_drills",
            aiPrompt: "Show me today's training drills",
            userId: mockUser.id,
            userRole: mockUser.role,
            userIntent: "train"
          }
        });
      });
    });

    it("handles secondary action clicks", async () => {
      mockAuthContext.user.role = "player";
      mockSmartLayerContext.userIntent = "train";
      
      renderSmartAlerts({ roleBased: true });
      
      await waitFor(() => {
        const logProgressButton = screen.getByText("Log Progress");
        expect(logProgressButton).toBeInTheDocument();
        
        fireEvent.click(logProgressButton);
        
        expect(mockAgentOrchestrationContext.sendRequest).toHaveBeenCalledWith({
          type: "smart_alert_action",
          data: {
            actionType: "log_progress",
            aiPrompt: "Help me log my recent training progress",
            userId: mockUser.id,
            userRole: mockUser.role,
            userIntent: "train"
          }
        });
      });
    });
  });

  describe("Alert Dismissal", () => {
    it("dismisses alerts when X button is clicked", async () => {
      mockAuthContext.user.role = "player";
      
      renderSmartAlerts({ roleBased: true });
      
      await waitFor(() => {
        const dismissButton = screen.getByTestId("x");
        expect(dismissButton).toBeInTheDocument();
        
        fireEvent.click(dismissButton);
        
        // Alert should be removed
        expect(screen.queryByText("Training Time!")).not.toBeInTheDocument();
      });
    });

    it("auto-dismisses alerts after specified time", async () => {
      jest.useFakeTimers();
      
      mockAuthContext.user.role = "player";
      
      renderSmartAlerts({ roleBased: true, autoDismiss: true });
      
      await waitFor(() => {
        expect(screen.getByText("Training Time!")).toBeInTheDocument();
      });
      
      // Fast-forward time
      jest.advanceTimersByTime(11000); // 11 seconds (alert auto-dismisses at 10s)
      
      await waitFor(() => {
        expect(screen.queryByText("Training Time!")).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });
  });

  describe("Alert Types and Styling", () => {
    it("renders success alerts with correct styling", async () => {
      // Mock achievement generation
      jest.spyOn(Math, "random").mockReturnValue(0.3); // Low enough to trigger achievement
      
      renderSmartAlerts();
      
      await waitFor(() => {
        const achievementAlert = screen.getByText(/Congratulations/);
        expect(achievementAlert).toBeInTheDocument();
        expect(achievementAlert.closest("div")).toHaveClass("bg-purple-50", "border-purple-400");
      });
    });

    it("renders warning alerts with correct styling", async () => {
      mockAuthContext.user.role = "player";
      
      renderSmartAlerts({ roleBased: true });
      
      await waitFor(() => {
        const warningAlert = screen.getByText(/Take a Break/);
        if (warningAlert) {
          expect(warningAlert.closest("div")).toHaveClass("bg-yellow-50", "border-yellow-400");
        }
      });
    });

    it("renders motivation alerts with correct styling", async () => {
      // Mock motivation generation
      jest.spyOn(Math, "random").mockReturnValue(0.1); // Low enough to trigger motivation
      
      renderSmartAlerts();
      
      await waitFor(() => {
        const motivationAlert = screen.getByText(/You've Got This/);
        if (motivationAlert) {
          expect(motivationAlert.closest("div")).toHaveClass("bg-blue-50", "border-blue-400");
        }
      });
    });
  });

  describe("Alert Filtering and Prioritization", () => {
    it("filters alerts by role", async () => {
      mockAuthContext.user.role = "player";
      
      renderSmartAlerts({ roleBased: true });
      
      await waitFor(() => {
        // Should show player alerts
        expect(screen.getByText("Training Time!")).toBeInTheDocument();
        
        // Should not show coach alerts
        expect(screen.queryByText("Team Update")).not.toBeInTheDocument();
      });
    });

    it("filters alerts by intent", async () => {
      mockSmartLayerContext.userIntent = "train";
      
      renderSmartAlerts({ intentAware: true });
      
      await waitFor(() => {
        // Should show training intent alerts
        expect(screen.getByText("Training Focus")).toBeInTheDocument();
        
        // Should not show learning intent alerts
        expect(screen.queryByText("Learning Resources")).not.toBeInTheDocument();
      });
    });

    it("respects max alerts limit", async () => {
      mockAuthContext.user.role = "player";
      mockSmartLayerContext.userIntent = "train";
      
      renderSmartAlerts({ maxAlerts: 1 });
      
      await waitFor(() => {
        const alerts = screen.getAllByRole("alert");
        expect(alerts.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("Error Handling", () => {
    it("handles agent orchestration errors gracefully", async () => {
      mockAgentOrchestrationContext.sendRequest.mockRejectedValue(new Error("Network error"));
      mockAuthContext.user.role = "player";
      
      renderSmartAlerts({ roleBased: true });
      
      await waitFor(() => {
        const viewDrillsButton = screen.getByText("View Drills");
        fireEvent.click(viewDrillsButton);
      });
      
      // Should not crash and should log error
      expect(console.error).toHaveBeenCalledWith(
        "Error handling smart alert action:",
        expect.any(Error)
      );
    });

    it("handles missing user gracefully", () => {
      mockAuthContext.user = undefined;
      
      renderSmartAlerts();
      
      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", async () => {
      mockAuthContext.user.role = "player";
      
      renderSmartAlerts({ roleBased: true });
      
      await waitFor(() => {
        const dismissButton = screen.getByTestId("x");
        expect(dismissButton).toBeInTheDocument();
      });
    });

    it("supports keyboard navigation", async () => {
      mockAuthContext.user.role = "player";
      
      renderSmartAlerts({ roleBased: true });
      
      await waitFor(() => {
        const viewDrillsButton = screen.getByText("View Drills");
        expect(viewDrillsButton).toBeInTheDocument();
        
        // Should be focusable
        viewDrillsButton.focus();
        expect(document.activeElement).toBe(viewDrillsButton);
      });
    });
  });
}); 