# 🏟️ Location Threads - SportBeaconAI

## 🎯 Feature Overview

Location Threads allows users to follow places and view live threads of posts, notes, runs, and alerts. Users can engage with location-specific content, follow their favorite places, and receive updates through notifications or daily digests.

### ✨ Key Features

- **Location Following**: Follow/unfollow locations with notification preferences
- **Rich Post Types**: Notes, alerts, run invites, media clips, and polls
- **Smart Feed**: AI-powered ranking algorithm for content discovery
- **Real-time Updates**: Live updates across all connected devices
- **Moderation System**: Community-driven content moderation with admin tools
- **Daily Digests**: Curated summaries for users who prefer batch updates

## 🏗️ Architecture

### Data Model

```
/locations/{id}                    # Location metadata
├── /threads/{postId}             # Location posts
/follows_locations/{followId}      # User-location follows
/users/{uid}/home_location_feed    # Denormalized home feed
```

### Collections

- **`locations`**: Location metadata (name, geo, sport, stats, moderators)
- **`threads`**: Location posts (text, media, polls, runs, alerts)
- **`follows_locations`**: User-location follow relationships
- **`home_location_feed`**: Denormalized posts for home feed
- **`moderationReports`**: Content moderation reports
- **`quarantinedPosts`**: Temporarily hidden content

### Security Rules

- Public read access to locations and public posts
- Authenticated users can create posts
- Authors and moderators can edit/delete posts
- User-scoped home feed access
- Follow documents limited to owner

## 🚀 Getting Started

### Prerequisites

- Firebase project with Firestore enabled
- Node.js 18+ and npm/yarn
- Firebase CLI installed globally

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd sportbeacon-ai

# Install dependencies
npm install

# Set up Firebase
firebase login
firebase use <your-project-id>
```

### 2. Deploy Firestore Rules & Indexes

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### 3. Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:onFollowLocationCreated
firebase deploy --only functions:onLocationPostCreated
firebase deploy --only functions:generateLocationDigest
```

### 4. Seed Test Data

```bash
# Create seed data (Godbold Park + sample posts)
node scripts/seed-location-threads.js seed

# Clean up seed data
node scripts/seed-location-threads.js cleanup

# Reset (cleanup + recreate)
node scripts/seed-location-threads.js reset
```

### 5. Start Development

```bash
# Start Firebase emulators
firebase emulators:start

# Start frontend development server
npm run dev

# Run tests
npm test
```

## 🧪 Testing

### Firestore Rules Testing

```bash
# Install testing dependencies
npm install --save-dev @firebase/rules-unit-testing

# Run rules tests
npm run test:rules
```

### Cloud Functions Testing

```bash
# Run function tests
npm run test:functions

# Test specific function
npm run test:functions -- --grep "followHandlers"
```

### Frontend Testing

```bash
# Run component tests
npm run test:components

# Run hook tests
npm run test:hooks

# Run all tests with coverage
npm run test:coverage
```

## 📱 Frontend Integration

### Hooks

```typescript
import { 
  useLocation, 
  useLocationPosts, 
  useIsFollowingLocation,
  followLocation,
  unfollowLocation 
} from '../hooks/useLocations';

// Get location data
const { location, loading, error } = useLocation(locationId);

// Get location posts
const { posts, loading, hasMore, loadMore } = useLocationPosts(locationId);

// Check follow status
const { isFollowing, loading } = useIsFollowingLocation(locationId, userId);

// Follow/unfollow actions
const handleFollow = async () => {
  const result = await followLocation(locationId, userId, 'all');
  if (result.success) {
    // Handle success
  }
};
```

### Components

```typescript
import { FollowLocationButton } from '../components/FollowLocationButton';
import { LocationComposer } from '../components/LocationComposer';
import { LocationPostCard } from '../components/LocationPostCard';

// Follow button with notification preferences
<FollowLocationButton 
  locationId={locationId}
  userId={userId}
  onFollowChange={handleFollowChange}
/>

// Post composer
<LocationComposer 
  locationId={locationId}
  onPostCreated={handlePostCreated}
/>

// Post display
<LocationPostCard 
  post={post}
  onLike={handleLike}
  onReport={handleReport}
/>
```

## 🔧 Configuration

### Environment Variables

```bash
# Firebase configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id

# Feature flags
VITE_LOCATION_THREADS_ENABLED=true
VITE_MODERATION_ENABLED=true
VITE_DIGEST_ENABLED=true
```

### Ranking Algorithm

```typescript
// Customize post ranking in functions/src/ranking.ts
export const CUSTOM_RANKING_CONFIG: RankingConfig = {
  halfLifeHours: 8,        // Posts lose half their recency score every 8 hours
  likeWeight: 1.5,         // Each like adds 1.5 points
  replyWeight: 3.0,        // Each reply adds 3 points
  reportPenalty: -10,      // Each report subtracts 10 points
  pinnedBonus: 150,        // Pinned posts get 150 point bonus
  typeBonuses: {
    'alert': 75,           // Alerts are very important
    'run': 50,             // Run invites are valuable
    'poll': 30,            // Polls encourage engagement
    'clip': 20,            // Video clips are engaging
    'note': 0              // Regular notes are baseline
  }
};
```

