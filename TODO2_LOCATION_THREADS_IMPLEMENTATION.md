# 🏟️ Location Threads Implementation - SportBeaconAI

## 🎯 **Project Overview**
Implement Location Threads feature allowing users to follow places and view live threads of posts, notes, runs, and alerts. This includes backend schema, security rules, fan-out logic, frontend screens, and comprehensive testing.

---

## 📋 **Task Breakdown**

### 🔥 **Phase 1: Data Model & Firestore (Critical Priority)**

#### **Task 1.1: Firestore Models & Converters**
- **Status**: 📋 Todo
- **Priority**: 🔴 Critical
- **Files**: `frontend/src/lib/firestore/models.ts`
- **Description**: Create TypeScript types and Firestore converters for Location, LocationPost, FollowLocation, and HomeFeedItem
- **Acceptance Criteria**:
  - All type definitions match specification exactly
  - Firestore converters handle Timestamp conversions properly
  - Collection path helpers implemented
  - Query utilities for common operations

#### **Task 1.2: Firestore Security Rules**
- **Status**: 📋 Todo
- **Priority**: 🔴 Critical
- **Files**: `firestore.rules`
- **Description**: Implement security rules for locations, threads, follows, and home feeds
- **Acceptance Criteria**:
  - Public read access to locations and public threads
  - Signed-in users can create posts
  - Authors/moderators can edit/delete posts
  - User-scoped home feed access
  - Follow documents limited to owner

#### **Task 1.3: Firestore Indexes**
- **Status**: 📋 Todo
- **Priority**: 🔴 Critical
- **Files**: `firestore.indexes.json`
- **Description**: Create composite indexes for efficient queries
- **Acceptance Criteria**:
  - Location threads by createdAt desc
  - Follows by userId + createdAt
  - Home feed by createdAt desc

---

### ⚡ **Phase 2: Cloud Functions & Backend (High Priority)**

#### **Task 2.1: Ranking Algorithm**
- **Status**: 📋 Todo
- **Priority**: 🟠 High
- **Files**: `functions/src/ranking.ts`
- **Description**: Implement post ranking with recency + engagement scoring
- **Acceptance Criteria**:
  - Half-life decay ~6 hours
  - Logarithmic engagement scoring
  - Configurable parameters

#### **Task 2.2: Follow Handlers**
- **Status**: 📋 Todo
- **Priority**: 🟠 High
- **Files**: `functions/src/followHandlers.ts`
- **Description**: Handle follow/unfollow with feed backfill and cleanup
- **Acceptance Criteria**:
  - Backfill last 25 posts on follow
  - Remove feed items on unfollow
  - Update follower counts
  - Handle notification preferences

#### **Task 2.3: Post Fan-out System**
- **Status**: 📋 Todo
- **Priority**: 🟠 High
- **Files**: `functions/src/postFanout.ts`
- **Description**: Fan-out new posts to followers' feeds with ranking
- **Acceptance Criteria**:
  - Increment location stats
  - Add to all followers' feeds
  - Respect notification preferences
  - Handle batched writes efficiently

#### **Task 2.4: Digest System**
- **Status**: 📋 Todo
- **Priority**: 🟠 High
- **Files**: `functions/src/digest.ts`
- **Description**: Scheduled digest compilation and delivery
- **Acceptance Criteria**:
  - Nightly digest generation
  - Top posts per followed location
  - Batched push notifications
  - User timezone consideration

#### **Task 2.5: Moderation Pipeline**
- **Status**: 📋 Todo
- **Priority**: 🟠 High
- **Files**: `functions/src/moderation.ts`
- **Description**: Basic content moderation and reporting system
- **Acceptance Criteria**:
  - SafeText/Media check stubs
  - Report threshold handling
  - Quarantine functionality
  - Callable report function

---

### 🖼 **Phase 3: Frontend UI & Components (High Priority)**

#### **Task 3.1: Location Profile Screen**
- **Status**: 📋 Todo
- **Priority**: 🟠 High
- **Files**: `frontend/app/(places)/[locationId]/index.tsx`
- **Description**: Main location profile with tabs and thread view
- **Acceptance Criteria**:
  - Thread, Runs, Notes, Media tabs
  - Sticky notes at top
  - Infinite scroll thread list
  - Location header with follow button

