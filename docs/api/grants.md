# Grants API Documentation

## Overview
The Grants API provides automated grant discovery, application drafting, and deadline tracking for sustainable funding.

## Base URL
```
https://api.sportbeacon.ai/v1/grants
```

## Authentication
All requests require a valid API key in the header:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Find Grants
**POST** `/search`

Discovers grants matching specified criteria.

#### Request Body
```json
{
  "category": "youth_programs",
  "amount": {
    "min": 5000,
    "max": 50000
  },
  "location": {
    "country": "USA",
    "state": "NC"
  },
  "eligibility": {
    "organizationType": ["nonprofit", "school"],
    "focusAreas": ["youth_development", "sports_equipment"],
    "experienceLevel": "established_organization"
  },
  "deadline": {
    "from": "2024-01-01",
    "to": "2024-12-31"
  }
}
```

#### Response
```json
{
  "success": true,
  "grants": [
    {
      "id": "grant-001",
      "title": "Youth Sports Development Initiative",
      "description": "Supporting organizations that develop youth sports programs",
      "amount": {
        "min": 5000,
        "max": 50000,
        "currency": "USD"
      },
      "category": "youth_programs",
      "focusAreas": ["youth_development", "sports_equipment"],
      "eligibility": {
        "organizationTypes": ["nonprofit", "school"],
        "experienceLevel": "established_organization",
        "requirements": ["501(c)(3) status", "2+ years of operation"]
      },
      "deadline": "2024-06-30T23:59:59Z",
      "applicationUrl": "https://example.com/grant-001",
      "contactInfo": {
        "email": "grants@example.com",
        "phone": "+1-555-0123"
      },
      "successRate": 0.15,
      "averageProcessingTime": 90,
      "tags": ["youth", "sports", "development"]
    }
  ],
  "total": 1,
  "filters": {
    "applied": ["category", "amount", "location"],
    "available": ["focusAreas", "experienceLevel"]
  }
}
```

### Generate Application Draft
**POST** `/drafts`

Creates automated grant application drafts.

#### Request Body
```json
{
  "grantId": "grant-001",
  "organizationData": {
    "name": "Cary Youth Sports Foundation",
    "type": "nonprofit",
    "establishedYear": 2020,
    "targetPopulation": "youth ages 6-18",
    "serviceArea": "Cary, NC and surrounding areas",
    "mission": "To provide accessible sports opportunities for all youth",
    "staffCount": 15,
    "annualParticipants": 2500,
    "annualBudget": 750000,
    "previousGrants": [
      {
        "funder": "Local Foundation",
        "amount": 25000,
        "year": 2023,
        "purpose": "Equipment and facility improvements"
      }
    ]
  }
}
```

#### Response
```json
{
  "success": true,
  "draft": {
    "grantId": "grant-001",
    "sections": [
      {
        "id": "organization-overview",
        "title": "Organization Overview",
        "content": "Cary Youth Sports Foundation is a nonprofit organization...",
        "required": true,
        "completed": true,
        "wordLimit": 500,
        "currentWordCount": 450
      },
      {
        "id": "project-description",
        "title": "Project Description",
        "content": "This project aims to expand our youth sports programs...",
        "required": true,
        "completed": false,
        "wordLimit": 1000,
        "currentWordCount": 0
      }
    ],
    "completionPercentage": 25,
    "estimatedTimeToComplete": 120,
    "lastUpdated": "2024-01-01T12:00:00Z",
    "status": "draft"
  }
}
```

### Track Deadlines
**GET** `/deadlines`

Retrieves upcoming grant deadlines.

#### Response
```json
{
  "success": true,
  "deadlines": [
    {
      "grantId": "grant-001",
      "grantTitle": "Youth Sports Development Initiative",
      "deadline": "2024-06-30T23:59:59Z",
      "daysRemaining": 45,
      "priority": "high",
      "userId": "user123"
    }
  ],
  "summary": {
    "total": 5,
    "highPriority": 2,
    "mediumPriority": 2,
    "lowPriority": 1
  }
}
```

### Subscribe to Grant
**POST** `/subscriptions`

Subscribes user to grant updates and deadline alerts.

#### Request Body
```json
{
  "grantId": "grant-001",
  "userId": "user123",
  "alerts": {
    "email": true,
    "sms": false,
    "push": true
  }
}
```

