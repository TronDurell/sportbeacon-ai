# Firebase Cloud Functions - SportBeaconAI

This directory contains all Firebase Cloud Functions for the SportBeaconAI platform, organized by functionality.

## 📁 Directory Structure

```
functions/
├── src/
│   ├── index.ts              # Main exports and core functions
│   ├── scheduled/            # Scheduled/cron functions
│   ├── triggers/             # Firestore triggers
│   ├── admin/                # Admin-only functions
│   ├── voice/                # Voice call functions
│   ├── notifications/        # Notification functions
│   └── __tests__/            # Test files
├── package.json
└── tsconfig.json
```

## 🚀 Core Functions (index.ts)

### Authentication Functions
- `authLogin` - User login authentication
- `authLogout` - User logout with session cleanup
- `authSession` - Session validation
- `authRefresh` - Token refresh

### Analytics Functions
- `analyticsEvents` - Track user events
- `analyticsMetrics` - Retrieve analytics metrics
- `analyticsSync` - Sync analytics data

### Coach Functions
- `coachAssistant` - AI coach assistant
- `coachFeedback` - Process coach feedback

### AI Functions
- `aiPlayerAnalysis` - AI-powered player analysis
- `aiPoseAnalysis` - Pose analysis for form correction

### Payment Functions
- `stripeCheckout` - Stripe payment processing

### PDF Functions
- `pdfReports` - Generate PDF reports
- `uploadPdf` - Upload PDF documents

### Player Functions
- `getPlayer` - Retrieve player data
- `getPlayerAiAnalysis` - Get AI analysis for player
- `getPlayerVideoClips` - Retrieve player video clips
- `getPlayerDrillHistory` - Get player drill history

### Event Functions
- `getEvents` - Retrieve events
- `getEvent` - Get single event
- `getVenues` - Get venue information

### Content Functions
- `contentAnalyze` - Analyze content
- `contentReport` - Report content

### Assistant Functions
- `assistantTranscribe` - Audio transcription
- `assistantAnalyzePerformance` - Performance analysis
- `assistantSuggestDrills` - Drill suggestions

### Town Rec Functions
- `submitLeague` - Submit new league
- `getWaitlist` - Get waitlist entries
- `processAgeOverride` - Process age override requests
- `processSiblingPairing` - Process sibling pairing requests
- `getAuditLogs` - Retrieve audit logs

### Sharing Functions
- `shareEmail` - Share via email
- `reportsShare` - Share reports

### Video Functions
- `videoInit` - Initialize video upload
- `videoComplete` - Complete video processing
- `videoAnalyze` - Analyze video content

### Utility Functions
- `tipsCreate` - Create tips
- `playerAssessment` - Player assessment
- `emailsSendParentUpdate` - Send parent updates
- `ping` - Health check

## ⏰ Scheduled Functions (scheduled/)

### Daily Functions
- `waitlistDailyScan` - Daily waitlist processing (8:00 AM)
- `parentFollowUpEmails` - Parent follow-up emails (10:00 AM)

### Weekly Functions
- `weeklyDirectorDigest` - Weekly director reports (Monday 9:00 AM)

### Monthly Functions
- `monthlyAnalyticsReport` - Monthly analytics (1st of month 7:00 AM)

## 🔥 Firestore Triggers (triggers/)

### Document Creation Triggers
- `onWaitlistEntryCreated` - Process new waitlist entries
- `onAgeOverrideCreated` - Process age override requests
- `onSiblingPairingCreated` - Process sibling pairing requests
- `onTownStaffSessionCreated` - Track staff sessions
- `onNotificationCreated` - Process notifications
- `onAuditLogCreated` - Validate audit logs

### Document Update Triggers
- `onRegistrationUpdated` - Handle registration changes

## 👑 Admin Functions (admin/)

*All admin functions require Rec Director role*

- `getSystemAnalytics` - Comprehensive system analytics
- `manageStaffPermissions` - Update staff roles and permissions
- `generateCustomReport` - Generate custom reports
- `updateSystemConfig` - Update system configuration
- `performBulkOperation` - Bulk operations on registrations
- `exportData` - Export data for analysis

## 🎤 Voice Functions (voice/)

- `generateVoiceToken` - Generate voice call tokens
- `revokeVoiceToken` - Revoke voice tokens
- `handleVoiceCall` - Process voice call requests
- `callStatusWebhook` - Handle call status webhooks
- `getCallHistory` - Retrieve call history
- `generateAudio` - Generate audio content

## 📢 Notification Functions (notifications/)

- `triggerCoachNotifications` - Trigger coach notifications
- `updateUserActivity` - Track user activity
- `getUserNotificationPreferences` - Get user preferences
- `updateNotificationPreferences` - Update user preferences
- `sendBulkNotifications` - Send bulk notifications
- `getNotificationHistory` - Get notification history

## 🔐 Authentication & Authorization

### Role-Based Access Control
- **Town Staff**: Basic staff functions
- **Rec Coordinator**: Enhanced staff functions
- **Rec Director**: Full administrative access

### Validation Functions
- `validateAuth()` - Basic authentication
- `validateTownStaff()` - Town staff validation
- `validateRecDirector()` - Rec Director validation

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 🚀 Deployment

### Local Development
```bash
npm run serve
```

### Production Deployment
```bash
npm run deploy
```

## 📊 Monitoring

All functions include comprehensive logging and error handling:
- Structured logging with context
- Error tracking and reporting
- Performance monitoring
- Audit trail maintenance

## 🔧 Configuration

Environment variables are managed through Firebase Functions configuration:
```bash
firebase functions:config:set stripe.secret_key="sk_..."
```

## 📝 TODO Items

Each function includes TODO comments for:
- Business logic implementation
- Integration with external services
- Error handling improvements
- Performance optimizations
- Security enhancements

## 🛡️ Security

- All functions validate authentication
- Admin functions require specific roles
- Input validation on all parameters
- Audit logging for sensitive operations
- Rate limiting on public endpoints

## 📈 Performance

- Functions are optimized for cold starts
- Database queries are batched where possible
- Caching strategies for frequently accessed data
- Async/await patterns for non-blocking operations 