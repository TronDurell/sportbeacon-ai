# Town Rec Full Deployment - Cary Model

## Overview

The Town Rec Full Deployment transforms SportBeaconAI into a municipal-grade sports administration system specifically designed for the Town of Cary Parks & Recreation Department. This deployment includes comprehensive tools for managing waitlists, age overrides, sibling pairings, and administrative workflows.

## Architecture

### Core Components

1. **RecAdminHub** - Central administrative dashboard
2. **AgeCheckAIAssistant** - Automated age override processing
3. **WaitlistManager** - Intelligent waitlist management
4. **SiblingPairingQueue** - Automated sibling pairing system
5. **TownStaffRole** - Role-based access control
6. **RecAuditPanel** - Comprehensive audit logging
7. **TownCarySandbox** - Testing environment

### Data Flow

```
Registration → WaitlistManager → AgeCheckAIAssistant → SiblingPairingQueue → RecAdminHub
     ↓              ↓                    ↓                    ↓              ↓
RecAuditPanel ← Firestore Triggers ← TownStaffRole ← Analytics ← Notifications
```

## Installation & Setup

### Prerequisites

- Node.js 18+ 
- Firebase project with Firestore enabled
- TypeScript 5.0+
- React 18+

### Environment Variables

Create a `.env` file in the frontend directory:

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Town Rec Configuration
REACT_APP_TOWN_REC_ENABLED=true
REACT_APP_TOWN_REC_SANDBOX_MODE=false
REACT_APP_TOWN_REC_NOTIFICATION_EMAIL=rec.director@cary.gov
REACT_APP_TOWN_REC_MAX_WAITLIST_SIZE=50
REACT_APP_TOWN_REC_AUTO_PROMOTION_ENABLED=true
```

### Firebase Setup

1. **Enable Firestore Database**
   ```bash
   firebase init firestore
   ```

2. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Deploy Functions**
   ```bash
   firebase deploy --only functions
   ```

4. **Initialize Collections**
   ```javascript
   // Run in Firebase Console or via Admin SDK
   const collections = [
     'ageOverrides',
     'waitlists', 
     'siblingPairings',
     'registrations',
     'leagueCapacities',
     'townStaff',
     'townStaffSessions',
     'townStaffAuditLogs',
     'notifications',
     'analytics'
   ];
   ```

### Database Schema

#### Age Overrides Collection
```typescript
interface AgeOverride {
  id: string;
  childName: string;
  parentEmail: string;
  requestedLeague: string;
  currentAge: number;
  ageRequirement: number;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedBy: string;
  approvedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Waitlists Collection
```typescript
interface WaitlistEntry {
  id: string;
  childName: string;
  parentEmail: string;
  league: string;
  waitlistPosition: number;
  priority: 'high' | 'medium' | 'low';
  status: 'waiting' | 'promoted' | 'declined';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Sibling Pairings Collection
```typescript
interface SiblingPairing {
  id: string;
  familyId: string;
  parentEmail: string;
  children: Array<{
    name: string;
    age: number;
    league: string;
    team?: string;
  }>;
  status: 'pending' | 'paired' | 'conflict';
  conflicts?: Array<{
    childId: string;
    issue: string;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Usage Guide

### For Town Staff

#### Accessing RecAdminHub

1. Navigate to `/admin/rec-admin`
2. Authenticate with Town Staff credentials
3. Select appropriate tab for task

#### Managing Waitlists

1. **View Waitlist**
   - Navigate to "Waitlists" tab
   - Review entries by position and priority
   - Use filters to find specific entries

2. **Promote from Waitlist**
   - Click "Promote" button next to entry
   - Confirm promotion
   - System automatically creates registration

3. **Handle Waitlist Responses**
   - Monitor "notified" entries
   - Process parent responses (accept/decline)
   - System reorders waitlist automatically

#### Processing Age Overrides

1. **Review Pending Overrides**
   - Navigate to "Age Overrides" tab
   - Review child details and reason
   - Check policy compliance

2. **Approve/Deny Override**
   - Click "Approve" or "Deny"
   - Add director notes if needed
   - System notifies parent automatically

3. **Auto-Approval Rules**
   - System auto-approves based on policy
   - Age difference within threshold
   - Previous participant status

#### Managing Sibling Pairings

1. **Review Pairing Requests**
   - Navigate to "Sibling Pairing" tab
   - Review family details and conflicts
   - Check league compatibility

2. **Resolve Conflicts**
   - Click "Resolve Conflict"
   - Choose resolution action
   - Assign teams if needed

3. **Auto-Pairing**
   - System automatically pairs compatible siblings
   - Flags conflicts for manual review
   - Maintains team assignments

#### Viewing Analytics

1. **Registration Overview**
   - Navigate to "Analytics" tab
   - View registration counts and trends
   - Monitor league capacity

2. **Waitlist Analytics**
   - Track waitlist movement
   - Monitor promotion rates
   - Analyze response times

3. **Override Analytics**
   - Review approval rates
   - Track processing times
   - Monitor common reasons

### For Rec Directors

#### Audit Trail Access

1. Navigate to `/admin/rec-audit`
2. Review all administrative actions
3. Export audit logs as needed

#### Policy Management

1. **Update Waitlist Policies**
   - Modify promotion rules
   - Adjust notification timeouts
   - Set priority criteria

2. **Update Age Override Policies**
   - Set maximum age differences
   - Configure auto-approval thresholds
   - Define required evidence

3. **Update Sibling Pairing Policies**
   - Set maximum age differences
   - Configure cross-league rules
   - Define team assignment rules

### For Test Users

#### Sandbox Environment

1. Navigate to `/admin/rec-sandbox`
2. Start sandbox environment
3. Execute test scenarios
4. Review test data and metrics

#### Test Scenarios

1. **Waitlist Promotion**
   - Add child to waitlist
   - Promote from waitlist
   - Verify registration creation

2. **Age Override Approval**
   - Submit override request
   - Review and approve
   - Verify registration update

3. **Sibling Pairing**
   - Register multiple siblings
   - Review pairing conflicts
   - Resolve manually

## Configuration

### League Policies

Configure league-specific policies in Firestore:

```javascript
// Example league policy
{
  leagueId: "youth_soccer_u10",
  leagueName: "Youth Soccer U10",
  maxCapacity: 32,
  enableSiblingPairing: true,
  maxAgeDifference: 2,
  allowCrossLeaguePairing: false,
  requireSameTeam: true,
  autoAssignTeam: true,
  manualReviewThreshold: 3
}
```

### Waitlist Policies

```javascript
{
  leagueId: "youth_soccer_u10",
  maxWaitlistSize: 25,
  promotionRules: {
    enableAutoPromotion: true,
    batchSize: 1,
    priorityOrder: ["high", "medium", "low"],
    requireManualApproval: false,
    notificationTimeout: 24
  },
  priorityCriteria: {
    previousParticipant: 5,
    siblingEnrolled: 3,
    earlyRegistration: 2,
    townResident: 1
  }
}
```

### Age Override Policies

```javascript
{
  leagueId: "youth_soccer_u10",
  minAge: 8,
  maxAge: 10,
  allowOverrides: true,
  overrideCriteria: {
    maxAgeDifference: 1,
    requireDirectorApproval: true,
    requireEvidence: true,
    autoApproveThreshold: 0
  },
  directorApprovalRequired: true
}
```

## Security

### Role-Based Access Control

- **RecDirector**: Full access to all features
- **RecCoordinator**: Limited administrative access
- **RecAssistant**: Basic operational access
- **TownStaff**: Read-only access to relevant data

### Firestore Security Rules

The system includes comprehensive Firestore security rules that:
- Restrict access based on user roles
- Validate data integrity
- Prevent unauthorized modifications
- Audit all changes

### Data Privacy

- All personal data is encrypted at rest
- Access logs are maintained for compliance
- Data retention policies are enforced
- GDPR compliance measures implemented

## Monitoring & Analytics

### Key Metrics

1. **Registration Metrics**
   - Total registrations by league
   - Registration completion rates
   - Drop-off analysis

2. **Waitlist Metrics**
   - Waitlist size and movement
   - Promotion rates and times
   - Response rates from parents

3. **Override Metrics**
   - Approval/denial rates
   - Processing times
   - Common reasons for overrides

4. **Sibling Pairing Metrics**
   - Pairing success rates
   - Conflict resolution times
   - Manual review frequency

### Alerting

The system provides alerts for:
- High waitlist volumes
- Pending override requests
- Sibling pairing conflicts
- System errors or failures

## Troubleshooting

### Common Issues

#### Waitlist Not Updating
1. Check Firestore triggers are deployed
2. Verify league capacity settings
3. Review waitlist policies
4. Check for manual holds

#### Age Override Not Processing
1. Verify policy configuration
2. Check director approval requirements
3. Review notification settings
4. Confirm user permissions

#### Sibling Pairing Conflicts
1. Check age difference policies
2. Verify league compatibility
3. Review team assignment rules
4. Confirm manual review thresholds

#### Audit Log Missing
1. Verify audit logging is enabled
2. Check user permissions
3. Review Firestore rules
4. Confirm trigger deployment

### Debug Mode

Enable debug mode by setting:
```bash
REACT_APP_DEBUG_MODE=true
```

This will provide detailed console logging for troubleshooting.

### Support

For technical support:
1. Check the audit logs for error details
2. Review Firestore function logs
3. Contact the development team with error codes
4. Provide reproduction steps for issues

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Firebase project setup complete
- [ ] Firestore rules deployed
- [ ] Functions deployed
- [ ] Collections initialized
- [ ] Test data loaded

### Post-Deployment
- [ ] User accounts created
- [ ] Policies configured
- [ ] Notifications tested
- [ ] Audit logging verified
- [ ] Performance tested
- [ ] Security review completed

### Go-Live
- [ ] Sandbox mode disabled
- [ ] Production data migrated
- [ ] Staff training completed
- [ ] Support procedures established
- [ ] Monitoring alerts configured

## Future Enhancements

### Planned Features
1. **Mobile App Integration**
   - Parent mobile notifications
   - Staff mobile dashboard
   - Offline capability

2. **Advanced Analytics**
   - Predictive waitlist modeling
   - Capacity optimization
   - Trend analysis

3. **Integration APIs**
   - Payment system integration
   - Email marketing integration
   - Calendar system integration

4. **AI Enhancements**
   - Smart waitlist optimization
   - Automated conflict resolution
   - Predictive capacity planning

### Roadmap
- **Q2 2024**: Mobile app development
- **Q3 2024**: Advanced analytics implementation
- **Q4 2024**: API integrations
- **Q1 2025**: AI enhancement rollout

## Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Jest test coverage >80%

### Testing
- Unit tests for all components
- Integration tests for workflows
- E2E tests for critical paths
- Performance testing

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support:
- Email: tech-support@sportbeacon.ai
- Documentation: https://docs.sportbeacon.ai
- Issues: https://github.com/sportbeacon/town-rec/issues 