# ScoutEval API Documentation

## Overview

The ScoutEval API provides comprehensive video analysis for sports performance evaluation using AI-powered computer vision and natural language processing.

## Base URL

```
https://sportbeacon-ai.vercel.app/api/scout-eval
```

## Authentication

All API requests require Firebase authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

## Endpoints

### 1. Submit Video Analysis

**POST** `/submit`

Submit a video for AI-powered sports analysis.

#### Request Body

```json
{
  "userId": "string",
  "videoUrl": "string",
  "sportType": "basketball|football|soccer|tennis|baseball|volleyball",
  "analysisType": "skill|performance|technique|fitness|footwork|form|stance",
  "notifications": {
    "notifyParents": true,
    "notifyCoaches": true,
    "notifyLeagues": false,
    "emailNotifications": true,
    "pushNotifications": true,
    "customMessage": "Optional custom message",
    "autoShare": false
  },
  "customInstructions": "Optional custom analysis instructions"
}
```

#### Response

```json
{
  "success": true,
  "requestId": "analysis_123456789",
  "status": "uploading",
  "estimatedTime": 120,
  "message": "Video analysis submitted successfully"
}
```

#### cURL Example

```bash
curl -X POST https://sportbeacon-ai.vercel.app/api/scout-eval/submit \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "videoUrl": "https://example.com/video.mp4",
    "sportType": "basketball",
    "analysisType": "skill",
    "notifications": {
      "notifyParents": true,
      "notifyCoaches": true,
      "notifyLeagues": false,
      "emailNotifications": true,
      "pushNotifications": true,
      "autoShare": false
    }
  }'
```

#### Postman Example

```json
{
  "method": "POST",
  "url": "https://sportbeacon-ai.vercel.app/api/scout-eval/submit",
  "headers": {
    "Authorization": "Bearer YOUR_FIREBASE_TOKEN",
    "Content-Type": "application/json"
  },
  "body": {
    "mode": "raw",
    "raw": "{\n  \"userId\": \"user123\",\n  \"videoUrl\": \"https://example.com/video.mp4\",\n  \"sportType\": \"basketball\",\n  \"analysisType\": \"skill\",\n  \"notifications\": {\n    \"notifyParents\": true,\n    \"notifyCoaches\": true,\n    \"notifyLeagues\": false,\n    \"emailNotifications\": true,\n    \"pushNotifications\": true,\n    \"autoShare\": false\n  }\n}"
  }
}
```

### 2. Get Analysis Progress

**GET** `/progress/{requestId}`

Get the current progress of a video analysis.

#### Response

```json
{
  "success": true,
  "progress": {
    "requestId": "analysis_123456789",
    "status": "processing",
    "progress": 65,
    "currentStep": "MediaPipe pose analysis",
    "estimatedTimeRemaining": 45,
    "error": null
  }
}
```

#### cURL Example

