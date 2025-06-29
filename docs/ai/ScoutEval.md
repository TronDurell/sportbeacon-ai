# ScoutEval AI Module Documentation

## Overview

ScoutEval is an advanced AI-powered video analysis system that evaluates athlete performance from uploaded videos using MediaPipe Pose detection, movement analysis, and OpenAI insights. The system provides comprehensive skill assessments, performance metrics, and personalized recommendations for athletes, coaches, and parents.

## Features

### Core Capabilities
- **Video Analysis**: Process uploaded videos for pose detection and movement analysis
- **Skill Assessment**: Evaluate sport-specific skills (shooting, dribbling, defense, etc.)
- **Performance Metrics**: Calculate movement efficiency, reaction time, accuracy, and consistency
- **Technique Analysis**: Analyze form, biomechanics, and identify improvement areas
- **AI Insights**: Generate personalized recommendations using OpenAI
- **Notification System**: Send alerts to parents, coaches, and leagues

### Supported Sports
- Basketball (shooting, dribbling, defense)
- Soccer (kicking, running, ball control)
- Tennis (serving, forehand, backhand)
- General movement analysis for other sports

## Architecture

### Components
1. **Video Processing Pipeline**: Downloads, extracts frames, and analyzes poses
2. **MediaPipe Integration**: Pose detection and keypoint extraction
3. **Movement Analysis Engine**: Calculates metrics and patterns
4. **Sport-Specific Analyzers**: Specialized analysis for different sports
5. **AI Insight Generator**: OpenAI-powered recommendations
6. **Notification System**: FCM integration for alerts

### Data Flow
```
Video Upload → Frame Extraction → Pose Detection → Movement Analysis → 
Sport-Specific Analysis → Performance Metrics → AI Insights → Results Compilation → 
Notifications → Storage
```

## API Reference

### Interfaces

#### VideoAnalysis
```typescript
interface VideoAnalysis {
  id: string;
  userId: string;
  videoUrl: string;
  sportType: string;
  analysisType: 'skill' | 'performance' | 'technique' | 'fitness';
  status: 'uploading' | 'processing' | 'analyzed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  results: AnalysisResults;
  metadata: VideoMetadata;
  notifications: NotificationConfig;
}
```

#### AnalysisResults
```typescript
interface AnalysisResults {
  overallScore: number; // 0-100
  skillBreakdown: SkillBreakdown;
  performanceMetrics: PerformanceMetrics;
  techniqueAnalysis: TechniqueAnalysis;
  recommendations: string[];
  improvementAreas: string[];
  strengths: string[];
  aiInsights: string[];
  confidence: number; // 0-1
}
```

#### SkillBreakdown
```typescript
interface SkillBreakdown {
  shooting?: SkillMetric;
  passing?: SkillMetric;
  dribbling?: SkillMetric;
  defense?: SkillMetric;
  speed?: SkillMetric;
  agility?: SkillMetric;
  strength?: SkillMetric;
  endurance?: SkillMetric;
  coordination?: SkillMetric;
  gameSense?: SkillMetric;
}
```

### Methods

#### submitAnalysis(request: AnalysisRequest): Promise<string>
Submit a video for analysis and return the request ID.

**Parameters:**
- `request`: AnalysisRequest object containing video URL, sport type, and notification preferences

**Returns:**
- Promise<string>: Request ID for tracking progress

**Example:**
```typescript
const scoutEval = ScoutEval.getInstance();
const requestId = await scoutEval.submitAnalysis({
  userId: 'user123',
  videoUrl: 'https://example.com/video.mp4',
  sportType: 'basketball',
  analysisType: 'skill',
  notifications: {
    notifyParents: true,
    notifyCoaches: true,
    notifyLeagues: false,
    emailNotifications: true,
    pushNotifications: true
  }
});
```

#### getAnalysisProgress(requestId: string): AnalysisProgress | undefined
Get the current progress of an analysis request.

**Parameters:**
- `requestId`: The analysis request ID

**Returns:**
- AnalysisProgress object or undefined if not found

**Example:**
```typescript
const progress = scoutEval.getAnalysisProgress(requestId);
if (progress) {
  console.log(`Progress: ${progress.progress}% - ${progress.currentStep}`);
}
```

#### getAnalysis(requestId: string): VideoAnalysis | undefined
Get the completed analysis results.

**Parameters:**
- `requestId`: The analysis request ID

**Returns:**
- VideoAnalysis object or undefined if not found

**Example:**
```typescript
const analysis = scoutEval.getAnalysis(requestId);
if (analysis) {
  console.log(`Overall Score: ${analysis.results.overallScore}/100`);
  console.log(`Shooting Score: ${analysis.results.skillBreakdown.shooting?.score}/100`);
}
```

#### getUserAnalyses(userId: string): Promise<VideoAnalysis[]>
Get all analyses for a specific user.

**Parameters:**
- `userId`: The user ID