#### Response
```json
{
  "success": true,
  "subscriptionId": "sub-123",
  "grantId": "grant-001",
  "userId": "user123",
  "alerts": {
    "email": true,
    "sms": false,
    "push": true
  },
  "createdAt": "2024-01-01T12:00:00Z"
}
```

### Get Grant Recommendations
**GET** `/recommendations/{userId}`

Provides AI-powered grant recommendations based on organization profile.

#### Response
```json
{
  "success": true,
  "recommendations": [
    {
      "grantId": "grant-001",
      "title": "Youth Sports Development Initiative",
      "matchScore": 0.92,
      "reasons": [
        "Perfect match for youth development focus",
        "Organization meets all eligibility requirements",
        "Grant amount aligns with project needs"
      ],
      "deadline": "2024-06-30T23:59:59Z",
      "estimatedSuccessRate": 0.85
    }
  ],
  "profile": {
    "organizationType": "nonprofit",
    "focusAreas": ["youth_development"],
    "experienceLevel": "established",
    "annualBudget": 750000
  }
}
```

## Grant Categories

| Category | Description |
|----------|-------------|
| youth_programs | Programs focused on youth development |
| sports_development | General sports program development |
| community_health | Health and wellness initiatives |
| technology_innovation | Technology integration in sports |
| education | Educational sports programs |
| social_impact | Community and social impact |
| research | Sports research and studies |
| infrastructure | Facility and infrastructure projects |

## Organization Types

| Type | Description |
|------|-------------|
| nonprofit | 501(c)(3) nonprofit organizations |
| school | Educational institutions |
| university | Higher education institutions |
| government | Government agencies |
| community_organization | Community-based organizations |
| sports_club | Sports clubs and associations |
| youth_center | Youth centers and organizations |

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid search criteria",
  "details": "Amount range must be positive"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Grant not found",
  "grantId": "nonexistent-grant"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

## Example Usage

### cURL Examples

#### Search Grants
```bash
curl -X POST https://api.sportbeacon.ai/v1/grants/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "youth_programs",
    "amount": {
      "min": 5000,
      "max": 50000
    },
    "location": {
      "country": "USA"
    },
    "eligibility": {
      "organizationType": ["nonprofit"],
      "focusAreas": ["youth_development"],
      "experienceLevel": "established_organization"
    }
  }'
```

#### Generate Draft
```bash
curl -X POST https://api.sportbeacon.ai/v1/grants/drafts \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "grantId": "grant-001",
    "organizationData": {
      "name": "Cary Youth Sports Foundation",
      "type": "nonprofit",
      "establishedYear": 2020,
      "targetPopulation": "youth ages 6-18",
      "serviceArea": "Cary, NC",
      "mission": "To provide accessible sports opportunities",
      "staffCount": 15,
      "annualParticipants": 2500
    }
  }'
```

### JavaScript Example
```javascript
class GrantsClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.sportbeacon.ai/v1/grants';
  }

  async searchGrants(criteria) {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(criteria)
    });
    
    return response.json();
  }

  async generateDraft(grantId, organizationData) {
    const response = await fetch(`${this.baseUrl}/drafts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ grantId, organizationData })
    });
    
    return response.json();
  }

  async subscribeToGrant(grantId, userId, alerts = {}) {
    const response = await fetch(`${this.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ grantId, userId, alerts })
    });
    
    return response.json();
  }
}

// Usage
const grants = new GrantsClient('YOUR_API_KEY');

// Search for grants
const searchResults = await grants.searchGrants({
  category: 'youth_programs',
  amount: { min: 5000, max: 50000 },
  location: { country: 'USA' }
});

console.log('Found grants:', searchResults.grants.length);

// Generate application draft
const draft = await grants.generateDraft('grant-001', {
  name: 'Cary Youth Sports Foundation',
  type: 'nonprofit',
  establishedYear: 2020
});

console.log('Draft completion:', draft.draft.completionPercentage + '%');
```

## Rate Limits
- **Search**: 100 requests per minute
- **Draft Generation**: 20 requests per minute
- **Subscriptions**: 50 requests per minute
- **Deadlines**: 200 requests per minute

## Webhooks
Grants API supports webhooks for deadline alerts and status updates:

```json
{
  "event": "deadline.reminder",
  "grantId": "grant-001",
  "userId": "user123",
  "daysRemaining": 7,
  "priority": "high",
  "timestamp": "2024-01-01T12:00:00Z"
}
``` 