```bash
curl -X GET https://sportbeacon-ai.vercel.app/api/scout-eval/progress/analysis_123456789 \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### 3. Get Analysis Results

**GET** `/results/{requestId}`

Retrieve the completed analysis results.

#### Response

```json
{
  "success": true,
  "analysis": {
    "id": "analysis_123456789",
    "userId": "user123",
    "videoUrl": "https://example.com/video.mp4",
    "sportType": "basketball",
    "analysisType": "skill",
    "status": "analyzed",
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:32:15Z",
    "results": {
      "overallScore": 85,
      "skillBreakdown": {
        "shooting": {
          "score": 88,
          "confidence": 0.92,
          "observations": ["Excellent form", "Good follow-through"],
          "improvements": ["Increase range", "Work on off-hand"],
          "drills": ["Form shooting", "Range extension"]
        },
        "passing": {
          "score": 82,
          "confidence": 0.89,
          "observations": ["Good court vision", "Accurate passes"],
          "improvements": ["Faster decision making"],
          "drills": ["Passing under pressure"]
        }
      },
      "performanceMetrics": {
        "movementEfficiency": 0.87,
        "reactionTime": 180,
        "accuracy": 0.85,
        "consistency": 0.82,
        "intensity": 0.90,
        "endurance": 0.78
      },
      "techniqueAnalysis": {
        "form": "excellent",
        "biomechanics": ["Proper knee bend", "Good arm extension"],
        "efficiency": 0.88,
        "riskFactors": ["Slight over-rotation on jump shots"],
        "corrections": ["Focus on balanced landing"]
      },
      "recommendations": [
        "Continue working on shooting range",
        "Improve decision-making speed",
        "Add plyometric training"
      ],
      "improvementAreas": [
        "Reaction time",
        "Off-hand skills",
        "Endurance"
      ],
      "strengths": [
        "Excellent shooting form",
        "Good court vision",
        "Strong fundamentals"
      ],
      "aiInsights": [
        "Shows natural basketball IQ",
        "Excellent work ethic evident",
        "High potential for growth"
      ],
      "confidence": 0.91
    },
    "metadata": {
      "duration": 45.2,
      "frameRate": 30,
      "resolution": "1920x1080",
      "fileSize": 15728640,
      "format": "mp4",
      "uploadTime": "2024-01-15T10:30:00Z",
      "processingTime": 135,
      "bitrate": 2800000,
      "codec": "h264"
    },
    "classification": {
      "sportType": "basketball",
      "skillLevel": "intermediate",
      "trainingType": "individual",
      "environment": "indoor",
      "equipment": ["basketball", "hoop"],
      "participants": 1,
      "duration": 45,
      "quality": "high",
      "confidence": 0.95
    },
    "mediaPipeData": {
      "footwork": {
        "agility": 85,
        "speed": 82,
        "balance": 88,
        "coordination": 90,
        "footSpeed": 3.2,
        "directionChanges": 12,
        "acceleration": 2.8,
        "deceleration": 2.5,
        "observations": ["Quick lateral movement", "Good balance"],
        "improvements": ["Increase acceleration", "Better deceleration"]
      },
      "form": {
        "posture": 90,
        "alignment": 88,
        "technique": 85,
        "efficiency": 87,
        "biomechanics": ["Proper knee bend", "Good arm extension"],
        "corrections": ["Slight over-rotation"],
        "riskFactors": ["Potential for knee strain"],
        "formScore": 87
      },
      "stance": {
        "stability": 88,
        "balance": 90,
        "positioning": 85,
        "readiness": 87,
        "stanceType": "athletic",
        "observations": ["Good defensive stance", "Ready position"],
        "recommendations": ["Maintain lower stance"]
      },
      "movement": {
        "totalDistance": 45.2,
        "averageSpeed": 1.2,
        "maxSpeed": 3.8,
        "movementEfficiency": 0.87,
        "reactionTime": 180,
        "coordination": 88,
        "patterns": [
          {
            "type": "linear",
            "frequency": 0.4,
            "efficiency": 0.88,
            "description": "Forward movement pattern"
          },
          {
            "type": "lateral",
            "frequency": 0.3,
            "efficiency": 0.85,
            "description": "Side-to-side movement"
          }
        ]
      },
      "keypoints": [
        {
          "frameNumber": 1,
          "timestamp": 0,
          "keypoints": [
            {
              "x": 320,
              "y": 240,
              "confidence": 0.95,
              "name": "nose"
            }
          ],
          "confidence": 0.92
        }
      ],
      "confidence": 0.91,
      "processingTime": 135
    },
    "openAISummary": {
      "strengths": [
        "Excellent shooting mechanics",
        "Good court awareness",
        "Strong fundamental skills"
      ],
      "weaknesses": [
        "Could improve reaction time",
        "Needs work on off-hand",
        "Endurance could be better"
      ],
      "recommendations": [
        "Focus on plyometric training",
        "Practice off-hand dribbling",
        "Add cardio conditioning"
      ],
      "overallAssessment": "This athlete shows strong potential with excellent fundamentals. The shooting form is particularly impressive, and there's good court awareness. Areas for improvement include reaction time and off-hand skills.",
      "technicalFeedback": "The shooting mechanics are sound with proper follow-through and good balance. The footwork shows good coordination and the stance is athletic and ready.",
      "mentalAspects": "Shows good decision-making and appears to have strong basketball IQ. Could benefit from faster processing under pressure.",
      "nextSteps": [
        "Continue skill development",
        "Add strength training",
        "Practice game situations"
      ],
      "confidence": 0.89,
      "wordCount": 245
    },
    "athleteProfile": {
      "scoutScore": 85,
      "skillBreakdown": {
        "footwork": 88,
        "form": 87,
        "stance": 88,
        "overall": 85
      },
      "improvementAreas": [
        "Reaction time",
        "Off-hand skills",
        "Endurance"
      ],
      "strengths": [
        "Shooting form",
        "Court vision",
        "Fundamentals"
      ],
      "recommendations": [
        "Plyometric training",
        "Off-hand practice",
        "Cardio conditioning"
      ],
      "lastUpdated": "2024-01-15T10:32:15Z",
      "analysisCount": 5
    }
  }
}
```

#### cURL Example

```bash
curl -X GET https://sportbeacon-ai.vercel.app/api/scout-eval/results/analysis_123456789 \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### 4. Get User Analyses

