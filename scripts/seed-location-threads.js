#!/usr/bin/env node

/**
 * Seed script for Location Threads
 * Populates the database with Godbold Park location and sample posts
 * 
 * Usage: node scripts/seed-location-threads.js
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Seed data
const GODBOLD_PARK = {
  name: "Godbold Park – Court 2",
  slug: "godbold-park-court-2",
  sport: "basketball",
  geo: { lat: 35.7796, lng: -78.8000 },
  address: "2050 NW Maynard Rd, Cary, NC",
  city: "Cary",
  state: "NC",
  country: "US",
  hours: "7:00–22:00",
  amenities: ["lights", "restrooms", "water"],
  status: "open",
  moderators: [],
  visibility: "public",
  stats: { followers: 0, posts: 0 },
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

const SAMPLE_POSTS = [
  {
    type: "note",
    text: "Great game tonight! The court was in perfect condition and the lights were working great. Perfect evening for some hoops.",
    media: [],
    pinned: true,
    visibility: "place",
    likeCount: 12,
    replyCount: 3,
    reportCount: 0,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)) // 2 hours ago
  },
  {
    type: "alert",
    text: "⚠️ Court is wet from rain. Please wait for it to dry before playing. Safety first!",
    media: [],
    pinned: false,
    visibility: "place",
    likeCount: 8,
    replyCount: 1,
    reportCount: 0,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)) // 4 hours ago
  },
  {
    type: "run",
    text: "Anyone up for a pickup game at 6 PM? All skill levels welcome!",
    run: {
      startsAt: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)), // 2 hours from now
      level: "open"
    },
    pinned: false,
    visibility: "place",
    likeCount: 15,
    replyCount: 7,
    reportCount: 0,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)) // 6 hours ago
  },
  {
    type: "clip",
    text: "Check out this amazing shot from tonight's game!",
    media: [
      {
        url: "https://example.com/basketball-shot.jpg",
        type: "image",
        w: 1920,
        h: 1080
      }
    ],
    pinned: false,
    visibility: "place",
    likeCount: 23,
    replyCount: 5,
    reportCount: 0,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)) // 8 hours ago
  },
  {
    type: "poll",
    text: "What's your favorite time to play?",
    poll: {
      question: "Best time for pickup games?",
      options: ["Early morning (6-8 AM)", "Afternoon (2-5 PM)", "Evening (6-9 PM)", "Late night (9-11 PM)"],
      closesAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours from now
    },
    pinned: false,
    visibility: "place",
    likeCount: 5,
    replyCount: 12,
    reportCount: 0,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)) // 12 hours ago
  }
];

// Test users
const TEST_USERS = [
  {
    id: "test-user-1",
    email: "player1@example.com",
    firstName: "Mike",
    lastName: "Johnson",
    role: "player",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    id: "test-user-2",
    email: "player2@example.com",
    firstName: "Sarah",
    lastName: "Williams",
    role: "player",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    id: "test-user-3",
    email: "player3@example.com",
    firstName: "David",
    lastName: "Brown",
    role: "player",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

/**
 * Seed the database with location threads data
 */