**Returns:**
- Promise<VideoAnalysis[]>: Array of analysis results

**Example:**
```typescript
const analyses = await scoutEval.getUserAnalyses('user123');
analyses.forEach(analysis => {
  console.log(`${analysis.sportType}: ${analysis.results.overallScore}/100`);
});
```

## Usage Examples

### Basic Video Analysis
```typescript
import { ScoutEval } from '../lib/ai/scoutEval';

// Initialize ScoutEval
const scoutEval = ScoutEval.getInstance();

// Submit video for analysis
const requestId = await scoutEval.submitAnalysis({
  userId: 'athlete123',
  videoUrl: 'https://storage.googleapis.com/videos/basketball-shooting.mp4',
  sportType: 'basketball',
  analysisType: 'skill',
  notifications: {
    notifyParents: true,
    notifyCoaches: true,
    notifyLeagues: false,
    emailNotifications: true,
    pushNotifications: true
  }
});

// Monitor progress
const checkProgress = setInterval(async () => {
  const progress = scoutEval.getAnalysisProgress(requestId);
  if (progress?.status === 'completed') {
    clearInterval(checkProgress);
    
    // Get results
    const analysis = scoutEval.getAnalysis(requestId);
    if (analysis) {
      console.log('Analysis completed!');
      console.log(`Overall Score: ${analysis.results.overallScore}/100`);
      console.log('Recommendations:', analysis.results.recommendations);
    }
  }
}, 5000);
```

### Basketball-Specific Analysis
```typescript
// Submit basketball video
const basketballAnalysis = await scoutEval.submitAnalysis({
  userId: 'player456',
  videoUrl: 'https://example.com/basketball-game.mp4',
  sportType: 'basketball',
  analysisType: 'skill',
  notifications: {
    notifyParents: true,
    notifyCoaches: true,
    notifyLeagues: true,
    emailNotifications: true,
    pushNotifications: true
  }
});

// Wait for completion and analyze results
const analysis = await waitForAnalysis(basketballAnalysis);

if (analysis) {
  // Check shooting form
  const shooting = analysis.results.skillBreakdown.shooting;
  if (shooting) {
    console.log(`Shooting Score: ${shooting.score}/100`);
    console.log('Shooting Observations:', shooting.observations);
    console.log('Shooting Improvements:', shooting.improvements);
    console.log('Recommended Drills:', shooting.drills);
  }
  
  // Check defensive stance
  const defense = analysis.results.skillBreakdown.defense;
  if (defense) {
    console.log(`Defense Score: ${defense.score}/100`);
  }
}
```

### Soccer Analysis
```typescript
const soccerAnalysis = await scoutEval.submitAnalysis({
  userId: 'soccer-player789',
  videoUrl: 'https://example.com/soccer-match.mp4',
  sportType: 'soccer',
  analysisType: 'performance',
  notifications: {
    notifyParents: true,
    notifyCoaches: true,
    notifyLeagues: false,
    emailNotifications: true,
    pushNotifications: true
  }
});

const analysis = await waitForAnalysis(soccerAnalysis);

if (analysis) {
  // Performance metrics
  const metrics = analysis.results.performanceMetrics;
  console.log(`Movement Efficiency: ${(metrics.movementEfficiency * 100).toFixed(1)}%`);
  console.log(`Reaction Time: ${metrics.reactionTime}ms`);
  console.log(`Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
  
  // AI insights
  console.log('AI Insights:', analysis.results.aiInsights);
}
```

## Configuration

### Notification Settings
```typescript
interface NotificationConfig {
  notifyParents: boolean;      // Send notifications to parents
  notifyCoaches: boolean;      // Send notifications to coaches
  notifyLeagues: boolean;      // Send notifications to leagues
  emailNotifications: boolean; // Send email notifications
  pushNotifications: boolean;  // Send push notifications
  customMessage?: string;      // Custom message for notifications
}
```

### Analysis Types
- `skill`: Focus on technical skills and form
- `performance`: Focus on performance metrics and efficiency
- `technique`: Focus on biomechanics and movement patterns
- `fitness`: Focus on fitness and conditioning aspects

## Performance Metrics

### Movement Metrics
- **Total Distance**: Total distance traveled during the video
- **Average Speed**: Average movement speed
- **Balance**: Balance and stability score
- **Coordination**: Movement coordination score

### Performance Indicators
- **Movement Efficiency**: How efficiently the athlete moves
- **Reaction Time**: Response time to stimuli
- **Accuracy**: Precision of movements and actions
- **Consistency**: Consistency of performance
- **Intensity**: Level of effort and intensity
- **Endurance**: Stamina and endurance indicators

### Skill Scores
Each skill is scored from 0-100 with:
- **Score**: Numerical assessment
- **Confidence**: Confidence level in the assessment
- **Observations**: Key observations about the skill
- **Improvements**: Areas for improvement
- **Drills**: Recommended training drills

## Error Handling

### Common Errors
1. **Video Download Failed**: Check video URL accessibility
2. **Frame Extraction Failed**: Ensure video format is supported
3. **Pose Detection Failed**: Video quality may be too low
4. **Analysis Timeout**: Video may be too long or complex

### Error Recovery
```typescript
try {
  const requestId = await scoutEval.submitAnalysis(request);
} catch (error) {
  console.error('Analysis submission failed:', error);
  
  // Retry with different settings
  const retryRequest = { ...request, analysisType: 'performance' };
  const retryId = await scoutEval.submitAnalysis(retryRequest);
}
```

## Integration Examples

### React Component
```typescript
import React, { useState, useEffect } from 'react';
import { ScoutEval } from '../lib/ai/scoutEval';

