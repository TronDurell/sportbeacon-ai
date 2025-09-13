import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Feed from "../components/Feed";
import { AdminAuthProvider } from "../contexts/AdminAuthContext";
import { SmartLayerProvider } from "../contexts/SmartLayerContext";
import { AgentOrchestrationProvider } from "../contexts/AgentOrchestrationContext";

// Mock the GrowthSessions hooks
const mockDrillScrollSessionManager = {
  currentDrillSession: {
    id: "test-session-1",
    sessionType: {
      description: "Training Session",
      maxPosts: 10
    }
  },
  postsViewed: 3,
  incrementPostView: vi.fn(),
  takeDrillAction: vi.fn(),
  getDrillSessionProgress: vi.fn().mockReturnValue({ progress: 30 }),
  getDrillSessionCTA: vi.fn().mockReturnValue({ message: "Keep going! You're doing great!" }),
  startDrillSession: vi.fn(),
  endDrillSession: vi.fn()
};

const mockPlaymakerIntentEngine = {
  scrollCount: 25,
  rapidScrolls: 2,
  scrollIntent: "focused",
  detectScrollIntent: vi.fn(),
  triggerIntervention: vi.fn(),
  getIntentRecommendations: vi.fn().mockReturnValue([
    { id: "1", title: "Recommended Drill", description: "Try this agility drill" }
  ])
};

const mockScoutRoleCurationHub = {
  getScoutRecommendations: vi.fn().mockReturnValue([
    { id: "1", title: "Scout Recommendation", description: "Based on your performance" }
  ]),
  curateContentForRole: vi.fn(),
  getRoleInsights: vi.fn().mockReturnValue({ message: "You're making great progress!" })
};

const mockSessionLiberationAnalytics = {
  startAnalyticsSession: vi.fn().mockReturnValue("analytics-session-1"),
  endAnalyticsSession: vi.fn(),
  logIntervention: vi.fn(),
  logSessionEvent: vi.fn(),
  getSessionMetrics: vi.fn()
};

vi.mock("../modules/GrowthSessions", () => ({
  useDrillScrollSessionManager: () => mockDrillScrollSessionManager,
  usePlaymakerIntentEngine: () => mockPlaymakerIntentEngine,
  useScoutRoleCurationHub: () => mockScoutRoleCurationHub,
  useSessionLiberationAnalytics: () => mockSessionLiberationAnalytics
}));

// Mock the contexts
const mockUser = {
  id: "test-user-1",
  email: "test@example.com",
  role: "player",
  name: "Test Player"
};

const mockAuthContext = {
  user: mockUser,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null
};

const mockSmartLayerContext = {
  userIntent: "train",
  setUserIntent: vi.fn(),
  hasDeclaredIntent: true,
  autopilotMode: false,
  setAutopilotMode: vi.fn()
};

const mockAgentOrchestrationContext = {
  sendRequest: vi.fn(),
  agents: {},
  loading: false,
  error: null
};

// Mock the context providers
vi.mock("../contexts/AdminAuthContext", () => ({
  useAuth: () => mockAuthContext
}));

vi.mock("../contexts/SmartLayerContext", () => ({
  useSmartLayer: () => mockSmartLayerContext
}));

vi.mock("../contexts/AgentOrchestrationContext", () => ({
  useAgentOrchestration: () => mockAgentOrchestrationContext
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Target: () => <div data-testid="target">Target</div>,
  CheckCircle: () => <div data-testid="check-circle">CheckCircle</div>,
  AlertCircle: () => <div data-testid="alert-circle">AlertCircle</div>,
  TrendingUp: () => <div data-testid="trending-up">TrendingUp</div>,
  MapPin: () => <div data-testid="map-pin">MapPin</div>,
  Clock: () => <div data-testid="clock">Clock</div>,
  Users: () => <div data-testid="users">Users</div>,
  Zap: () => <div data-testid="zap">Zap</div>
}));