async function seedLocationThreads() {
  try {
    console.log('🌱 Starting Location Threads seed...');
    
    // 1. Create test users
    console.log('👥 Creating test users...');
    for (const user of TEST_USERS) {
      await db.collection('users').doc(user.id).set(user);
      console.log(`✅ Created user: ${user.firstName} ${user.lastName}`);
    }
    
    // 2. Create Godbold Park location
    console.log('🏟️ Creating Godbold Park location...');
    const locationRef = await db.collection('locations').add(GODBOLD_PARK);
    const locationId = locationRef.id;
    console.log(`✅ Created location: ${GODBOLD_PARK.name} (ID: ${locationId})`);
    
    // 3. Create sample posts
    console.log('📝 Creating sample posts...');
    for (let i = 0; i < SAMPLE_POSTS.length; i++) {
      const post = SAMPLE_POSTS[i];
      const postData = {
        ...post,
        locationId,
        authorId: TEST_USERS[i % TEST_USERS.length].id,
        createdAt: post.createdAt,
        updatedAt: post.createdAt
      };
      
      const postRef = await db.collection('locations').doc(locationId).collection('threads').add(postData);
      console.log(`✅ Created post: ${post.type} (ID: ${postRef.id})`);
    }
    
    // 4. Update location stats
    console.log('📊 Updating location stats...');
    await db.collection('locations').doc(locationId).update({
      'stats.posts': SAMPLE_POSTS.length,
      'stats.lastPostAt': SAMPLE_POSTS[0].createdAt,
      updatedAt: Timestamp.now()
    });
    console.log(`✅ Updated location stats: ${SAMPLE_POSTS.length} posts`);
    
    // 5. Create some follow relationships
    console.log('👥 Creating follow relationships...');
    const followPromises = TEST_USERS.map(async (user, index) => {
      const followId = `${user.id}_${locationId}`;
      const notifications = index === 0 ? 'all' : index === 1 ? 'digest' : 'mute';
      
      await db.collection('follows_locations').doc(followId).set({
        locationId,
        userId: user.id,
        notifications,
        createdAt: Timestamp.now()
      });
      
      console.log(`✅ User ${user.firstName} follows location (${notifications} notifications)`);
    });
    
    await Promise.all(followPromises);
    
    // 6. Update location follower count
    await db.collection('locations').doc(locationId).update({
      'stats.followers': TEST_USERS.length,
      updatedAt: Timestamp.now()
    });
    
    console.log('🎉 Location Threads seed completed successfully!');
    console.log(`📍 Location: ${GODBOLD_PARK.name}`);
    console.log(`📝 Posts: ${SAMPLE_POSTS.length}`);
    console.log(`👥 Followers: ${TEST_USERS.length}`);
    console.log(`🆔 Location ID: ${locationId}`);
    
    return {
      locationId,
      postCount: SAMPLE_POSTS.length,
      userCount: TEST_USERS.length
    };
    
  } catch (error) {
    console.error('❌ Error seeding Location Threads:', error);
    throw error;
  }
}

/**
 * Clean up seed data
 */
async function cleanupSeedData() {
  try {
    console.log('🧹 Cleaning up seed data...');
    
    // Get all locations with the test name
    const locationsSnapshot = await db.collection('locations')
      .where('name', '==', GODBOLD_PARK.name)
      .get();
    
    for (const locationDoc of locationsSnapshot.docs) {
      const locationId = locationDoc.id;
      
      // Delete posts
      const postsSnapshot = await db.collection('locations').doc(locationId).collection('threads').get();
      const postDeletions = postsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(postDeletions);
      console.log(`🗑️ Deleted ${postsSnapshot.docs.length} posts`);
      
      // Delete location
      await locationDoc.ref.delete();
      console.log(`🗑️ Deleted location: ${locationId}`);
    }
    
    // Delete test users
    for (const user of TEST_USERS) {
      await db.collection('users').doc(user.id).delete();
      console.log(`🗑️ Deleted user: ${user.firstName} ${user.lastName}`);
    }
    
    // Delete follow relationships
    const followsSnapshot = await db.collection('follows_locations')
      .where('locationId', 'in', locationsSnapshot.docs.map(doc => doc.id))
      .get();
    
    const followDeletions = followsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(followDeletions);
    console.log(`🗑️ Deleted ${followsSnapshot.docs.length} follow relationships`);
    
    console.log('✅ Seed data cleanup completed');
    
  } catch (error) {
    console.error('❌ Error cleaning up seed data:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'seed':
        await seedLocationThreads();
        break;
      case 'cleanup':
        await cleanupSeedData();
        break;
      case 'reset':
        await cleanupSeedData();
        await seedLocationThreads();
        break;
      default:
        console.log('Usage: node scripts/seed-location-threads.js [seed|cleanup|reset]');
        console.log('');
        console.log('Commands:');
        console.log('  seed     - Create seed data');
        console.log('  cleanup  - Remove seed data');
        console.log('  reset    - Clean up and recreate seed data');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/seed-location-threads.js seed');
        console.log('  node scripts/seed-location-threads.js cleanup');
        console.log('  node scripts/seed-location-threads.js reset');
        break;
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  seedLocationThreads,
  cleanupSeedData
};
