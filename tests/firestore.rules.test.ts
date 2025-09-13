import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Firestore Rules - Location Threads (Comprehensive)', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'sportbeacon-test',
      firestore: {
        rules: readFileSync(join(__dirname, '../firestore.rules'), 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // Test utilities
  const createTestLocation = async (locationId: string, moderators: string[] = []) => {
    const locationData = {
      name: 'Test Location',
      slug: 'test-location',
      sport: 'basketball',
      geo: { lat: 40.7128, lng: -74.0060 },
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      country: 'US',
      status: 'open',
      moderators,
      visibility: 'public',
      stats: {
        followers: 0,
        posts: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(`locations/${locationId}`).set(locationData);
    });

    return locationData;
  };

  const createTestPost = async (locationId: string, postId: string, authorId: string) => {
    const postData = {
      locationId,
      authorId,
      type: 'note',
      text: 'Test post',
      visibility: 'place',
      likeCount: 0,
      replyCount: 0,
      reportCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(`locations/${locationId}/threads/${postId}`).set(postData);
    });

    return postData;
  };

  describe('Locations Collection', () => {
    it('should allow public read access to locations', async () => {
      const locationId = 'test-location';
      await createTestLocation(locationId);

      const unauthenticatedContext = testEnv.unauthenticatedContext();
      const locationDoc = unauthenticatedContext.firestore().doc(`locations/${locationId}`);
      
      await expect(locationDoc.get()).resolves.toBeDefined();
    });

    it('should allow authenticated users to read locations', async () => {
      const locationId = 'test-location';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      const locationDoc = authenticatedContext.firestore().doc(`locations/${locationId}`);
      
      await expect(locationDoc.get()).resolves.toBeDefined();
    });

    it('should allow admin users to create locations', async () => {
      const locationId = 'new-location';
      
      // Create admin user
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc('users/admin1').set({
          email: 'admin@test.com',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      const adminContext = testEnv.authenticatedContext('admin1');
      const locationDoc = adminContext.firestore().doc(`locations/${locationId}`);
      
      const locationData = {
        name: 'New Location',
        slug: 'new-location',
        sport: 'basketball',
        geo: { lat: 40.7128, lng: -74.0060 },
        address: '123 New St',
        city: 'New City',
        state: 'NC',
        country: 'US',
        status: 'open',
        moderators: [],
        visibility: 'public',
        stats: { followers: 0, posts: 0 },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(locationDoc.set(locationData)).resolves.toBeUndefined();
    });

    it('should deny location creation by non-admin users', async () => {
      const locationId = 'new-location';
      const authenticatedContext = testEnv.authenticatedContext('user1');
      const locationDoc = authenticatedContext.firestore().doc(`locations/${locationId}`);
      
      const locationData = {
        name: 'New Location',
        sport: 'basketball',
        status: 'open'
      };

      await expect(locationDoc.set(locationData)).rejects.toThrow();
    });

    it('should allow location moderators to update locations', async () => {
      const locationId = 'test-location';
      const moderatorId = 'moderator1';
      await createTestLocation(locationId, [moderatorId]);

      const moderatorContext = testEnv.authenticatedContext(moderatorId);
      const locationDoc = moderatorContext.firestore().doc(`locations/${locationId}`);
      
      await expect(locationDoc.update({
        name: 'Updated Location Name'
      })).resolves.toBeUndefined();
    });

    it('should deny location update by non-moderator users', async () => {
      const locationId = 'test-location';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      const locationDoc = authenticatedContext.firestore().doc(`locations/${locationId}`);
      
      await expect(locationDoc.update({
        name: 'Unauthorized Update'
      })).rejects.toThrow();
    });

    it('should allow admin users to delete locations', async () => {
      const locationId = 'test-location';
      await createTestLocation(locationId);

      // Create admin user
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc('users/admin1').set({
          email: 'admin@test.com',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      const adminContext = testEnv.authenticatedContext('admin1');
      const locationDoc = adminContext.firestore().doc(`locations/${locationId}`);
      
      await expect(locationDoc.delete()).resolves.toBeUndefined();
    });

    it('should deny location deletion by non-admin users', async () => {
      const locationId = 'test-location';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      const locationDoc = authenticatedContext.firestore().doc(`locations/${locationId}`);
      
      await expect(locationDoc.delete()).rejects.toThrow();
    });
  });

  describe('Location Threads Subcollection', () => {
    it('should allow public read access to thread posts', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);
      await createTestPost(locationId, postId, 'author1');

      const unauthenticatedContext = testEnv.unauthenticatedContext();
      const postDoc = unauthenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      await expect(postDoc.get()).resolves.toBeDefined();
    });

    it('should allow authenticated users to create posts', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      const postData = {
        locationId,
        authorId: 'user1',
        type: 'note',
        text: 'Test post',
        visibility: 'place',
        likeCount: 0,
        replyCount: 0,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(postDoc.set(postData)).resolves.toBeUndefined();
    });

    it('should deny post creation without authentication', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);

      const unauthenticatedContext = testEnv.unauthenticatedContext();
      const postDoc = unauthenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      const postData = {
        locationId,
        authorId: 'user1',
        type: 'note',
        text: 'Test post',
        visibility: 'place',
        likeCount: 0,
        replyCount: 0,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(postDoc.set(postData)).rejects.toThrow();
    });

    it('should allow post author to update their own posts', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      const authorId = 'user1';
      await createTestLocation(locationId);
      await createTestPost(locationId, postId, authorId);

      const authenticatedContext = testEnv.authenticatedContext(authorId);
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      await expect(postDoc.update({
        text: 'Updated post content'
      })).resolves.toBeUndefined();
    });

    it('should deny post update by non-author', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      const authorId = 'user1';
      const otherUserId = 'user2';
      await createTestLocation(locationId);
      await createTestPost(locationId, postId, authorId);

      const authenticatedContext = testEnv.authenticatedContext(otherUserId);
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      await expect(postDoc.update({
        text: 'Unauthorized update'
      })).rejects.toThrow();
    });

    it('should allow location moderators to update posts', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      const authorId = 'user1';
      const moderatorId = 'moderator1';
      await createTestLocation(locationId, [moderatorId]);
      await createTestPost(locationId, postId, authorId);

      const authenticatedContext = testEnv.authenticatedContext(moderatorId);
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      await expect(postDoc.update({
        text: 'Moderator update'
      })).resolves.toBeUndefined();
    });

    it('should deny team visibility posts', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      const postData = {
        locationId,
        authorId: 'user1',
        type: 'note',
        text: 'Test post',
        visibility: 'team', // This should be denied
        likeCount: 0,
        replyCount: 0,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(postDoc.set(postData)).rejects.toThrow();
    });

    it('should allow admin users to create team visibility posts', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);

      // Create admin user
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc('users/admin1').set({
          email: 'admin@test.com',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      const adminContext = testEnv.authenticatedContext('admin1');
      const postDoc = adminContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      const postData = {
        locationId,
        authorId: 'admin1',
        type: 'note',
        text: 'Admin team post',
        visibility: 'team',
        likeCount: 0,
        replyCount: 0,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(postDoc.set(postData)).resolves.toBeUndefined();
    });

    it('should allow post author to delete their own posts', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      const authorId = 'user1';
      await createTestLocation(locationId);
      await createTestPost(locationId, postId, authorId);

      const authenticatedContext = testEnv.authenticatedContext(authorId);
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      await expect(postDoc.delete()).resolves.toBeUndefined();
    });

    it('should allow location moderators to delete posts', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      const authorId = 'user1';
      const moderatorId = 'moderator1';
      await createTestLocation(locationId, [moderatorId]);
      await createTestPost(locationId, postId, authorId);

      const moderatorContext = testEnv.authenticatedContext(moderatorId);
      const postDoc = moderatorContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      await expect(postDoc.delete()).resolves.toBeUndefined();
    });

    it('should allow admin users to delete any post', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      const authorId = 'user1';
      await createTestLocation(locationId);
      await createTestPost(locationId, postId, authorId);

      // Create admin user
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc('users/admin1').set({
          email: 'admin@test.com',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      const adminContext = testEnv.authenticatedContext('admin1');
      const postDoc = adminContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      await expect(postDoc.delete()).resolves.toBeUndefined();
    });

    it('should deny post deletion by non-author, non-moderator, non-admin users', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      const authorId = 'user1';
      const otherUserId = 'user2';
      await createTestLocation(locationId);
      await createTestPost(locationId, postId, authorId);

      const otherUserContext = testEnv.authenticatedContext(otherUserId);
      const postDoc = otherUserContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      await expect(postDoc.delete()).rejects.toThrow();
    });

    it('should validate post data structure on creation', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      // Test missing required fields
      const invalidPostData = {
        locationId,
        authorId: 'user1',
        type: 'note',
        // Missing visibility, createdAt
        likeCount: 0,
        replyCount: 0,
        reportCount: 0
      };

      await expect(postDoc.set(invalidPostData)).rejects.toThrow();
    });

    it('should validate post type values', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      const invalidPostData = {
        locationId,
        authorId: 'user1',
        type: 'invalid-type', // Invalid type
        text: 'Test post',
        visibility: 'place',
        likeCount: 0,
        replyCount: 0,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(postDoc.set(invalidPostData)).rejects.toThrow();
    });

    it('should validate visibility values', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      const invalidPostData = {
        locationId,
        authorId: 'user1',
        type: 'note',
        text: 'Test post',
        visibility: 'invalid-visibility', // Invalid visibility
        likeCount: 0,
        replyCount: 0,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(postDoc.set(invalidPostData)).rejects.toThrow();
    });
  });

  describe('Follows Collection', () => {
    it('should allow users to create their own follow documents', async () => {
      const userId = 'user1';
      const locationId = 'test-location';
      const followId = `${locationId}_${userId}`;
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext(userId);
      const followDoc = authenticatedContext.firestore().doc(`follows_locations/${followId}`);
      
      const followData = {
        locationId,
        userId,
        notifications: 'all',
        createdAt: new Date()
      };

      await expect(followDoc.set(followData)).resolves.toBeUndefined();
    });

    it('should deny follow creation by other users', async () => {
      const userId = 'user1';
      const otherUserId = 'user2';
      const locationId = 'test-location';
      const followId = `${locationId}_${userId}`;
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext(otherUserId);
      const followDoc = authenticatedContext.firestore().doc(`follows_locations/${followId}`);
      
      const followData = {
        locationId,
        userId,
        notifications: 'all',
        createdAt: new Date()
      };

      await expect(followDoc.set(followData)).rejects.toThrow();
    });

    it('should allow users to read their own follow documents', async () => {
      const userId = 'user1';
      const locationId = 'test-location';
      const followId = `${locationId}_${userId}`;
      await createTestLocation(locationId);

      // Create follow document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`follows_locations/${followId}`).set({
          locationId,
          userId,
          notifications: 'all',
          createdAt: new Date()
        });
      });

      const authenticatedContext = testEnv.authenticatedContext(userId);
      const followDoc = authenticatedContext.firestore().doc(`follows_locations/${followId}`);
      
      await expect(followDoc.get()).resolves.toBeDefined();
    });

    it('should deny read access to other users follow documents', async () => {
      const userId = 'user1';
      const otherUserId = 'user2';
      const locationId = 'test-location';
      const followId = `${locationId}_${userId}`;
      await createTestLocation(locationId);

      // Create follow document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`follows_locations/${followId}`).set({
          locationId,
          userId,
          notifications: 'all',
          createdAt: new Date()
        });
      });

      const authenticatedContext = testEnv.authenticatedContext(otherUserId);
      const followDoc = authenticatedContext.firestore().doc(`follows_locations/${followId}`);
      
      await expect(followDoc.get()).rejects.toThrow();
    });

    it('should allow users to update their own follow documents', async () => {
      const userId = 'user1';
      const locationId = 'test-location';
      const followId = `${locationId}_${userId}`;
      await createTestLocation(locationId);

      // Create follow document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`follows_locations/${followId}`).set({
          locationId,
          userId,
          notifications: 'all',
          createdAt: new Date()
        });
      });

      const authenticatedContext = testEnv.authenticatedContext(userId);
      const followDoc = authenticatedContext.firestore().doc(`follows_locations/${followId}`);
      
      await expect(followDoc.update({
        notifications: 'digest'
      })).resolves.toBeUndefined();
    });

    it('should deny follow update by other users', async () => {
      const userId = 'user1';
      const otherUserId = 'user2';
      const locationId = 'test-location';
      const followId = `${locationId}_${userId}`;
      await createTestLocation(locationId);

      // Create follow document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`follows_locations/${followId}`).set({
          locationId,
          userId,
          notifications: 'all',
          createdAt: new Date()
        });
      });

      const authenticatedContext = testEnv.authenticatedContext(otherUserId);
      const followDoc = authenticatedContext.firestore().doc(`follows_locations/${followId}`);
      
      await expect(followDoc.update({
        notifications: 'mute'
      })).rejects.toThrow();
    });

    it('should allow users to delete their own follow documents', async () => {
      const userId = 'user1';
      const locationId = 'test-location';
      const followId = `${locationId}_${userId}`;
      await createTestLocation(locationId);

      // Create follow document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`follows_locations/${followId}`).set({
          locationId,
          userId,
          notifications: 'all',
          createdAt: new Date()
        });
      });

      const authenticatedContext = testEnv.authenticatedContext(userId);
      const followDoc = authenticatedContext.firestore().doc(`follows_locations/${followId}`);
      
      await expect(followDoc.delete()).resolves.toBeUndefined();
    });

    it('should deny follow deletion by other users', async () => {
      const userId = 'user1';
      const otherUserId = 'user2';
      const locationId = 'test-location';
      const followId = `${locationId}_${userId}`;
      await createTestLocation(locationId);

      // Create follow document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`follows_locations/${followId}`).set({
          locationId,
          userId,
          notifications: 'all',
          createdAt: new Date()
        });
      });

      const authenticatedContext = testEnv.authenticatedContext(otherUserId);
      const followDoc = authenticatedContext.firestore().doc(`follows_locations/${followId}`);
      
      await expect(followDoc.delete()).rejects.toThrow();
    });

    it('should validate follow document data structure', async () => {
      const userId = 'user1';
      const locationId = 'test-location';
      const followId = `${locationId}_${userId}`;
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext(userId);
      const followDoc = authenticatedContext.firestore().doc(`follows_locations/${followId}`);
      
      // Test missing required fields
      const invalidFollowData = {
        locationId,
        userId,
        // Missing notifications, createdAt
      };

      await expect(followDoc.set(invalidFollowData)).rejects.toThrow();
    });

    it('should validate notification preference values', async () => {
      const userId = 'user1';
      const locationId = 'test-location';
      const followId = `${locationId}_${userId}`;
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext(userId);
      const followDoc = authenticatedContext.firestore().doc(`follows_locations/${followId}`);
      
      const invalidFollowData = {
        locationId,
        userId,
        notifications: 'invalid-preference', // Invalid notification preference
        createdAt: new Date()
      };

      await expect(followDoc.set(invalidFollowData)).rejects.toThrow();
    });

    it('should allow admin users to read any follow document', async () => {
      const userId = 'user1';
      const locationId = 'test-location';
      const followId = `${locationId}_${userId}`;
      await createTestLocation(locationId);

      // Create follow document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`follows_locations/${followId}`).set({
          locationId,
          userId,
          notifications: 'all',
          createdAt: new Date()
        });
      });

      // Create admin user
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc('users/admin1').set({
          email: 'admin@test.com',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      const adminContext = testEnv.authenticatedContext('admin1');
      const followDoc = adminContext.firestore().doc(`follows_locations/${followId}`);
      
      await expect(followDoc.get()).resolves.toBeDefined();
    });
  });

  describe('Home Location Feed', () => {
    it('should allow users to read their own home feed', async () => {
      const userId = 'user1';
      const feedItemId = 'feed-item-1';

      // Create feed item
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`).set({
          source: {
            kind: 'location',
            locationId: 'test-location'
          },
          postRef: 'locations/test-location/threads/test-post',
          rank: 100,
          createdAt: new Date()
        });
      });

      const authenticatedContext = testEnv.authenticatedContext(userId);
      const feedDoc = authenticatedContext.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`);
      
      await expect(feedDoc.get()).resolves.toBeDefined();
    });

    it('should deny read access to other users home feed', async () => {
      const userId = 'user1';
      const otherUserId = 'user2';
      const feedItemId = 'feed-item-1';

      // Create feed item
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`).set({
          source: {
            kind: 'location',
            locationId: 'test-location'
          },
          postRef: 'locations/test-location/threads/test-post',
          rank: 100,
          createdAt: new Date()
        });
      });

      const authenticatedContext = testEnv.authenticatedContext(otherUserId);
      const feedDoc = authenticatedContext.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`);
      
      await expect(feedDoc.get()).rejects.toThrow();
    });

    it('should deny write access to home feed (system only)', async () => {
      const userId = 'user1';
      const feedItemId = 'feed-item-1';

      const authenticatedContext = testEnv.authenticatedContext(userId);
      const feedDoc = authenticatedContext.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`);
      
      const feedData = {
        source: {
          kind: 'location',
          locationId: 'test-location'
        },
        postRef: 'locations/test-location/threads/test-post',
        rank: 100,
        createdAt: new Date()
      };

      await expect(feedDoc.set(feedData)).rejects.toThrow();
    });

    it('should deny update access to home feed (system only)', async () => {
      const userId = 'user1';
      const feedItemId = 'feed-item-1';

      // Create feed item
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`).set({
          source: {
            kind: 'location',
            locationId: 'test-location'
          },
          postRef: 'locations/test-location/threads/test-post',
          rank: 100,
          createdAt: new Date()
        });
      });

      const authenticatedContext = testEnv.authenticatedContext(userId);
      const feedDoc = authenticatedContext.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`);
      
      await expect(feedDoc.update({
        rank: 200
      })).rejects.toThrow();
    });

    it('should deny delete access to home feed (system only)', async () => {
      const userId = 'user1';
      const feedItemId = 'feed-item-1';

      // Create feed item
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`).set({
          source: {
            kind: 'location',
            locationId: 'test-location'
          },
          postRef: 'locations/test-location/threads/test-post',
          rank: 100,
          createdAt: new Date()
        });
      });

      const authenticatedContext = testEnv.authenticatedContext(userId);
      const feedDoc = authenticatedContext.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`);
      
      await expect(feedDoc.delete()).rejects.toThrow();
    });

    it('should allow system to create home feed items', async () => {
      const userId = 'user1';
      const feedItemId = 'feed-item-1';

      // System context (no authentication)
      const systemContext = testEnv.unauthenticatedContext();
      const feedDoc = systemContext.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`);
      
      const feedData = {
        source: {
          kind: 'location',
          locationId: 'test-location'
        },
        postRef: 'locations/test-location/threads/test-post',
        rank: 100,
        createdAt: new Date()
      };

      await expect(feedDoc.set(feedData)).resolves.toBeUndefined();
    });

    it('should allow system to update home feed items', async () => {
      const userId = 'user1';
      const feedItemId = 'feed-item-1';

      // Create feed item
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`).set({
          source: {
            kind: 'location',
            locationId: 'test-location'
          },
          postRef: 'locations/test-location/threads/test-post',
          rank: 100,
          createdAt: new Date()
        });
      });

      // System context (no authentication)
      const systemContext = testEnv.unauthenticatedContext();
      const feedDoc = systemContext.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`);
      
      await expect(feedDoc.update({
        rank: 200
      })).resolves.toBeUndefined();
    });

    it('should allow system to delete home feed items', async () => {
      const userId = 'user1';
      const feedItemId = 'feed-item-1';

      // Create feed item
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`).set({
          source: {
            kind: 'location',
            locationId: 'test-location'
          },
          postRef: 'locations/test-location/threads/test-post',
          rank: 100,
          createdAt: new Date()
        });
      });

      // System context (no authentication)
      const systemContext = testEnv.unauthenticatedContext();
      const feedDoc = systemContext.firestore().doc(`users/${userId}/home_location_feed/${feedItemId}`);
      
      await expect(feedDoc.delete()).resolves.toBeUndefined();
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle malformed document IDs gracefully', async () => {
      const locationId = 'test-location';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      
      // Test with invalid document ID format
      const invalidDoc = authenticatedContext.firestore().doc('locations/invalid-id-format');
      
      await expect(invalidDoc.get()).resolves.toBeDefined(); // Should not throw, just return empty
    });

    it('should validate authorId matches authenticated user on post creation', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      const postData = {
        locationId,
        authorId: 'different-user', // Different from authenticated user
        type: 'note',
        text: 'Test post',
        visibility: 'place',
        likeCount: 0,
        replyCount: 0,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(postDoc.set(postData)).rejects.toThrow();
    });

    it('should validate locationId matches document path on post creation', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      const postData = {
        locationId: 'different-location', // Different from document path
        authorId: 'user1',
        type: 'note',
        text: 'Test post',
        visibility: 'place',
        likeCount: 0,
        replyCount: 0,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(postDoc.set(postData)).rejects.toThrow();
    });

    it('should handle concurrent access scenarios', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);

      const user1Context = testEnv.authenticatedContext('user1');
      const user2Context = testEnv.authenticatedContext('user2');
      
      const postDoc1 = user1Context.firestore().doc(`locations/${locationId}/threads/${postId}`);
      const postDoc2 = user2Context.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      const postData1 = {
        locationId,
        authorId: 'user1',
        type: 'note',
        text: 'User 1 post',
        visibility: 'place',
        likeCount: 0,
        replyCount: 0,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const postData2 = {
        locationId,
        authorId: 'user2',
        type: 'note',
        text: 'User 2 post',
        visibility: 'place',
        likeCount: 0,
        replyCount: 0,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // First user should succeed
      await expect(postDoc1.set(postData1)).resolves.toBeUndefined();
      
      // Second user should fail (document already exists)
      await expect(postDoc2.set(postData2)).rejects.toThrow();
    });

    it('should validate string length limits', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      const postData = {
        locationId,
        authorId: 'user1',
        type: 'note',
        text: 'a'.repeat(1001), // Exceeds 1000 character limit
        visibility: 'place',
        likeCount: 0,
        replyCount: 0,
        reportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(postDoc.set(postData)).rejects.toThrow();
    });

    it('should validate timestamp fields', async () => {
      const locationId = 'test-location';
      const postId = 'test-post';
      await createTestLocation(locationId);

      const authenticatedContext = testEnv.authenticatedContext('user1');
      const postDoc = authenticatedContext.firestore().doc(`locations/${locationId}/threads/${postId}`);
      
      const postData = {
        locationId,
        authorId: 'user1',
        type: 'note',
        text: 'Test post',
        visibility: 'place',
        likeCount: 0,
        replyCount: 0,
        reportCount: 0,
        createdAt: 'invalid-timestamp', // Invalid timestamp
        updatedAt: new Date()
      };

      await expect(postDoc.set(postData)).rejects.toThrow();
    });
  });
});

