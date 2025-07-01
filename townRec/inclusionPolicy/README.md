# Town Rec Inclusion & Integrity System

A comprehensive system for managing league policies, gender identity rights, and fair play in recreational sports leagues.

## 🎯 Overview

This system provides a balanced approach to league management that respects individual identity while maintaining game integrity and safety. It includes configurable policies, exception request workflows, admin override capabilities, and comprehensive audit trails.

## 🏗️ Architecture

### Core Components

1. **LeagueCreationModal.tsx** - Admin interface for creating leagues with policy toggles
2. **ExceptionRequestModal.tsx** - User interface for submitting exception requests
3. **AdminLeagueDashboard.tsx** - Admin dashboard for managing pending requests
4. **TownRecIntegrity Module** - Backend logic and automation
5. **Firestore Rules** - Security and access control

### Data Flow

```
User Join Request → Policy Check → Exception Request (if needed) → Admin Review → Override/Audit Trail
```

## 🔧 Features

### 1. League Policy Configuration

**Gender Policy Options:**
- `Open` - No restrictions
- `Birth-Sex Only` - Based on sex assigned at birth
- `Admin Review` - Requires exception request

**Contact Level Settings:**
- `Low` - Minimal contact sports
- `Medium` - Moderate contact
- `High` - High contact sports

**Privacy Features:**
- `Identity Blur` - Hide gender identity in public rosters
- `Auto-Approval` - Automatic processing for eligible players
- `Exception Requests` - Allow players to request exceptions

### 2. Exception Request System

When a user tries to join a league with gender policy mismatch:

1. **Automatic Detection** - System identifies policy conflicts
2. **User Notification** - Clear explanation of the situation
3. **Request Submission** - Structured form with reason field
4. **Admin Review** - Dedicated dashboard for processing
5. **Decision Tracking** - Complete audit trail

### 3. Admin Override System

**Override Capabilities:**
- Grant exceptions for individual players
- Override league policies temporarily
- Maintain audit trail for all decisions

**Command Interface:**
```bash
/cursor tip audit run townrec override <userId> <leagueId> [reason]
```

### 4. Audit & Compliance

**Comprehensive Logging:**
- All exception requests
- Admin decisions and overrides
- Policy changes
- User interactions

**DEI Reporting:**
- Daily automated reports
- Compliance metrics
- Local government integration

## 📊 Database Schema

### Exception Requests
```typescript
interface ExceptionRequest {
  id: string;
  leagueId: string;
  userId: string;
  birthSex: string;
  genderIdentity: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'denied';
  reason?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  leagueName: string;
  leagueTown: string;
  userPreferredName: string;
}
```

### League Overrides
```typescript
interface LeagueOverride {
  id: string;
  leagueId: string;
  userId: string;
  approvedBy: string;
  policyType: 'gender' | 'contact' | 'identity';
  originalAssignment: string;
  overrideAssignment: string;
  decisionDate: Date;
  reason: string;
  auditTrail: AuditEntry[];
}
```

### League Policies
```typescript
interface LeaguePolicy {
  genderPolicy: 'Open' | 'Birth-Sex Only' | 'Admin Review';
  contactLevel: 'Low' | 'Medium' | 'High';
  identityBlur: boolean;
  autoApprovalEnabled: boolean;
  requireExceptionRequests: boolean;
}
```

## 🔐 Security

### Firestore Rules

- **Exception Requests**: Users can only read their own requests
- **League Overrides**: Only admins can create/update overrides
- **Audit Trails**: Immutable logs for compliance
- **Rate Limiting**: Prevents spam exception requests

### Privacy Protection

- **Identity Blur**: Optional hiding of gender identity in public views
- **Admin Access**: Limited to necessary information for decision-making
- **Audit Controls**: Complete trail of who accessed what and when

## 🚀 Usage

### For League Administrators

1. **Create League with Policies**
   ```typescript
   // Use LeagueCreationModal to set up policies
   const policy = {
     genderPolicy: 'Admin Review',
     contactLevel: 'Medium',
     identityBlur: true
   };
   ```

2. **Review Exception Requests**
   ```typescript
   // Access AdminLeagueDashboard to review pending requests
   // Approve/deny with full audit trail
   ```

3. **Override Policies**
   ```bash
   /cursor tip audit run townrec override user123 league456 "Special circumstances"
   ```

### For Players

1. **Join League**
   - System automatically checks eligibility
   - If mismatch detected, exception request modal appears

2. **Submit Exception Request**
   - Provide reason for joining
   - Track request status
   - Receive notification of decision

### For System Administrators

1. **Monitor Compliance**
   - Daily DEI reports
   - Audit trail analysis
   - Policy effectiveness metrics

2. **Configure Global Settings**
   ```typescript
   const config = {
     allowTransBasedOnIdentity: true,
     allowTransBasedOnBirth: true,
     adminOverrideEnabled: true,
     reportingEnabled: true
   };
   ```

## 🧪 Testing

### Unit Tests
```bash
npm test townRec/inclusionPolicy/__tests__/inclusionPolicy.test.ts
```

### Test Coverage
- League creation with policy toggles
- Exception request workflow
- Admin approval/denial process
- Firestore security rules
- Integration flows

## 📈 Analytics & Reporting

### Tracked Events
- Exception request submissions
- Admin decisions
- Policy changes
- User interactions
- Override usage

### DEI Metrics
- Request approval rates
- Processing times
- Policy effectiveness
- Compliance status

## 🔄 Automation

### Scheduled Tasks
- Daily DEI report generation (3 AM)
- Exception request notifications
- Compliance monitoring
- Audit trail maintenance

### AI Integration
- CoachAssistant suggestions for denied requests
- Alternative league recommendations
- Training program suggestions

## 🛡️ Compliance

### Legal Considerations
- Gender identity rights protection
- Fair play maintenance
- Privacy law compliance
- Local government reporting

### Best Practices
- Transparent policy communication
- Consistent decision-making
- Comprehensive documentation
- Regular policy review

## 🚀 Deployment

### Prerequisites
- Firebase project configured
- Admin users set up
- Firestore rules deployed
- Analytics tracking enabled

### Environment Variables
```bash
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
SLACK_BOT_TOKEN=your_slack_token
DEI_WEBHOOK_URL=your_webhook_url
```

### Deployment Steps
1. Deploy Firestore rules
2. Configure admin users
3. Set up scheduled functions
4. Test exception workflows
5. Monitor compliance metrics

## 🤝 Contributing

### Development Guidelines
- Follow TypeScript best practices
- Maintain comprehensive test coverage
- Document all policy decisions
- Respect privacy and inclusion principles

### Code Review Process
- Security review for all changes
- Privacy impact assessment
- Compliance verification
- User experience validation

## 📞 Support

### Documentation
- [API Reference](./API.md)
- [Policy Guidelines](./POLICIES.md)
- [Compliance Checklist](./COMPLIANCE.md)

### Contact
- Technical Issues: [GitHub Issues](https://github.com/TronDurell/sportbeacon-ai/issues)
- Policy Questions: Town Rec Director
- Compliance Concerns: Legal Team

---

**Note**: This system is designed to balance individual rights with fair play. All decisions should be made with respect for both the individual and the integrity of the sport. 