# 🔧 Firebase Function Validation Prompt

## **Precision Fix Prompt for Firebase Functions**

```
Scan this file for all callable functions using TodoFixMe, any, or unvalidated data input.
For each function:

Add schema-based validation using TypeScript
Sanitize input
Validate UUIDs
Wrap in try/catch with proper error messages
Refactor unsafe access or casting
Show all changes inline. Add TODO if any part needs manual validation schema design.
```

## **Implementation Guide**

### **Step 1: Identify Functions to Validate**

**Priority 1 - High Security Risk:**
- `getPlayerVideoClips` - Video data validation, user permissions
- `getPlayerDrillHistory` - Player ID validation, date range sanitization  
- `videoAnalyze` - Video file validation, analysis parameters
- `videoComplete` - Video processing validation, status updates

**Priority 2 - Medium Security Risk:**
- `getEvent` - Event ID validation, access control
- `submitLeague` - League data validation, admin permissions
- `authLogin` - Credential validation, rate limiting
- `authRegister` - User data validation, email verification
- `stripeCheckout` - Payment data validation, amount verification

**Priority 3 - Lower Security Risk:**
- `getEvents` - Query parameters validation, pagination
- `getVenues` - Location validation, access control
- `contentAnalyze` - Content validation, analysis limits
- `contentReport` - Report parameters validation

### **Step 2: Validation Schema Templates**

#### **Player Data Validation Schema:**
```typescript
interface PlayerValidationSchema {
  playerId: { required: true, type: 'uuid' };
  includeVideos?: { required: false, type: 'boolean' };
  includeAnalytics?: { required: false, type: 'boolean' };
  limit?: { required: false, type: 'number', min: 1, max: 100 };
  offset?: { required: false, type: 'number', min: 0 };
}
```

#### **Video Processing Validation Schema:**
```typescript
interface VideoValidationSchema {
  videoId: { required: true, type: 'uuid' };
  analysisType: { required: true, enum: ['pose', 'performance', 'technique'] };
  parameters?: { required: false, type: 'object' };
  priority?: { required: false, enum: ['low', 'medium', 'high'] };
}
```

#### **League Data Validation Schema:**
```typescript
interface LeagueValidationSchema {
  name: { required: true, type: 'string', minLength: 1, maxLength: 100 };
  sport: { required: true, enum: ['soccer', 'basketball', 'baseball', 'football'] };
  ageGroup: { required: true, enum: ['u6', 'u8', 'u10', 'u12', 'u14', 'u16', 'u18'] };
  maxTeams: { required: true, type: 'number', min: 1, max: 1000 };
  maxPlayersPerTeam: { required: true, type: 'number', min: 1, max: 100 };
}
```

### **Step 3: Implementation Pattern**

#### **Before (Unsafe):**
```typescript
export const getPlayerVideoClips = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    const playerId = (data as TodoFixMe)?.playerId;
    return {success: true, message: "Video clips retrieved", data: {playerId}};
  } catch (err) {
    logger.error("Get player video clips error", err);
    return {success: false, message: "Get player video clips failed", error: err};
  }
});
```

#### **After (Safe):**
```typescript
export const getPlayerVideoClips = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { playerId, includeVideos, includeAnalytics, limit, offset } = data as {
      playerId?: string;
      includeVideos?: boolean;
      includeAnalytics?: boolean;
      limit?: number;
      offset?: number;
    };
    
    // Validate required fields
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(playerId)) {
      throw new Error('Invalid player ID format');
    }
    
    // Validate optional fields
    if (includeVideos !== undefined && typeof includeVideos !== 'boolean') {
      throw new Error('includeVideos must be a boolean');
    }
    
    if (includeAnalytics !== undefined && typeof includeAnalytics !== 'boolean') {
      throw new Error('includeAnalytics must be a boolean');
    }
    
    if (limit !== undefined) {
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        throw new Error('Limit must be a number between 1 and 100');
      }
    }
    
    if (offset !== undefined) {
      if (typeof offset !== 'number' || offset < 0) {
        throw new Error('Offset must be a non-negative number');
      }
    }
    
    // TODO: Add user permission check to ensure user can access this player's data
    // TODO: Add rate limiting for video clip requests
    
    return {success: true, message: "Video clips retrieved", data: {playerId}};
  } catch (err) {
    logger.error("Get player video clips error", err);
    return {success: false, message: "Get player video clips failed", error: err};
  }
});
```

### **Step 4: Error Handling Patterns**

#### **Standard Error Response:**
```typescript
interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
}
```

#### **Error Handling Function:**
```typescript
function handleValidationError(error: Error, field?: string): ApiResponse {
  const validationError: ValidationError = {
    field: field || 'unknown',
    message: error.message,
    code: 'VALIDATION_ERROR'
  };
  
  return {
    success: false,
    message: 'Validation failed',
    errors: [validationError]
  };
}
```

### **Step 5: UUID Validation Utility**

```typescript
function validateUUID(uuid: string, fieldName: string): void {
  if (!uuid || typeof uuid !== 'string') {
    throw new Error(`${fieldName} is required and must be a string`);
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new Error(`Invalid ${fieldName} format`);
  }
}
```

### **Step 6: Rate Limiting Implementation**

```typescript
import { getFirestore } from 'firebase-admin/firestore';

async function checkRateLimit(userId: string, action: string, limit: number, windowMs: number): Promise<boolean> {
  const db = getFirestore();
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const rateLimitRef = db.collection('rateLimits').doc(`${userId}_${action}`);
  
  try {
    const doc = await rateLimitRef.get();
    
    if (!doc.exists) {
      await rateLimitRef.set({
        count: 1,
        windowStart: now,
        lastRequest: now
      });
      return true;
    }
    
    const data = doc.data()!;
    
    if (data.windowStart < windowStart) {
      // Reset window
      await rateLimitRef.update({
        count: 1,
        windowStart: now,
        lastRequest: now
      });
      return true;
    }
    
    if (data.count >= limit) {
      return false; // Rate limit exceeded
    }
    
    await rateLimitRef.update({
      count: data.count + 1,
      lastRequest: now
    });
    
    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Allow request if rate limiting fails
  }
}
```