#### **Task 3.2: Follow & Feed Components**
- **Status**: 📋 Todo
- **Priority**: 🟠 High
- **Files**: Multiple component files
- **Description**: Core UI components for following and feed display
- **Acceptance Criteria**:
  - FollowLocationButton with toggle
  - PlaceHeader with location info
  - LocationComposer for new posts
  - LocationPostCard for various post types

#### **Task 3.3: Home Feed Integration**
- **Status**: 📋 Todo
- **Priority**: 🟠 High
- **Files**: `frontend/app/home/PlacesFeedSection.tsx`
- **Description**: Integrate location posts into home feed
- **Acceptance Criteria**:
  - "From places you follow" section
  - Real-time updates
  - Proper post ordering
  - Seamless feed integration

#### **Task 3.4: Location Hooks**
- **Status**: 📋 Todo
- **Priority**: 🟠 High
- **Files**: `frontend/src/hooks/useLocations.ts`
- **Description**: Custom hooks for location data management
- **Acceptance Criteria**:
  - useLocation(id) for location data
  - useLocationPosts(id) for thread posts
  - useIsFollowingLocation(id) for follow state
  - follow/unfollow functions

---

### 🧪 **Phase 4: Testing & Quality (Medium Priority)**

#### **Task 4.1: Firestore Rules Testing**
- **Status**: 📋 Todo
- **Priority**: 🟡 Medium
- **Files**: `tests/firestore.rules.test.ts`
- **Description**: Test security rules using @firebase/rules-unit-testing
- **Acceptance Criteria**:
  - Non-author cannot edit/delete posts
  - Non-owner cannot read home feed
  - Follow docs must match auth.uid
  - All security scenarios covered

#### **Task 4.2: Cloud Functions Testing**
- **Status**: 📋 Todo
- **Priority**: 🟡 Medium
- **Files**: `functions/test/*.test.ts`
- **Description**: Unit tests for all Cloud Functions
- **Acceptance Criteria**:
  - Fan-out logic correctness
  - Digest generation accuracy
  - Moderation threshold handling
  - Error handling coverage

#### **Task 4.3: Frontend Component Testing**
- **Status**: 📋 Todo
- **Priority**: 🟡 Medium
- **Files**: `frontend/src/__tests__/LocationThread.test.tsx`
- **Description**: UI tests for location thread functionality
- **Acceptance Criteria**:
  - Follow/unfollow toggle behavior
  - Composer post creation
  - Thread list updates
  - Feed section rendering

---

### 📊 **Phase 5: Analytics & Seed Data (Medium Priority)**

#### **Task 5.1: Analytics Events**
- **Status**: 📋 Todo
- **Priority**: 🟡 Medium
- **Files**: Analytics utility files
- **Description**: Track user interactions and system events
- **Acceptance Criteria**:
  - Location follow/unfollow events
  - Post creation tracking
  - Report and moderation events
  - Digest interaction metrics

#### **Task 5.2: Seed Data & Testing**
- **Status**: 📋 Todo
- **Priority**: 🟡 Medium
- **Files**: Seed scripts and test data
- **Description**: Create test data for Godbold Park and sample posts
- **Acceptance Criteria**:
  - Godbold Park location data
  - Sample thread posts (3-5)
  - Test user accounts
  - End-to-end verification

---

## 🎯 **Implementation Order**

1. **Phase 1**: Data model, rules, and indexes (Foundation)
2. **Phase 2**: Cloud Functions (Backend logic)
3. **Phase 3**: Frontend components (User interface)
4. **Phase 4**: Testing (Quality assurance)
5. **Phase 5**: Analytics and seed data (Final touches)

## ✅ **Acceptance Criteria Summary**

- ✅ Users can view location profiles with Thread, Runs, Notes, Media tabs
- ✅ Follow/unfollow functionality with feed backfill
- ✅ New posts fan-out to followers' home feeds
- ✅ Basic moderation and reporting system
- ✅ Nightly digest for digest users
- ✅ Security rules enforce proper access control
- ✅ Comprehensive test coverage
- ✅ Clean ESLint and TypeScript compilation
- ✅ End-to-end functionality in emulator

## 🚀 **Getting Started**

1. Set up Firebase emulators
2. Implement data models and converters
3. Deploy security rules and indexes
4. Build Cloud Functions with tests
5. Create frontend components
6. Integrate with existing home feed
7. Add analytics and seed data
8. End-to-end testing and validation

---

*This implementation follows SportBeaconAI's existing patterns and integrates seamlessly with the current architecture.*
