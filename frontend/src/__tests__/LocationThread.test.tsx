import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { FollowLocationButton } from "../components/FollowLocationButton";
import { LocationComposer } from "../components/LocationComposer";
import { LocationPostCard } from "../components/LocationPostCard";
import { PlacesFeedSection } from "../components/PlacesFeedSection";
import { PlaceHeader } from "../components/PlaceHeader";
import { Location, LocationPost } from "../types";

// Mock the useLocations hook
const mockUseLocations = vi.fn();
vi.mock("../hooks/useLocations", () => ({
  useIsFollowingLocation: vi.fn(),
  followLocation: vi.fn(),
  unfollowLocation: vi.fn(),
  createLocationPost: vi.fn(),
  useHomeLocationFeed: vi.fn()
}));

// Mock Firebase
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn()
}));

const mockLocation: Location = {
  id: "test-location",
  name: "Test Basketball Court",
  slug: "test-basketball-court",
  sport: "basketball",
  geo: { lat: 40.7128, lng: -74.0060 },
  address: "123 Test St",
  city: "Test City",
  state: "TS",
  country: "US",
  status: "open",
  moderators: [],
  visibility: "public",
  stats: {
    followers: 10,
    posts: 5,
    lastPostAt: new Date()
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockPost: LocationPost = {
  id: "test-post",
  locationId: "test-location",
  authorId: "author1",
  type: "note",
  text: "Test post content",
  visibility: "place",
  likeCount: 5,
  replyCount: 2,
  reportCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockFeedItem = {
  id: "feed-item-1",
  source: {
    kind: "location" as const,
    locationId: "test-location"
  },
  postRef: "locations/test-location/threads/test-post",
  rank: 100,
  createdAt: new Date()
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe("Location Thread Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("FollowLocationButton", () => {
    it("should render follow button when not following", () => {
      const { useIsFollowingLocation } = await import("../hooks/useLocations");
      useIsFollowingLocation.mockReturnValue({
        isFollowing: false,
        loading: false
      });

      render(
        <TestWrapper>
          <FollowLocationButton
            locationId="test-location"
            userId="user1"
            onFollowChange={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText("Follow")).toBeInTheDocument();
    });

    it("should render following button when following", () => {
      const { useIsFollowingLocation } = await import("../hooks/useLocations");
      useIsFollowingLocation.mockReturnValue({
        isFollowing: true,
        loading: false
      });

      render(
        <TestWrapper>
          <FollowLocationButton
            locationId="test-location"
            userId="user1"
            onFollowChange={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText("Following")).toBeInTheDocument();
    });

    it("should show notification preferences when follow is clicked", async () => {
      const { useIsFollowingLocation } = await import("../hooks/useLocations");
      useIsFollowingLocation.mockReturnValue({
        isFollowing: false,
        loading: false
      });

      render(
        <TestWrapper>
          <FollowLocationButton
            locationId="test-location"
            userId="user1"
            onFollowChange={vi.fn()}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText("Follow"));

      await waitFor(() => {
        expect(screen.getByText("Notification Preferences")).toBeInTheDocument();
        expect(screen.getByText("All Updates")).toBeInTheDocument();
        expect(screen.getByText("Daily Digest")).toBeInTheDocument();
        expect(screen.getByText("Mute")).toBeInTheDocument();
      });
    });

    it("should call followLocation when follow is confirmed", async () => {
      const { useIsFollowingLocation, followLocation } = await import("../hooks/useLocations");
      useIsFollowingLocation.mockReturnValue({
        isFollowing: false,
        loading: false
      });
      followLocation.mockResolvedValue({ success: true });

      const onFollowChange = vi.fn();

      render(
        <TestWrapper>
          <FollowLocationButton
            locationId="test-location"
            userId="user1"
            onFollowChange={onFollowChange}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText("Follow"));
      
      await waitFor(() => {
        expect(screen.getByText("Follow")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Follow"));

      await waitFor(() => {
        expect(followLocation).toHaveBeenCalledWith("test-location", "user1", "all");
        expect(onFollowChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("LocationComposer", () => {
    it("should render post type selector", () => {
      render(
        <TestWrapper>
          <LocationComposer
            locationId="test-location"
            onPostCreated={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText("Note")).toBeInTheDocument();
      expect(screen.getByText("Alert")).toBeInTheDocument();
      expect(screen.getByText("Run")).toBeInTheDocument();
      expect(screen.getByText("Clip")).toBeInTheDocument();
      expect(screen.getByText("Poll")).toBeInTheDocument();
    });

    it("should show poll configuration when poll type is selected", async () => {
      render(
        <TestWrapper>
          <LocationComposer
            locationId="test-location"
            onPostCreated={vi.fn()}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText("Poll"));

      await waitFor(() => {
        expect(screen.getByText("Question")).toBeInTheDocument();
        expect(screen.getByText("Options")).toBeInTheDocument();
      });
    });

    it("should show run configuration when run type is selected", async () => {
      render(
        <TestWrapper>
          <LocationComposer
            locationId="test-location"
            onPostCreated={vi.fn()}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText("Run"));

      await waitFor(() => {
        expect(screen.getByText("Start Time")).toBeInTheDocument();
        expect(screen.getByText("End Time (optional)")).toBeInTheDocument();
        expect(screen.getByText("Level")).toBeInTheDocument();
      });
    });

    it("should create post when form is submitted", async () => {
      const { createLocationPost } = await import("../hooks/useLocations");
      createLocationPost.mockResolvedValue({ success: true, post: mockPost });

      const onPostCreated = vi.fn();

      render(
        <TestWrapper>
          <LocationComposer
            locationId="test-location"
            onPostCreated={onPostCreated}
          />
        </TestWrapper>
      );

      const textarea = screen.getByPlaceholderText("Share a note about this place...");
      fireEvent.change(textarea, { target: { value: "Test post content" } });

      const submitButton = screen.getByText("Post Note");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(createLocationPost).toHaveBeenCalledWith(
          expect.objectContaining({
            locationId: "test-location",
            type: "note",
            text: "Test post content",
            visibility: "place"
          })
        );
        expect(onPostCreated).toHaveBeenCalledWith(mockPost);
      });
    });
  });

  describe("LocationPostCard", () => {
    it("should render post content correctly", () => {
      render(
        <TestWrapper>
          <LocationPostCard
            post={mockPost}
            location={mockLocation}
            onLike={vi.fn()}
            onReport={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText("Test post content")).toBeInTheDocument();
      expect(screen.getByText("Note")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument(); // like count
      expect(screen.getByText("2")).toBeInTheDocument(); // reply count
    });

    it("should show pinned indicator for pinned posts", () => {
      const pinnedPost = { ...mockPost, pinned: true };

      render(
        <TestWrapper>
          <LocationPostCard
            post={pinnedPost}
            location={mockLocation}
            onLike={vi.fn()}
            onReport={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText("📌 Pinned")).toBeInTheDocument();
    });

    it("should render poll content for poll posts", () => {
      const pollPost = {
        ...mockPost,
        type: "poll" as const,
        poll: {
          question: "What time works best?",
          options: ["Morning", "Afternoon", "Evening"],
          closesAt: new Date(Date.now() + 86400000)
        }
      };

      render(
        <TestWrapper>
          <LocationPostCard
            post={pollPost}
            location={mockLocation}
            onLike={vi.fn()}
            onReport={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText("What time works best?")).toBeInTheDocument();
      expect(screen.getByText("Morning")).toBeInTheDocument();
      expect(screen.getByText("Afternoon")).toBeInTheDocument();
      expect(screen.getByText("Evening")).toBeInTheDocument();
    });

    it("should render run details for run posts", () => {
      const runPost = {
        ...mockPost,
        type: "run" as const,
        run: {
          startsAt: new Date(Date.now() + 3600000),
          endsAt: new Date(Date.now() + 7200000),
          level: "open" as const
        }
      };

      render(
        <TestWrapper>
          <LocationPostCard
            post={runPost}
            location={mockLocation}
            onLike={vi.fn()}
            onReport={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText("Run Details")).toBeInTheDocument();
      expect(screen.getByText("Level: open")).toBeInTheDocument();
    });

    it("should call onLike when like button is clicked", () => {
      const onLike = vi.fn();

      render(
        <TestWrapper>
          <LocationPostCard
            post={mockPost}
            location={mockLocation}
            onLike={onLike}
            onReport={vi.fn()}
          />
        </TestWrapper>
      );

      const likeButton = screen.getByText("5").closest("button");
      fireEvent.click(likeButton!);

      expect(onLike).toHaveBeenCalled();
    });

    it("should show actions menu when menu button is clicked", async () => {
      render(
        <TestWrapper>
          <LocationPostCard
            post={mockPost}
            location={mockLocation}
            onLike={vi.fn()}
            onReport={vi.fn()}
          />
        </TestWrapper>
      );

      const menuButton = screen.getByText("⋯");
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText("❤️ Like")).toBeInTheDocument();
        expect(screen.getByText("🚨 Report")).toBeInTheDocument();
      });
    });
  });

  describe("PlacesFeedSection", () => {
    it("should render feed items correctly", () => {
      const { useHomeLocationFeed } = await import("../hooks/useLocations");
      useHomeLocationFeed.mockReturnValue({
        feedItems: [mockFeedItem],
        loading: false,
        hasMore: false,
        loadMore: vi.fn()
      });

      render(
        <TestWrapper>
          <PlacesFeedSection
            userId="user1"
            title="From places you follow"
            maxItems={10}
          />
        </TestWrapper>
      );

      expect(screen.getByText("From places you follow")).toBeInTheDocument();
      expect(screen.getByText("1 update from your followed places")).toBeInTheDocument();
      expect(screen.getByText("Location Update")).toBeInTheDocument();
    });

    it("should show empty state when no feed items", () => {
      const { useHomeLocationFeed } = await import("../hooks/useLocations");
      useHomeLocationFeed.mockReturnValue({
        feedItems: [],
        loading: false,
        hasMore: false,
        loadMore: vi.fn()
      });

      render(
        <TestWrapper>
          <PlacesFeedSection
            userId="user1"
            title="From places you follow"
            maxItems={10}
          />
        </TestWrapper>
      );

      expect(screen.getByText("No places followed yet")).toBeInTheDocument();
      expect(screen.getByText("Follow some places to see their updates here!")).toBeInTheDocument();
    });

    it("should show loading state", () => {
      const { useHomeLocationFeed } = await import("../hooks/useLocations");
      useHomeLocationFeed.mockReturnValue({
        feedItems: [],
        loading: true,
        hasMore: false,
        loadMore: vi.fn()
      });

      render(
        <TestWrapper>
          <PlacesFeedSection
            userId="user1"
            title="From places you follow"
            maxItems={10}
          />
        </TestWrapper>
      );

      expect(screen.getByRole("status")).toBeInTheDocument(); // Loading spinner
    });

    it("should show expand/collapse for items exceeding maxItems", () => {
      const { useHomeLocationFeed } = await import("../hooks/useLocations");
      const manyFeedItems = Array.from({ length: 15 }, (_, i) => ({
        ...mockFeedItem,
        id: `feed-item-${i}`
      }));

      useHomeLocationFeed.mockReturnValue({
        feedItems: manyFeedItems,
        loading: false,
        hasMore: false,
        loadMore: vi.fn()
      });

      render(
        <TestWrapper>
          <PlacesFeedSection
            userId="user1"
            title="From places you follow"
            maxItems={10}
          />
        </TestWrapper>
      );

      expect(screen.getByText("Show 5 More")).toBeInTheDocument();
    });

    it("should call loadMore when load more button is clicked", async () => {
      const { useHomeLocationFeed } = await import("../hooks/useLocations");
      const loadMore = vi.fn();

      useHomeLocationFeed.mockReturnValue({
        feedItems: [mockFeedItem],
        loading: false,
        hasMore: true,
        loadMore
      });

      render(
        <TestWrapper>
          <PlacesFeedSection
            userId="user1"
            title="From places you follow"
            maxItems={10}
          />
        </TestWrapper>
      );

      const loadMoreButton = screen.getByText("Load More Updates");
      fireEvent.click(loadMoreButton);

      expect(loadMore).toHaveBeenCalled();
    });
  });

  describe("PlaceHeader", () => {
    const mockLocation: Location = {
      id: "location-1",
      name: "Test Basketball Court",
      address: "123 Main St",
      city: "Test City",
      state: "CA",
      sport: "basketball",
      status: "open",
      hours: "6 AM - 10 PM",
      amenities: ["lights", "restrooms", "parking"],
      stats: {
        followers: 42,
        posts: 15,
        lastPostAt: new Date("2024-01-15").toISOString()
      },
      moderators: ["user1"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it("renders location information correctly", () => {
      render(
        <TestWrapper>
          <PlaceHeader location={mockLocation} />
        </TestWrapper>
      );
      
      expect(screen.getByText("Test Basketball Court")).toBeInTheDocument();
      expect(screen.getByText("123 Main St")).toBeInTheDocument();
      expect(screen.getByText("Test City, CA")).toBeInTheDocument();
      expect(screen.getByText("6 AM - 10 PM")).toBeInTheDocument();
    });

    it("displays correct sport icon", () => {
      render(
        <TestWrapper>
          <PlaceHeader location={mockLocation} />
        </TestWrapper>
      );
      
      expect(screen.getByText("🏀")).toBeInTheDocument();
    });

    it("displays amenities with icons", () => {
      render(
        <TestWrapper>
          <PlaceHeader location={mockLocation} />
        </TestWrapper>
      );
      
      expect(screen.getByText("Amenities:")).toBeInTheDocument();
      expect(screen.getByText("💡")).toBeInTheDocument();
      expect(screen.getByText("🚻")).toBeInTheDocument();
      expect(screen.getByText("🅿️")).toBeInTheDocument();
    });

    it("displays location stats", () => {
      render(
        <TestWrapper>
          <PlaceHeader location={mockLocation} />
        </TestWrapper>
      );
      
      expect(screen.getByText("Followers:")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("Posts:")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText("Last post:")).toBeInTheDocument();
    });

    it("displays correct status badge for open location", () => {
      render(
        <TestWrapper>
          <PlaceHeader location={mockLocation} />
        </TestWrapper>
      );
      
      const statusBadge = screen.getByText("open");
      expect(statusBadge).toBeInTheDocument();
      expect(screen.getByText("🟢")).toBeInTheDocument();
    });

    it("displays correct status badge for closed location", () => {
      const closedLocation = { ...mockLocation, status: "closed" as const };
      render(
        <TestWrapper>
          <PlaceHeader location={closedLocation} />
        </TestWrapper>
      );
      
      const statusBadge = screen.getByText("closed");
      expect(statusBadge).toBeInTheDocument();
      expect(screen.getByText("🔴")).toBeInTheDocument();
    });

    it("displays correct status badge for limited location", () => {
      const limitedLocation = { ...mockLocation, status: "limited" as const };
      render(
        <TestWrapper>
          <PlaceHeader location={limitedLocation} />
        </TestWrapper>
      );
      
      const statusBadge = screen.getByText("limited");
      expect(statusBadge).toBeInTheDocument();
      expect(screen.getByText("🟡")).toBeInTheDocument();
    });

    it("handles location without amenities", () => {
      const locationWithoutAmenities = { ...mockLocation, amenities: [] };
      render(
        <TestWrapper>
          <PlaceHeader location={locationWithoutAmenities} />
        </TestWrapper>
      );
      
      expect(screen.queryByText("Amenities:")).not.toBeInTheDocument();
    });

    it("handles location without hours", () => {
      const locationWithoutHours = { ...mockLocation, hours: undefined };
      render(
        <TestWrapper>
          <PlaceHeader location={locationWithoutHours} />
        </TestWrapper>
      );
      
      expect(screen.queryByText("6 AM - 10 PM")).not.toBeInTheDocument();
    });

    it("handles location without lastPostAt", () => {
      const locationWithoutLastPost = { 
        ...mockLocation, 
        stats: { ...mockLocation.stats, lastPostAt: undefined }
      };
      render(
        <TestWrapper>
          <PlaceHeader location={locationWithoutLastPost} />
        </TestWrapper>
      );
      
      expect(screen.queryByText("Last post:")).not.toBeInTheDocument();
    });

    it("displays default sport icon for unknown sport", () => {
      const unknownSportLocation = { ...mockLocation, sport: "unknown" };
      render(
        <TestWrapper>
          <PlaceHeader location={unknownSportLocation} />
        </TestWrapper>
      );
      
      expect(screen.getByText("🏟️")).toBeInTheDocument();
    });

    it("displays default status styling for unknown status", () => {
      const unknownStatusLocation = { ...mockLocation, status: "unknown" as any };
      render(
        <TestWrapper>
          <PlaceHeader location={unknownStatusLocation} />
        </TestWrapper>
      );
      
      const statusBadge = screen.getByText("unknown");
      expect(statusBadge).toBeInTheDocument();
    });

    it("formats last post date correctly", () => {
      render(
        <TestWrapper>
          <PlaceHeader location={mockLocation} />
        </TestWrapper>
      );
      
      const lastPostDate = screen.getByText("1/15/2024");
      expect(lastPostDate).toBeInTheDocument();
    });
  });
});