### **Step 7: Permission Checking**

```typescript
async function checkPlayerAccess(userId: string, playerId: string): Promise<boolean> {
  const db = getFirestore();
  
  // Check if user is admin
  const userDoc = await db.collection('users').doc(userId).get();
  if (userDoc.exists && userDoc.data()?.role === 'admin') {
    return true;
  }
  
  // Check if user is the player's coach
  const playerDoc = await db.collection('players').doc(playerId).get();
  if (playerDoc.exists && playerDoc.data()?.coachId === userId) {
    return true;
  }
  
  // Check if user is the player's parent
  if (playerDoc.exists && playerDoc.data()?.parentId === userId) {
    return true;
  }
  
  return false;
}
```

### **Step 8: Complete Function Template**

```typescript
export const functionName = onCall(async (data, context) => {
  try {
    // 1. Authentication check
    await validateAuth(context);
    const userId = context.auth?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // 2. Input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    // 3. Extract and validate specific fields
    const { field1, field2 } = data as {
      field1?: string;
      field2?: number;
    };
    
    // 4. Required field validation
    if (!field1 || typeof field1 !== 'string') {
      throw new Error('Field1 is required and must be a string');
    }
    
    // 5. UUID validation (if applicable)
    validateUUID(field1, 'field1');
    
    // 6. Optional field validation
    if (field2 !== undefined) {
      if (typeof field2 !== 'number' || field2 < 0) {
        throw new Error('Field2 must be a non-negative number');
      }
    }
    
    // 7. Rate limiting
    const rateLimitOk = await checkRateLimit(userId, 'functionName', 10, 60000);
    if (!rateLimitOk) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // 8. Permission checking (if applicable)
    // const hasPermission = await checkPermission(userId, resourceId);
    // if (!hasPermission) {
    //   throw new Error('Access denied');
    // }
    
    // 9. Business logic
    const result = await performBusinessLogic(field1, field2);
    
    // 10. Success response
    return {
      success: true,
      message: "Operation completed successfully",
      data: result
    };
    
  } catch (error) {
    // 11. Error handling
    logger.error("FunctionName error", error);
    
    if (error instanceof Error) {
      return {
        success: false,
        message: error.message,
        error: 'FUNCTION_ERROR'
      };
    }
    
    return {
      success: false,
      message: "An unexpected error occurred",
      error: 'UNKNOWN_ERROR'
    };
  }
});
```

### **Step 9: Validation Schema Registry**

```typescript
// TODO: Create centralized validation schema registry
const VALIDATION_SCHEMAS = {
  player: {
    playerId: { required: true, type: 'uuid' },
    includeVideos: { required: false, type: 'boolean' },
    includeAnalytics: { required: false, type: 'boolean' },
    limit: { required: false, type: 'number', min: 1, max: 100 },
    offset: { required: false, type: 'number', min: 0 }
  },
  video: {
    videoId: { required: true, type: 'uuid' },
    analysisType: { required: true, enum: ['pose', 'performance', 'technique'] },
    parameters: { required: false, type: 'object' },
    priority: { required: false, enum: ['low', 'medium', 'high'] }
  },
  league: {
    name: { required: true, type: 'string', minLength: 1, maxLength: 100 },
    sport: { required: true, enum: ['soccer', 'basketball', 'baseball', 'football'] },
    ageGroup: { required: true, enum: ['u6', 'u8', 'u10', 'u12', 'u14', 'u16', 'u18'] },
    maxTeams: { required: true, type: 'number', min: 1, max: 1000 },
    maxPlayersPerTeam: { required: true, type: 'number', min: 1, max: 100 }
  }
};
```

### **Step 10: Automated Validation Function**

```typescript
// TODO: Implement automated schema validation
function validateAgainstSchema(data: any, schema: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    if (rules.required && (value === undefined || value === null)) {
      errors.push({
        field,
        message: `${field} is required`,
        code: 'REQUIRED_FIELD'
      });
      continue;
    }
    
    if (value !== undefined && value !== null) {
      // Type validation
      if (rules.type === 'uuid') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          errors.push({
            field,
            message: `Invalid ${field} format`,
            code: 'INVALID_FORMAT'
          });
        }
      }
      
      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({
          field,
          message: `${field} must be one of: ${rules.enum.join(', ')}`,
          code: 'INVALID_ENUM'
        });
      }
      
      // Range validation
      if (rules.min !== undefined && value < rules.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.min}`,
          code: 'MIN_VALUE'
        });
      }
      
      if (rules.max !== undefined && value > rules.max) {
        errors.push({
          field,
          message: `${field} must be no more than ${rules.max}`,
          code: 'MAX_VALUE'
        });
      }
    }
  }
  
  return errors;
}
```

## **Usage Instructions**

1. **Apply the prompt to `functions/src/index.ts`**
2. **For each function, implement the validation pattern**
3. **Add TODO comments for manual validation schema design**
4. **Test each function with valid and invalid inputs**
5. **Update error handling and logging**

## **Success Criteria**

- ✅ All functions have input validation
- ✅ UUIDs are properly validated
- ✅ Error messages are user-friendly
- ✅ Rate limiting is implemented
- ✅ Permission checking is in place
- ✅ No unsafe type casting
- ✅ Comprehensive error handling 