**GET** `/user/{userId}`

Get all analyses for a specific user.

#### Query Parameters

- `limit` (optional): Number of results to return (default: 10, max: 50)
- `offset` (optional): Number of results to skip (default: 0)
- `status` (optional): Filter by status (uploading, processing, analyzed, failed)

#### Response

```json
{
  "success": true,
  "analyses": [
    {
      "id": "analysis_123456789",
      "userId": "user123",
      "sportType": "basketball",
      "analysisType": "skill",
      "status": "analyzed",
      "createdAt": "2024-01-15T10:30:00Z",
      "results": {
        "overallScore": 85
      }
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### cURL Example

```bash
curl -X GET "https://sportbeacon-ai.vercel.app/api/scout-eval/user/user123?limit=5&status=analyzed" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### 5. Toggle Auto-Share

**PUT** `/auto-share/{userId}`

Toggle auto-sharing of analysis results.

#### Request Body

```json
{
  "enabled": true
}
```

#### Response

```json
{
  "success": true,
  "autoShare": true,
  "message": "Auto-share setting updated successfully"
}
```

#### cURL Example

```bash
curl -X PUT https://sportbeacon-ai.vercel.app/api/scout-eval/auto-share/user123 \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Invalid request parameters",
  "details": {
    "field": "videoUrl",
    "message": "Video URL is required"
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Authentication required",
  "message": "Valid Firebase ID token required"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Analysis not found",
  "message": "Analysis with ID 'analysis_123456789' not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred during processing"
}
```

## Rate Limits

- **Submit Analysis**: 5 requests per minute per user
- **Get Progress**: 30 requests per minute per user
- **Get Results**: 60 requests per minute per user
- **Get User Analyses**: 30 requests per minute per user

## Supported Video Formats

- **Formats**: MP4, MOV, AVI, WebM
- **Max File Size**: 100MB
- **Max Duration**: 10 minutes
- **Resolution**: 720p minimum, 4K maximum
- **Frame Rate**: 24-60 fps

## Processing Times

Typical processing times by video length:

- **0-30 seconds**: 30-60 seconds
- **30-60 seconds**: 60-120 seconds
- **1-3 minutes**: 2-5 minutes
- **3-5 minutes**: 5-10 minutes
- **5-10 minutes**: 10-20 minutes

## Webhook Support

Configure webhooks to receive real-time updates when analysis is complete:

```json
{
  "webhookUrl": "https://your-app.com/webhooks/scout-eval",
  "events": ["analysis.completed", "analysis.failed"]
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { ScoutEvalAPI } from '@sportbeacon/scout-eval';

const api = new ScoutEvalAPI(firebaseToken);

// Submit analysis
const result = await api.submitAnalysis({
  userId: 'user123',
  videoUrl: 'https://example.com/video.mp4',
  sportType: 'basketball',
  analysisType: 'skill'
});

// Get results
const analysis = await api.getResults(result.requestId);
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {firebase_token}',
    'Content-Type': 'application/json'
}

# Submit analysis
response = requests.post(
    'https://sportbeacon-ai.vercel.app/api/scout-eval/submit',
    headers=headers,
    json={
        'userId': 'user123',
        'videoUrl': 'https://example.com/video.mp4',
        'sportType': 'basketball',
        'analysisType': 'skill'
    }
)

# Get results
results = requests.get(
    f'https://sportbeacon-ai.vercel.app/api/scout-eval/results/{request_id}',
    headers=headers
)
```

## Support

For API support and questions:

- **Email**: api-support@sportbeacon.ai
- **Documentation**: https://docs.sportbeacon.ai
- **Status Page**: https://status.sportbeacon.ai 