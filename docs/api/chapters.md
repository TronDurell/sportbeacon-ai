# Chapters API Documentation

## Overview
The Chapters API enables decentralized chapter deployment with automated onboarding and analytics tracking.

## Base URL
```
https://api.sportbeacon.ai/v1/chapters
```

## Authentication
All requests require a valid API key in the header:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Create Chapter
**POST** `/chapters`

Creates a new decentralized chapter with automated deployment.

#### Request Body
```json
{
  "name": "Cary Sports Chapter",
  "location": {
    "city": "Cary",
    "state": "NC",
    "country": "USA",
    "coordinates": [35.7915, -78.7811]
  },
  "contact": {
    "email": "cary@sportbeacon.ai",
    "phone": "+1-555-0123",
    "website": "https://cary.sportbeacon.ai"
  },
  "settings": {
    "autoOnboarding": true,
    "customBranding": true,
    "analyticsEnabled": true
  },
  "features": {
    "coachAgent": true,
    "scoutEval": true,
    "civicIndexer": true,
    "venuePredictor": true
  }
}
```

#### Response
```json
{
  "success": true,
  "chapterId": "chapter-cary-nc-1703123456789",
  "deploymentUrl": "https://cary.sportbeacon.ai",
  "onboardingScript": "#!/bin/bash\n# SportBeaconAI Chapter Onboarding Script...",
  "estimatedDeploymentTime": "5 minutes"
}
```

### Get Chapter Metrics
**GET** `/chapters/{chapterId}/metrics`

Retrieves performance metrics for a specific chapter.

#### Response
```json
{
  "success": true,
  "metrics": {
    "chapterId": "chapter-cary-nc-1703123456789",
    "activeUsers": 1250,
    "totalEvents": 45,
    "revenue": 8500,
    "engagement": {
      "dailyActive": 180,
      "weeklyActive": 450,
      "monthlyActive": 1250
    },
    "performance": {
      "responseTime": 85,
      "uptime": 99.8,
      "errorRate": 0.02
    }
  }
}
```

### Generate Onboarding Script
**GET** `/chapters/{chapterId}/onboarding`

Generates a customized onboarding script for chapter setup.

#### Response
```json
{
  "success": true,
  "script": "#!/bin/bash\n# SportBeaconAI Chapter Onboarding Script...",
  "estimatedTime": "33 minutes",
  "steps": [
    {
      "id": "welcome",
      "title": "Welcome to SportBeaconAI",
      "estimatedTime": 2
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid chapter configuration",
  "details": "Missing required field: name"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Chapter not found",
  "chapterId": "invalid-chapter-id"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Deployment failed",
  "details": "Infrastructure provisioning error"
}
```

## Example Usage

### cURL Examples

#### Create Chapter
```bash
curl -X POST https://api.sportbeacon.ai/v1/chapters \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cary Sports Chapter",
    "location": {
      "city": "Cary",
      "state": "NC",
      "country": "USA"
    },
    "contact": {
      "email": "cary@sportbeacon.ai"
    },
    "settings": {
      "autoOnboarding": true,
      "customBranding": false,
      "analyticsEnabled": true
    },
    "features": {
      "coachAgent": true,
      "scoutEval": true,
      "civicIndexer": false,
      "venuePredictor": false
    }
  }'
```

#### Get Metrics
```bash
curl -X GET https://api.sportbeacon.ai/v1/chapters/chapter-cary-nc-1703123456789/metrics \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### JavaScript Example
```javascript
const createChapter = async (config) => {
  const response = await fetch('https://api.sportbeacon.ai/v1/chapters', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  });
  
  return response.json();
};

const chapterConfig = {
  name: 'Cary Sports Chapter',
  location: { city: 'Cary', state: 'NC', country: 'USA' },
  contact: { email: 'cary@sportbeacon.ai' },
  settings: { autoOnboarding: true, customBranding: false, analyticsEnabled: true },
  features: { coachAgent: true, scoutEval: true, civicIndexer: false, venuePredictor: false }
};

const result = await createChapter(chapterConfig);
console.log('Chapter created:', result.chapterId);
```

## Rate Limits
- **Create Chapter**: 10 requests per hour
- **Get Metrics**: 100 requests per minute
- **Generate Script**: 50 requests per minute

## Webhooks
Chapters API supports webhooks for deployment status updates:

```json
{
  "event": "chapter.deployed",
  "chapterId": "chapter-cary-nc-1703123456789",
  "status": "success",
  "timestamp": "2024-01-01T12:00:00Z",
  "deploymentUrl": "https://cary.sportbeacon.ai"
}
``` 