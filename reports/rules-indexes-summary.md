# Firestore Rules & Indexes Summary

**Date:** January 8, 2025  
**Version:** MVP Location Threads  

## 🔒 Firestore Security Rules

### Overview
- **File:** `firestore.rules`
- **Size:** 675 lines
- **Version:** 2.0
- **Coverage:** Complete security rules for all collections

### Key Security Features
- ✅ Public read access to locations and thread posts
- ✅ Authenticated users can create posts
- ✅ Only authors and moderators can edit/delete posts
- ✅ Follow documents are user-scoped (userId must match request.auth.uid)
- ✅ Home feed is private to each user
- ✅ Team visibility posts are denied until team private feature is shipped

### Collections Covered
- `/locations/{id}` - Public read, admin create, moderator/admin update/delete
- `/locations/{id}/threads/{postId}` - Public read, auth create, author/moderator update/delete
- `/follows_locations/{id}` - User-scoped (userId must match auth.uid)
- `/home_location_feed/{userId}` - Private to each user
- `/users/{id}` - User can read/update own profile, admins can read all
- `/teams/{id}` - Team members can read, coaches can update
- `/leagues/{id}` - Public read, admin create/update/delete
- `/games/{id}` - Public read, admin create/update/delete
- `/players/{id}` - Team members can read, coaches can update
- `/registrations/{id}` - Parent can read own, admin can read/update all
- `/payments/{id}` - User can read own, admin can read all
- `/siblingRequests/{id}` - Parent can read own, admin can read/update all
- `/ageOverrideRequests/{id}` - Parent can read own, admin can read/update all
- `/waitlist/{id}` - Public read, admin create/update/delete
- `/analytics/{id}` - User can read own, admin can read all
- `/auditLogs/{id}` - Admin only
- `/messages/{id}` - Sender/recipient can read, sender can update/delete
- `/facilities/{id}` - Public read, admin create/update/delete

## 📊 Firestore Indexes

### Overview
- **File:** `firestore.indexes.json`
- **Total Indexes:** 35 composite indexes
- **MVP Scope:** 7-8 indexes for Location Threads feature

### Location Threads MVP Indexes
1. **Threads by Location + Pinned + CreatedAt**
   ```json
   {
     "collectionGroup": "threads",
     "fields": [
       { "fieldPath": "locationId", "order": "ASCENDING" },
       { "fieldPath": "pinned", "order": "DESCENDING" },
       { "fieldPath": "createdAt", "order": "DESCENDING" }
     ]
   }
   ```

2. **Threads by Location + Type + CreatedAt**
   ```json
   {
     "collectionGroup": "threads",
     "fields": [
       { "fieldPath": "locationId", "order": "ASCENDING" },
       { "fieldPath": "type", "order": "ASCENDING" },
       { "fieldPath": "createdAt", "order": "DESCENDING" }
     ]
   }
   ```

3. **Threads by Location + Visibility + CreatedAt**
   ```json
   {
     "collectionGroup": "threads",
     "fields": [
       { "fieldPath": "locationId", "order": "ASCENDING" },
       { "fieldPath": "visibility", "order": "ASCENDING" },
       { "fieldPath": "createdAt", "order": "DESCENDING" }
     ]
   }
   ```

4. **Follows by User + CreatedAt**
   ```json
   {
     "collectionGroup": "follows_locations",
     "fields": [
       { "fieldPath": "userId", "order": "ASCENDING" },
       { "fieldPath": "createdAt", "order": "DESCENDING" }
     ]
   }
   ```

5. **Follows by Location + CreatedAt**
   ```json
   {
     "collectionGroup": "follows_locations",
     "fields": [
       { "fieldPath": "locationId", "order": "ASCENDING" },
       { "fieldPath": "createdAt", "order": "DESCENDING" }
     ]
   }
   ```

6. **Home Feed by CreatedAt**
   ```json
   {
     "collectionGroup": "home_location_feed",
     "fields": [
       { "fieldPath": "createdAt", "order": "DESCENDING" }
     ]
   }
   ```

7. **Threads by Location + Author + CreatedAt**
   ```json
   {
     "collectionGroup": "threads",
     "fields": [
       { "fieldPath": "locationId", "order": "ASCENDING" },
       { "fieldPath": "authorId", "order": "ASCENDING" },
       { "fieldPath": "createdAt", "order": "DESCENDING" }
     ]
   }
   ```

8. **Follows by User + Location**
   ```json
   {
     "collectionGroup": "follows_locations",
     "fields": [
       { "fieldPath": "userId", "order": "ASCENDING" },
       { "fieldPath": "locationId", "order": "ASCENDING" }
     ]
   }
   ```

### Additional Indexes (Non-MVP)
- **Users:** 2 indexes (email+role, organizationId+createdAt)
- **Players:** 2 indexes (teamId+createdAt, leagueId+age)
- **Registrations:** 2 indexes (parentId+status, leagueId+createdAt)
- **Games:** 3 indexes (leagueId+scheduledDate, homeTeamId+status, awayTeamId+status)
- **Payments:** 2 indexes (userId+status, createdAt+amount)
- **Teams:** 2 indexes (leagueId+coachId, organizationId+createdAt)
- **Leagues:** 2 indexes (organizationId+sport, ageGroup+createdAt)
- **Sibling Requests:** 1 index (parentId+status)
- **Age Override Requests:** 1 index (parentId+status)
- **Waitlist:** 1 index (leagueId+position)
- **Analytics:** 1 index (userId+timestamp)
- **Audit Logs:** 1 index (userId+timestamp)
- **Messages:** 2 indexes (senderId+createdAt, recipientId+createdAt)
- **Facilities:** 1 index (organizationId+createdAt)
- **Locations:** 2 indexes (sport+status, amenities+stats.followers)

## ✅ Validation Status

### Rules Validation
- **Status:** ✅ **Complete** - All collections have proper security rules
- **Coverage:** 100% of collections covered
- **Security:** Proper authentication and authorization checks
- **Testing:** Not validated with emulator (test environment issues)

### Indexes Validation
- **Status:** ✅ **Complete** - All required indexes defined
- **MVP Coverage:** 8 indexes for Location Threads feature
- **Query Support:** Indexes support all planned queries
- **Testing:** Not validated with emulator (test environment issues)

## 🚨 Issues & Recommendations

### Current Issues
1. **Test Environment:** Cannot validate rules/indexes due to missing Firebase project configuration
2. **Emulator Testing:** No smoke tests run to verify rules and indexes work correctly

### Recommendations
1. **Fix Test Environment:** Set FIREBASE_PROJECT_ID and configure emulator
2. **Run Smoke Tests:** Test core Location Threads flows with emulator
3. **Validate Queries:** Ensure all indexes match actual query patterns
4. **Monitor Performance:** Watch for missing index errors in production

## 📋 Next Steps

1. **Configure Firebase Emulator** (2h)
   - Set up test environment
   - Configure emulator for rules/indexes testing

2. **Run Smoke Tests** (1h)
   - Test Location Threads core flows
   - Validate rules and indexes work correctly

3. **Monitor Production** (Ongoing)
   - Watch for missing index errors
   - Monitor query performance
   - Adjust indexes as needed

---

*This summary was generated from firestore.rules and firestore.indexes.json analysis.*