### Moderation Settings

```typescript
// Configure moderation in functions/src/moderation.ts
const REPORT_THRESHOLD = 5;              // Reports before quarantine
const QUARANTINE_DURATION_HOURS = 48;    // Quarantine duration
const MAX_REPORTS_PER_USER = 10;         // Daily report limit
```

## 📊 Monitoring & Analytics

### Cloud Function Logs

```bash
# View function logs
firebase functions:log

# Filter by function
firebase functions:log --only onLocationPostCreated

# View real-time logs
firebase functions:log --tail
```

### Performance Monitoring

```bash
# View function performance
firebase functions:log --only generateLocationDigest --limit 100

# Monitor Firestore usage
firebase firestore:indexes
```

### Analytics Events

The system automatically tracks:

- `location_followed` / `location_unfollowed`
- `location_post_created` with post type
- `post_reported` with reason
- `digest_opened` with location count
- `map_pin_opened` / `follow_from_map`

## 🚨 Troubleshooting

### Common Issues

#### 1. Firestore Index Errors

```bash
# Check required indexes
firebase firestore:indexes

# Create missing indexes manually
firebase firestore:indexes:create
```

#### 2. Function Deployment Failures

```bash
# Check function logs
firebase functions:log --only <function-name>

# Verify dependencies
cd functions && npm install

# Test locally
firebase emulators:start --only functions
```

#### 3. Security Rule Violations

```bash
# Test rules locally
firebase emulators:start --only firestore

# Run rules tests
npm run test:rules
```

### Debug Mode

```typescript
// Enable debug logging in functions
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  logger.info('Debug info:', { data, context });
}
```

## 🔄 Deployment

### Production Deployment

```bash
# Deploy everything
firebase deploy

# Deploy specific components
firebase deploy --only firestore:rules
firebase deploy --only functions
firebase deploy --only hosting
```

### Staging Deployment

```bash
# Use staging project
firebase use staging

# Deploy to staging
firebase deploy

# Switch back to production
firebase use production
```

### Rollback

```bash
# List deployments
firebase hosting:releases

# Rollback to previous version
firebase hosting:rollback <version-id>
```

## 📚 API Reference

### Cloud Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `onFollowLocationCreated` | `follows_locations` created | Handle new follows, backfill feed |
| `onFollowLocationDeleted` | `follows_locations` deleted | Handle unfollows, cleanup feed |
| `onLocationPostCreated` | `threads` created | Fan-out posts to followers |
| `generateLocationDigest` | Scheduled (8 PM UTC) | Generate daily digests |
| `reportPost` | Callable | Report inappropriate content |
| `reviewReportedPost` | Callable | Moderator review actions |

### Firestore Collections

| Collection | Path | Description |
|------------|------|-------------|
| `locations` | `/locations/{id}` | Location metadata and stats |
| `threads` | `/locations/{id}/threads/{postId}` | Location posts and content |
| `follows_locations` | `/follows_locations/{followId}` | User-location relationships |
| `home_location_feed` | `/users/{uid}/home_location_feed/{itemId}` | User's location feed |
| `moderationReports` | `/moderationReports/{reportId}` | Content moderation reports |
| `quarantinedPosts` | `/quarantinedPosts/{id}` | Temporarily hidden content |

### Security Rules

| Collection | Read | Write | Delete |
|------------|------|-------|--------|
| `locations` | Public | Admin/Moderators | Admin only |
| `threads` | Public | Authenticated users | Author/Moderator/Admin |
| `follows_locations` | Owner only | Owner only | Owner only |
| `home_location_feed` | Owner only | System only | System only |

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/location-threads`
3. **Implement** your changes with tests
4. **Run** the test suite: `npm test`
5. **Submit** a pull request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Consistent formatting
- **Tests**: 80%+ coverage required
- **Documentation**: JSDoc for all functions

### Testing Guidelines

- **Unit tests** for all hooks and utilities
- **Integration tests** for Cloud Functions
- **E2E tests** for critical user flows
- **Performance tests** for ranking algorithms

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Chat**: Join our community chat for real-time help

### Reporting Bugs

When reporting bugs, please include:

- **Environment**: OS, Node.js version, Firebase version
- **Steps**: Detailed reproduction steps
- **Expected**: What should happen
- **Actual**: What actually happened
- **Logs**: Relevant error logs and stack traces

### Feature Requests

For feature requests:

- **Use case**: Describe the problem you're solving
- **Proposed solution**: How you'd like it to work
- **Alternatives**: Other approaches you've considered
- **Impact**: Who this would benefit and how

---

**Location Threads** - Making places come alive with community engagement! 🏟️✨
