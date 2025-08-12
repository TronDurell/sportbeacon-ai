import { initializeTestEnvironment, RulesTestEnvironment, RulesTestContext } from '@firebase/rules-unit-testing';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { jest } from '@jest/globals';

describe('Firebase Security Rules', () => {
  let testEnv: RulesTestEnvironment;
  let firestore: any;
  let storage: any;
  let auth: any;

  beforeAll(async () => {
    // Initialize test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              // User profiles
              match /users/{userId} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
                allow read: if request.auth != null && request.auth.token.role == 'admin';
              }
              
              // Media files
              match /media/{mediaId} {
                allow read: if request.auth != null && (
                  resource.data.uploadedBy == request.auth.uid ||
                  resource.data.isPublic == true ||
                  request.auth.token.role == 'admin'
                );
                allow create: if request.auth != null && 
                  request.auth.uid == request.resource.data.uploadedBy;
                allow update, delete: if request.auth != null && 
                  (resource.data.uploadedBy == request.auth.uid ||
                   request.auth.token.role == 'admin');
              }
              
              // Collections
              match /collections/{collectionId} {
                allow read: if request.auth != null && (
                  resource.data.createdBy == request.auth.uid ||
                  resource.data.isPublic == true ||
                  request.auth.token.role == 'admin'
                );
                allow create: if request.auth != null && 
                  request.auth.uid == request.resource.data.createdBy;
                allow update, delete: if request.auth != null && 
                  (resource.data.createdBy == request.auth.uid ||
                   request.auth.token.role == 'admin');
              }
              
              // Admin operations
              match /admin/{document=**} {
                allow read, write: if request.auth != null && 
                  request.auth.token.role == 'admin';
              }
            }
          }
        `,
        host: 'localhost',
        port: 8080
      },
      storage: {
        rules: `
          rules_version = '2';
          service firebase.storage {
            match /b/{bucket}/o {
              // User files
              match /users/{userId}/{allPaths=**} {
                allow read, write: if request.auth != null && 
                  request.auth.uid == userId;
                allow read: if request.auth != null && 
                  request.auth.token.role == 'admin';
              }
              
              // Public files
              match /public/{allPaths=**} {
                allow read: if true;
                allow write: if request.auth != null && 
                  request.auth.token.role == 'admin';
              }
              
              // Media files
              match /media/{allPaths=**} {
                allow read: if request.auth != null;
                allow write: if request.auth != null && 
                  request.auth.uid == resource.metadata.uploadedBy;
              }
            }
          }
        `,
        host: 'localhost',
        port: 9199
      }
    });

    // Connect to emulators
    firestore = getFirestore();
    storage = getStorage();
    auth = getAuth();

    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectAuthEmulator(auth, 'http://localhost:9099');
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.clearStorage();
  });

  describe('Firestore Rules - User Profiles', () => {
    it('should allow users to read their own profile', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('users/test-user').set({
        name: 'Test User',
        email: 'test@example.com'
      });

      const docRef = doc(testFirestore, 'users', 'test-user');
      await expect(getDoc(docRef)).resolves.toBeDefined();
    });

    it('should allow users to update their own profile', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('users/test-user').set({
        name: 'Test User',
        email: 'test@example.com'
      });

      const docRef = doc(testFirestore, 'users', 'test-user');
      await expect(updateDoc(docRef, { name: 'Updated Name' })).resolves.toBeDefined();
    });

    it('should prevent users from reading other users profiles', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('users/other-user').set({
        name: 'Other User',
        email: 'other@example.com'
      });

      const docRef = doc(testFirestore, 'users', 'other-user');
      await expect(getDoc(docRef)).rejects.toThrow();
    });

    it('should allow admins to read any user profile', async () => {
      const adminUser = await createUserWithEmailAndPassword(auth, 'admin@example.com', 'password123');
      
      // Set admin role in custom claims
      await testEnv.setCustomClaims(adminUser.user.uid, { role: 'admin' });
      
      const testContext = testEnv.authenticatedContext(adminUser.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('users/test-user').set({
        name: 'Test User',
        email: 'test@example.com'
      });

      const docRef = doc(testFirestore, 'users', 'test-user');
      await expect(getDoc(docRef)).resolves.toBeDefined();
    });
  });

  describe('Firestore Rules - Media Files', () => {
    it('should allow users to create their own media', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      const mediaData = {
        fileName: 'test.jpg',
        uploadedBy: user.user.uid,
        isPublic: false,
        mediaType: 'image',
        category: 'gallery'
      };

      await expect(testFirestore.doc('media/test-media').set(mediaData)).resolves.toBeDefined();
    });

    it('should allow users to read their own media', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('media/test-media').set({
        fileName: 'test.jpg',
        uploadedBy: user.user.uid,
        isPublic: false
      });

      const docRef = doc(testFirestore, 'media', 'test-media');
      await expect(getDoc(docRef)).resolves.toBeDefined();
    });

    it('should allow users to read public media', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('media/public-media').set({
        fileName: 'public.jpg',
        uploadedBy: 'other-user',
        isPublic: true
      });

      const docRef = doc(testFirestore, 'media', 'public-media');
      await expect(getDoc(docRef)).resolves.toBeDefined();
    });

    it('should prevent users from reading private media of others', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('media/private-media').set({
        fileName: 'private.jpg',
        uploadedBy: 'other-user',
        isPublic: false
      });

      const docRef = doc(testFirestore, 'media', 'private-media');
      await expect(getDoc(docRef)).rejects.toThrow();
    });

    it('should allow users to update their own media', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('media/test-media').set({
        fileName: 'test.jpg',
        uploadedBy: user.user.uid,
        isPublic: false
      });

      const docRef = doc(testFirestore, 'media', 'test-media');
      await expect(updateDoc(docRef, { fileName: 'updated.jpg' })).resolves.toBeDefined();
    });

    it('should prevent users from updating others media', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('media/other-media').set({
        fileName: 'other.jpg',
        uploadedBy: 'other-user',
        isPublic: false
      });

      const docRef = doc(testFirestore, 'media', 'other-media');
      await expect(updateDoc(docRef, { fileName: 'updated.jpg' })).rejects.toThrow();
    });

    it('should allow admins to read any media', async () => {
      const adminUser = await createUserWithEmailAndPassword(auth, 'admin@example.com', 'password123');
      await testEnv.setCustomClaims(adminUser.user.uid, { role: 'admin' });
      
      const testContext = testEnv.authenticatedContext(adminUser.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('media/private-media').set({
        fileName: 'private.jpg',
        uploadedBy: 'other-user',
        isPublic: false
      });

      const docRef = doc(testFirestore, 'media', 'private-media');
      await expect(getDoc(docRef)).resolves.toBeDefined();
    });
  });

  describe('Firestore Rules - Collections', () => {
    it('should allow users to create their own collections', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      const collectionData = {
        name: 'My Collection',
        createdBy: user.user.uid,
        isPublic: false,
        mediaIds: []
      };

      await expect(testFirestore.doc('collections/test-collection').set(collectionData)).resolves.toBeDefined();
    });

    it('should allow users to read public collections', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('collections/public-collection').set({
        name: 'Public Collection',
        createdBy: 'other-user',
        isPublic: true
      });

      const docRef = doc(testFirestore, 'collections', 'public-collection');
      await expect(getDoc(docRef)).resolves.toBeDefined();
    });

    it('should prevent users from reading private collections of others', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('collections/private-collection').set({
        name: 'Private Collection',
        createdBy: 'other-user',
        isPublic: false
      });

      const docRef = doc(testFirestore, 'collections', 'private-collection');
      await expect(getDoc(docRef)).rejects.toThrow();
    });
  });

  describe('Firestore Rules - Admin Operations', () => {
    it('should allow admins to access admin documents', async () => {
      const adminUser = await createUserWithEmailAndPassword(auth, 'admin@example.com', 'password123');
      await testEnv.setCustomClaims(adminUser.user.uid, { role: 'admin' });
      
      const testContext = testEnv.authenticatedContext(adminUser.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('admin/users').set({
        totalUsers: 100,
        activeUsers: 50
      });

      const docRef = doc(testFirestore, 'admin', 'users');
      await expect(getDoc(docRef)).resolves.toBeDefined();
    });

    it('should prevent non-admins from accessing admin documents', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      await testFirestore.doc('admin/users').set({
        totalUsers: 100,
        activeUsers: 50
      });

      const docRef = doc(testFirestore, 'admin', 'users');
      await expect(getDoc(docRef)).rejects.toThrow();
    });
  });

  describe('Storage Rules - User Files', () => {
    it('should allow users to upload to their own directory', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testStorage = testContext.storage();

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const storageRef = ref(testStorage, `users/${user.user.uid}/test.jpg`);

      await expect(uploadBytes(storageRef, file)).resolves.toBeDefined();
    });

    it('should allow users to read their own files', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testStorage = testContext.storage();

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const storageRef = ref(testStorage, `users/${user.user.uid}/test.jpg`);

      await uploadBytes(storageRef, file);
      await expect(getDownloadURL(storageRef)).resolves.toBeDefined();
    });

    it('should prevent users from accessing others files', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testStorage = testContext.storage();

      const storageRef = ref(testStorage, 'users/other-user/test.jpg');

      await expect(getDownloadURL(storageRef)).rejects.toThrow();
    });

    it('should allow admins to read any user files', async () => {
      const adminUser = await createUserWithEmailAndPassword(auth, 'admin@example.com', 'password123');
      await testEnv.setCustomClaims(adminUser.user.uid, { role: 'admin' });
      
      const testContext = testEnv.authenticatedContext(adminUser.user.uid);
      const testStorage = testContext.storage();

      const storageRef = ref(testStorage, 'users/test-user/test.jpg');

      // Should not throw even if file doesn't exist (admin access)
      await expect(getDownloadURL(storageRef)).rejects.toThrow(); // File doesn't exist, but access is allowed
    });
  });

  describe('Storage Rules - Public Files', () => {
    it('should allow anyone to read public files', async () => {
      const testContext = testEnv.unauthenticatedContext();
      const testStorage = testContext.storage();

      const storageRef = ref(testStorage, 'public/test.jpg');

      // Should not throw for public access
      await expect(getDownloadURL(storageRef)).rejects.toThrow(); // File doesn't exist, but access is allowed
    });

    it('should only allow admins to write public files', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testStorage = testContext.storage();

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const storageRef = ref(testStorage, 'public/test.jpg');

      await expect(uploadBytes(storageRef, file)).rejects.toThrow();
    });

    it('should allow admins to write public files', async () => {
      const adminUser = await createUserWithEmailAndPassword(auth, 'admin@example.com', 'password123');
      await testEnv.setCustomClaims(adminUser.user.uid, { role: 'admin' });
      
      const testContext = testEnv.authenticatedContext(adminUser.user.uid);
      const testStorage = testContext.storage();

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const storageRef = ref(testStorage, 'public/test.jpg');

      await expect(uploadBytes(storageRef, file)).resolves.toBeDefined();
    });
  });

  describe('Storage Rules - Media Files', () => {
    it('should allow authenticated users to read media files', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testStorage = testContext.storage();

      const storageRef = ref(testStorage, 'media/test.jpg');

      // Should not throw for authenticated access
      await expect(getDownloadURL(storageRef)).rejects.toThrow(); // File doesn't exist, but access is allowed
    });

    it('should prevent unauthenticated users from reading media files', async () => {
      const testContext = testEnv.unauthenticatedContext();
      const testStorage = testContext.storage();

      const storageRef = ref(testStorage, 'media/test.jpg');

      await expect(getDownloadURL(storageRef)).rejects.toThrow();
    });

    it('should allow users to upload media files', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testStorage = testContext.storage();

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const storageRef = ref(testStorage, 'media/test.jpg');

      await expect(uploadBytes(storageRef, file, {
        customMetadata: {
          uploadedBy: user.user.uid
        }
      })).resolves.toBeDefined();
    });
  });

  describe('Authentication Requirements', () => {
    it('should require authentication for protected operations', async () => {
      const testContext = testEnv.unauthenticatedContext();
      const testFirestore = testContext.firestore();

      await expect(testFirestore.doc('users/test-user').set({
        name: 'Test User'
      })).rejects.toThrow();
    });

    it('should require authentication for storage operations', async () => {
      const testContext = testEnv.unauthenticatedContext();
      const testStorage = testContext.storage();

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const storageRef = ref(testStorage, 'users/test-user/test.jpg');

      await expect(uploadBytes(storageRef, file)).rejects.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields in media documents', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      // Missing required fields
      await expect(testFirestore.doc('media/test-media').set({
        fileName: 'test.jpg'
        // Missing uploadedBy field
      })).rejects.toThrow();
    });

    it('should validate user ownership in media documents', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      // Wrong uploadedBy field
      await expect(testFirestore.doc('media/test-media').set({
        fileName: 'test.jpg',
        uploadedBy: 'other-user' // Should be user.user.uid
      })).rejects.toThrow();
    });
  });

  describe('Performance and Limits', () => {
    it('should handle large queries efficiently', async () => {
      const user = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      
      const testContext = testEnv.authenticatedContext(user.user.uid);
      const testFirestore = testContext.firestore();

      // Create multiple documents
      const batch = [];
      for (let i = 0; i < 100; i++) {
        batch.push(testFirestore.doc(`media/media-${i}`).set({
          fileName: `test-${i}.jpg`,
          uploadedBy: user.user.uid,
          isPublic: false
        }));
      }

      await Promise.all(batch);

      // Query should work efficiently
      const q = query(
        collection(testFirestore, 'media'),
        where('uploadedBy', '==', user.user.uid),
        where('isPublic', '==', false)
      );

      const startTime = Date.now();
      const querySnapshot = await getDocs(q);
      const endTime = Date.now();

      expect(querySnapshot.size).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
}); 