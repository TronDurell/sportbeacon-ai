# AI Range Officer Feature

## Overview

The AI Range Officer is a comprehensive shooting training system integrated into SportBeaconAI, designed for users 21 years and older. It provides intelligent coaching, real-time feedback, and progress tracking for firearm training.

## Features

### 🎯 Drill Lab
- **Drill Presets**: Draw & Fire 1, Controlled Pair, 5x5 Precision, Reload & Re-engage
- **AI Analysis**: TensorFlow Lite + MediaPipe for hand/muzzle position tracking
- **Shot Detection**: Microphone input with SPL threshold detection
- **Scoring**: Stability and aim drift scoring (0-100)
- **Data Storage**: Local and Firestore integration

### ✏️ Drill Editor
- **Custom Drills**: Create personalized training routines
- **Scoring Focus**: Accuracy, speed, or balanced emphasis
- **Custom Feedback**: Personalized voice coaching messages
- **Repetition Control**: Set shot counts and time limits
- **Target Distance**: Configure training distances
- **Active/Inactive Toggle**: Manage drill availability

### 🏆 Range Leaderboard
- **Public Rankings**: Top scores by drill type and region
- **Privacy Controls**: Opt-in leaderboard participation
- **Filtering Options**: Age groups, regions, timeframes
- **Hardware Recognition**: Special badges for device users
- **Real-time Updates**: Live score tracking

### 📤 Share Session Card
- **Visual Cards**: Beautiful session summary cards
- **Export Options**: Save to gallery or share directly
- **Timeline Integration**: Post to SportBeacon feed
- **Shot Analysis**: Detailed performance breakdown
- **Custom Branding**: SportBeaconAI branded cards

### 🧠 Coach Overlay
- **Real-time Feedback**: Visual and voice coaching
- **TFLite Integration**: On-device model processing
- **Voice Alerts**: "Too much movement during trigger press", "Good grip"
- **Color-coded Scores**: Real-time performance indicators
- **TTS Support**: Text-to-speech or preloaded audio files

### 📊 Range Report
- **Session History**: Comprehensive drill summaries
- **Progress Tracking**: Chart.js/Recharts integration
- **Export Options**: Image and PDF export
- **Analytics**: Performance trends and insights

### 📡 BLE Device Manager
- **Hardware Integration**: Mantis X device support
- **Web Bluetooth**: React Native BLE integration
- **Enhanced Scoring**: Device input integration
- **Connection Management**: Automatic device detection

### 🔐 Shooter Verification
- **Age Gate**: 21+ verification system
- **Firestore Storage**: User verification status
- **Access Control**: Route protection
- **Terms & Conditions**: Legal compliance

## Installation

### Prerequisites
- React Native 0.70+
- Expo SDK 49+
- Firebase project configured
- BLE-capable device (for hardware integration)

### Dependencies
```bash
npm install expo-camera expo-av expo-speech expo-media-library
npm install react-native-ble-plx react-native-chart-kit
npm install react-native-view-shot
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native
npm install @mediapipe/camera_utils @mediapipe/hands
npm install lucide-react-native
```

### Firebase Setup
Add the following to your Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Range Officer specific rules
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Custom drills collection
      match /custom_drills/{drillId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    match /range_sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        resource.data.uid == request.auth.uid;
    }
    
    // Leaderboard data (public read, user write)
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null && 
        resource.data.uid == request.auth.uid;
    }
  }
}
```

## Usage

### Basic Integration
```typescript
import RangeOfficerNavigator from './features/range-officer/navigation';

// Add to your main navigation
<Stack.Screen 
  name="RangeOfficer" 
  component={RangeOfficerNavigator}
  options={{ headerShown: false }}
/>
```

### Custom Drill Creation
```typescript
import { createCustomDrill } from './features/range-officer/firebase-schema-extended';

const newDrill = {
  name: 'My Custom Drill',
  repCount: 15,
  scoringFocus: 'accuracy',
  timeLimit: 8000,
  targetDistance: 15,
  customFeedback: ['Focus on breathing', 'Steady aim'],
  isActive: true,
  difficulty: 'advanced',
  category: 'competition'
};

const drillId = await createCustomDrill(userId, newDrill);
```

### Leaderboard Integration
```typescript
import RangeLeaderboard from './features/range-officer/RangeLeaderboard';

// Filter by drill type and region
const leaderboardData = await getLeaderboardEntries({
  drillType: 'precision',
  region: 'North America',
  ageGroup: 1, // 21-30
  timeframe: 'month'
});
```

### Session Sharing
```typescript
import ShareSessionCard from './features/range-officer/ShareSessionCard';

const sessionData = {
  id: 'session-123',
  drillType: 'draw',
  avgScore: 92,
  totalShots: 10,
  date: new Date(),
  scores: [89, 92, 95, 88, 90],
  feedback: ['Good form', 'Excellent control'],
  usedHardware: true
};

<ShareSessionCard 
  session={sessionData}
  onShare={() => console.log('Shared to timeline')}
  onDownload={() => console.log('Saved to gallery')}
/>
```

### Age Verification
```typescript
import { getUserRangeStats } from './features/range-officer/firebase-schema';

const checkAccess = async (userId: string) => {
  const stats = await getUserRangeStats(userId);
  return stats?.isShooterVerified || false;
};
```

### BLE Device Integration
```typescript
import BLEDeviceManager from './features/range-officer/BLEDeviceManager';