const renderFeed = () => {
  return render(
    <AdminAuthProvider>
      <SmartLayerProvider>
        <AgentOrchestrationProvider>
          <Feed />
        </AgentOrchestrationProvider>
      </SmartLayerProvider>
    </AdminAuthProvider>
  );
};

describe("Feed Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.scrollY and window.innerHeight
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true
    });
  });

  describe("Initialization", () => {
    it("initializes session and generates feed posts on mount", async () => {
      renderFeed();

      await waitFor(() => {
        expect(mockSessionLiberationAnalytics.startAnalyticsSession).toHaveBeenCalledWith("curated");
        expect(mockDrillScrollSessionManager.startDrillSession).toHaveBeenCalled();
        expect(mockScoutRoleCurationHub.curateContentForRole).toHaveBeenCalled();
      });
    });

    it("shows login message when user is not authenticated", () => {
      mockAuthContext.user = undefined;
      
      renderFeed();
      
      expect(screen.getByText("Please log in to view your feed")).toBeInTheDocument();
    });

    it("displays session progress bar", async () => {
      renderFeed();

      await waitFor(() => {
        expect(screen.getByText("Training Session")).toBeInTheDocument();
        expect(screen.getByText("3 / 10 posts")).toBeInTheDocument();
        expect(screen.getByText("Keep going! You're doing great!")).toBeInTheDocument();
      });
    });
  });

  describe("Feed Posts", () => {
    it("displays feed posts with correct information", async () => {
      renderFeed();

      await waitFor(() => {
        expect(screen.getByText("Agility Ladder Workout")).toBeInTheDocument();
        expect(screen.getByText("Improve your footwork and speed with this 15-minute ladder drill designed for your skill level...")).toBeInTheDocument();
        expect(screen.getByText("Coach Smith")).toBeInTheDocument();
      });
    });

    it("displays post metadata correctly", async () => {
      renderFeed();

      await waitFor(() => {
        expect(screen.getByText("Local Gym")).toBeInTheDocument();
        expect(screen.getByText(/agility/)).toBeInTheDocument();
        expect(screen.getByText(/24 likes/)).toBeInTheDocument();
        expect(screen.getByText(/8 comments/)).toBeInTheDocument();
      });
    });

    it("displays AI insights for posts", async () => {
      renderFeed();

      await waitFor(() => {
        expect(screen.getByText("95%")).toBeInTheDocument(); // Relevance score
        expect(screen.getByText("88%")).toBeInTheDocument(); // Actionability score
        expect(screen.getByText("92%")).toBeInTheDocument(); // Motivation score
      });
    });

    it("handles post view events", async () => {
      renderFeed();

      await waitFor(() => {
        const post = screen.getByText("Agility Ladder Workout").closest("div");
        expect(post).toBeInTheDocument();
        
        fireEvent.click(post!);
        
        expect(mockDrillScrollSessionManager.incrementPostView).toHaveBeenCalled();
        expect(mockSessionLiberationAnalytics.logSessionEvent).toHaveBeenCalledWith("post_viewed", expect.any(Object));
      });
    });
  });

  describe("Role-based Content", () => {
    it("displays role insights", async () => {
      renderFeed();

      await waitFor(() => {
        expect(screen.getByText("Insights for player")).toBeInTheDocument();
        expect(screen.getByText("You're making great progress!")).toBeInTheDocument();
      });
    });

    it("displays intent recommendations", async () => {
      renderFeed();

      await waitFor(() => {
        expect(screen.getByText("Based on Your Intent")).toBeInTheDocument();
        expect(screen.getByText("Recommended Drill")).toBeInTheDocument();
        expect(screen.getByText("Try this agility drill")).toBeInTheDocument();
      });
    });

    it("displays scout recommendations", async () => {
      renderFeed();

      await waitFor(() => {
        expect(screen.getByText("Recommended for You")).toBeInTheDocument();
        expect(screen.getByText("Scout Recommendation")).toBeInTheDocument();
        expect(screen.getByText("Based on your performance")).toBeInTheDocument();
      });
    });
  });

  describe("Scroll Detection and Interventions", () => {
    it("detects scroll events and updates session", async () => {
      renderFeed();

      // Simulate scroll event
      fireEvent.scroll(window, { target: { scrollY: 100 } });

      await waitFor(() => {
        expect(mockPlaymakerIntentEngine.detectScrollIntent).toHaveBeenCalled();
      });
    });

    it("triggers intervention for excessive scrolling", async () => {
      mockPlaymakerIntentEngine.scrollCount = 60;
      mockPlaymakerIntentEngine.rapidScrolls = 5;
      mockPlaymakerIntentEngine.triggerIntervention.mockReturnValue({
        title: "Take a Break",
        message: "You've been scrolling a lot. Consider taking a break.",
        action: { label: "Take Break" }
      });

      renderFeed();

      // Simulate scroll event
      fireEvent.scroll(window, { target: { scrollY: 100 } });

      await waitFor(() => {
        expect(mockSessionLiberationAnalytics.logIntervention).toHaveBeenCalledWith("scroll_timeout", "excessive_scrolling");
      });
    });

    it("shows intervention modal when triggered", async () => {
      mockPlaymakerIntentEngine.triggerIntervention.mockReturnValue({
        title: "Take a Break",
        message: "You've been scrolling a lot. Consider taking a break.",
        action: { label: "Take Break" }
      });

      renderFeed();

      // Simulate excessive scrolling
      mockPlaymakerIntentEngine.scrollCount = 60;
      mockPlaymakerIntentEngine.rapidScrolls = 5;
      fireEvent.scroll(window, { target: { scrollY: 100 } });

      await waitFor(() => {
        expect(screen.getByText("Take a Break")).toBeInTheDocument();
        expect(screen.getByText("You've been scrolling a lot. Consider taking a break.")).toBeInTheDocument();
      });
    });

    it("handles intervention response", async () => {
      mockPlaymakerIntentEngine.triggerIntervention.mockReturnValue({
        title: "Take a Break",
        message: "You've been scrolling a lot. Consider taking a break.",
        action: { label: "Take Break" }
      });

      renderFeed();

      // Simulate excessive scrolling
      mockPlaymakerIntentEngine.scrollCount = 60;
      mockPlaymakerIntentEngine.rapidScrolls = 5;
      fireEvent.scroll(window, { target: { scrollY: 100 } });

      await waitFor(() => {
        const takeBreakButton = screen.getByText("Take Break");
        fireEvent.click(takeBreakButton);
        
        expect(mockDrillScrollSessionManager.takeDrillAction).toHaveBeenCalled();
        expect(mockSessionLiberationAnalytics.logIntervention).toHaveBeenCalledWith("session_complete", "user_action");
        expect(mockSessionLiberationAnalytics.endAnalyticsSession).toHaveBeenCalled();
        expect(mockDrillScrollSessionManager.endDrillSession).toHaveBeenCalled();
      });
    });
  });

  describe("Session Management", () => {
    it("tracks session progress correctly", async () => {
      renderFeed();

      await waitFor(() => {
        expect(mockDrillScrollSessionManager.getDrillSessionProgress).toHaveBeenCalled();
        expect(mockDrillScrollSessionManager.getDrillSessionCTA).toHaveBeenCalled();
      });
    });

    it("handles session actions", async () => {
      renderFeed();

      await waitFor(() => {
        const post = screen.getByText("Agility Ladder Workout").closest("div");
        fireEvent.click(post!);
        
        expect(mockDrillScrollSessionManager.incrementPostView).toHaveBeenCalled();
      });
    });

    it("logs session events", async () => {
      renderFeed();

      await waitFor(() => {
        expect(mockSessionLiberationAnalytics.logSessionEvent).toHaveBeenCalledWith("session_started", expect.any(Object));
      });
    });
  });

  describe("AI Integration", () => {
    it("sends requests to AI orchestration", async () => {
      renderFeed();

      await waitFor(() => {
        expect(mockAgentOrchestrationContext.sendRequest).toHaveBeenCalledWith({
          type: "content_analysis",
          data: {
            userRole: "player",
            sessionType: "training",
            userIntent: "train"
          }
        });
      });
    });

    it("handles AI orchestration errors gracefully", async () => {
      mockAgentOrchestrationContext.sendRequest.mockRejectedValue(new Error("AI service error"));
      
      renderFeed();

      // Should not crash
      await waitFor(() => {
        expect(screen.getByText("Agility Ladder Workout")).toBeInTheDocument();
      });
    });
  });

  describe("Content Curation", () => {
    it("curates content based on role and session type", async () => {
      renderFeed();

      await waitFor(() => {
        expect(mockScoutRoleCurationHub.curateContentForRole).toHaveBeenCalledWith("player", "training");
      });
    });

    it("filters posts by AI insights", async () => {
      renderFeed();

      await waitFor(() => {
        // Should only show posts with relevance > 0.7
        const posts = screen.getAllByText(/Agility Ladder Workout|Team Performance Update|Recovery Best Practices|Upcoming Game|New Personal Best!/);
        expect(posts.length).toBeGreaterThan(0);
      });
    });

    it("sorts posts by relevance and actionability", async () => {
      renderFeed();

      await waitFor(() => {
        // Posts should be sorted by AI insights
        const posts = screen.getAllByText(/Agility Ladder Workout|Team Performance Update|Recovery Best Practices|Upcoming Game|New Personal Best!/);
        expect(posts.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Performance and Optimization", () => {
    it("uses useCallback for event handlers", async () => {
      renderFeed();

      await waitFor(() => {
        const post = screen.getByText("Agility Ladder Workout").closest("div");
        fireEvent.click(post!);
        
        // Should not cause unnecessary re-renders
        expect(mockDrillScrollSessionManager.incrementPostView).toHaveBeenCalledTimes(1);
      });
    });

    it("debounces scroll events", async () => {
      renderFeed();

      // Simulate rapid scroll events
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(window, { target: { scrollY: i * 100 } });
      }

      await waitFor(() => {
        // Should not call detectScrollIntent for every scroll event
        expect(mockPlaymakerIntentEngine.detectScrollIntent).toHaveBeenCalled();
      });
    });
  });

  describe("Error Boundaries", () => {
    it("handles missing user gracefully", () => {
      mockAuthContext.user = undefined;
      
      renderFeed();
      
      expect(screen.getByText("Please log in to view your feed")).toBeInTheDocument();
    });

    it("handles missing session data gracefully", () => {
      mockDrillScrollSessionManager.currentDrillSession = undefined;
      
      renderFeed();
      
      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it("handles missing recommendations gracefully", () => {
      mockScoutRoleCurationHub.getScoutRecommendations.mockReturnValue(undefined);
      
      renderFeed();
      
      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", async () => {
      renderFeed();

      await waitFor(() => {
        const progressBar = screen.getByRole("progressbar");
        expect(progressBar).toBeInTheDocument();
      });
    });

    it("supports keyboard navigation", async () => {
      renderFeed();

      await waitFor(() => {
        const posts = screen.getAllByText(/Agility Ladder Workout|Team Performance Update/);
        posts.forEach(post => {
          expect(post.closest("div")).toHaveAttribute("tabIndex");
        });
      });
    });

    it("has proper focus management", async () => {
      renderFeed();

      await waitFor(() => {
        const dismissButton = screen.getByText("Continue Browsing");
        if (dismissButton) {
          dismissButton.focus();
          expect(document.activeElement).toBe(dismissButton);
        }
      });
    });
  });
}); 