const VideoAnalysisComponent: React.FC = () => {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<any>(null);

  const submitVideo = async (videoUrl: string) => {
    try {
      const scoutEval = ScoutEval.getInstance();
      const id = await scoutEval.submitAnalysis({
        userId: 'current-user',
        videoUrl,
        sportType: 'basketball',
        analysisType: 'skill',
        notifications: { notifyParents: true, notifyCoaches: true }
      });
      setRequestId(id);
    } catch (error) {
      console.error('Failed to submit video:', error);
    }
  };

  useEffect(() => {
    if (!requestId) return;

    const interval = setInterval(async () => {
      const scoutEval = ScoutEval.getInstance();
      const progressData = scoutEval.getAnalysisProgress(requestId);
      
      if (progressData) {
        setProgress(progressData.progress);
        
        if (progressData.status === 'completed') {
          const analysis = scoutEval.getAnalysis(requestId);
          setResults(analysis);
          clearInterval(interval);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [requestId]);

  return (
    <div>
      <button onClick={() => submitVideo('https://example.com/video.mp4')}>
        Analyze Video
      </button>
      
      {progress > 0 && (
        <div>
          <p>Progress: {progress}%</p>
          <progress value={progress} max="100" />
        </div>
      )}
      
      {results && (
        <div>
          <h3>Analysis Results</h3>
          <p>Overall Score: {results.results.overallScore}/100</p>
          <ul>
            {results.results.recommendations.map((rec: string, i: number) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

### Firebase Integration
```typescript
// Save analysis results to Firestore
const saveAnalysisToFirestore = async (analysis: VideoAnalysis) => {
  try {
    await addDoc(collection(db, 'video_analyses'), {
      ...analysis,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to save analysis:', error);
  }
};

// Listen for new analyses
const unsubscribe = onSnapshot(
  query(collection(db, 'video_analyses'), where('userId', '==', 'current-user')),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const analysis = change.doc.data() as VideoAnalysis;
        console.log('New analysis available:', analysis.id);
      }
    });
  }
);
```

## Best Practices

### Video Quality
- Use high-resolution videos (1080p or higher)
- Ensure good lighting conditions
- Record from multiple angles when possible
- Keep videos under 5 minutes for optimal processing

### Performance Optimization
- Process videos in background threads
- Implement progress tracking for user feedback
- Cache analysis results to avoid reprocessing
- Use compression for video storage

### Security Considerations
- Validate video URLs and file types
- Implement user authentication for analysis access
- Secure storage of analysis results
- Privacy controls for notification settings

## Troubleshooting

### Common Issues

1. **Analysis Stuck in Processing**
   - Check video file size and format
   - Verify network connectivity
   - Restart the analysis with different settings

2. **Low Confidence Scores**
   - Improve video quality and lighting
   - Ensure athlete is clearly visible
   - Use multiple camera angles

3. **Incorrect Sport Detection**
   - Specify sport type explicitly in request
   - Use sport-specific analysis types
   - Provide context in custom instructions

### Debug Mode
```typescript
// Enable debug logging
const scoutEval = ScoutEval.getInstance();
scoutEval.setDebugMode(true);

// Check system status
const status = await scoutEval.getSystemStatus();
console.log('System Status:', status);
```

## Future Enhancements

### Planned Features
- **Real-time Analysis**: Live video streaming analysis
- **Multi-sport Support**: Additional sports and activities
- **Advanced Metrics**: More sophisticated performance indicators
- **Machine Learning**: Improved accuracy through training data
- **Mobile Integration**: Native mobile app support

### API Extensions
- **Batch Processing**: Analyze multiple videos simultaneously
- **Custom Models**: User-defined analysis criteria
- **Export Options**: PDF reports and data export
- **Integration APIs**: Third-party platform integration

## Support

For technical support and questions:
- Email: ai-support@sportbeacon.com
- Documentation: https://docs.sportbeacon.ai/scout-eval
- GitHub Issues: https://github.com/sportbeacon/scout-eval/issues

---

**Audience Tags**: admin, coach, athlete, parent, league  
**Last Updated**: December 2024  
**Version**: 1.0.0 