const bleManager = new BLEDeviceManager();
await bleManager.initialize();
const devices = await bleManager.startScan();
```

## Architecture

### File Structure
```
features/range-officer/
├── DrillLab.tsx                    # Main drill interface
├── DrillEditor.tsx                 # Custom drill creation
├── RangeLeaderboard.tsx            # Public leaderboard
├── ShareSessionCard.tsx            # Session sharing
├── CoachOverlay.tsx                # Real-time feedback
├── RangeReport.tsx                 # Session history
├── ShooterVerification.tsx         # Age verification
├── BLEDeviceManager.ts             # Hardware integration
├── firebase-schema.ts              # Database schema
├── firebase-schema-extended.ts     # Extended schema
├── navigation.tsx                  # Navigation setup
└── README.md                       # This file
```

### Extended Firestore Schema
```typescript
// Custom drills collection
/users/{uid}/custom_drills/{drillId}
{
  name: string,
  repCount: number,
  scoringFocus: 'accuracy' | 'speed' | 'balance',
  timeLimit?: number,
  targetDistance?: number,
  customFeedback: string[],
  isActive: boolean,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  category: 'defensive' | 'competition' | 'training' | 'custom',
  createdAt: Date,
  updatedAt: Date
}

// Extended range sessions
/range_sessions/{sessionId}
{
  uid: string,
  drillType: string,
  date: Date,
  scores: number[],
  feedback: string[],
  usedHardware: boolean,
  avgScore: number,
  totalShots: number,
  shotDetails: [
    {
      score: number,
      modelConfidence: number,
      muzzleDrift: number,
      userCorrected: boolean,
      timestamp: Date
    }
  ],
  sessionDuration: number,
  location?: { latitude: number, longitude: number },
  weather?: { temperature: number, humidity: number, windSpeed: number },
  equipment?: { firearm: string, ammunition: string, optics?: string },
  coachTip?: string,
  userNotes?: string
}
```

### Data Flow
1. **User Verification** → Age check → Firestore update
2. **Drill Selection** → Camera/mic permissions → Session start
3. **Shot Detection** → AI analysis → Real-time feedback
4. **Session Complete** → Data storage → Progress update
5. **Custom Drills** → User creation → Firestore storage
6. **Leaderboard** → Score aggregation → Public display
7. **Session Sharing** → Card generation → Timeline/export
8. **Report Generation** → Analytics → Export options

## Security & Compliance

### Age Verification
- Strict 21+ age requirement
- Firestore-based verification storage
- Route-level access control
- Audit trail for compliance

### Data Privacy
- Local processing for sensitive data
- Encrypted Firestore storage
- User-controlled data retention
- Opt-in leaderboard participation
- GDPR compliance ready

### Safety Features
- Terms & conditions acceptance
- Safety warnings and disclaimers
- Professional instruction recommendations
- Emergency contact integration

## Testing

### Unit Tests
```bash
npm test __tests__/range-officer/range-officer-expansion.test.ts
```

### E2E Tests
- Age gate enforcement
- Drill scoring accuracy
- BLE device connectivity
- Data persistence
- Custom drill creation
- Leaderboard filtering
- Session sharing

### Test Coverage
- Component rendering
- User interactions
- API integrations
- Error handling
- Data validation
- Privacy controls

## Performance

### Optimization
- TensorFlow Lite for on-device AI
- Efficient BLE communication
- Optimized camera processing
- Memory management
- Image capture optimization

### Benchmarks
- Shot detection: < 100ms latency
- AI analysis: < 200ms processing
- BLE connection: < 5s establishment
- Data sync: < 1s upload
- Card generation: < 2s rendering
- Leaderboard load: < 1s query

## Troubleshooting

### Common Issues
1. **Camera Permissions**: Ensure camera and microphone access
2. **BLE Connection**: Check device compatibility and permissions
3. **Age Verification**: Verify Firestore rules and user data
4. **Performance**: Monitor device resources and memory usage
5. **Custom Drills**: Check Firestore permissions for user collections
6. **Leaderboard**: Verify user opt-in settings
7. **Session Sharing**: Ensure media library permissions

### Debug Mode
```typescript
// Enable debug logging
const DEBUG_MODE = __DEV__;
if (DEBUG_MODE) {
  console.log('Range Officer Debug Mode Active');
}
```

## Roadmap

### Planned Features
- **Advanced Analytics**: Machine learning insights
- **Social Features**: Training groups and challenges
- **Equipment Tracking**: Firearm and gear management
- **Weather Integration**: Environmental factor analysis
- **Video Analysis**: Advanced form correction
- **Competition Mode**: Live scoring and rankings

## Contributing

### Development Guidelines
- Follow TypeScript best practices
- Maintain test coverage > 90%
- Document all public APIs
- Follow security-first approach

### Code Review
- Age verification logic review
- Security compliance check
- Performance impact assessment
- Accessibility validation

## License

This feature is part of SportBeaconAI and follows the same licensing terms. Additional restrictions apply for firearm-related features.

## Support

For technical support or questions about the Range Officer feature:
- Check the troubleshooting section
- Review Firebase configuration
- Verify device compatibility
- Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: June 30, 2024  
**Compatibility**: React Native 0.70+, Expo 49+  
**Security Level**: High (Age-restricted feature) 