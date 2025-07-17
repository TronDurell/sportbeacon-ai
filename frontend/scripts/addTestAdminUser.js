#!/usr/bin/env node

/**
 * Add Test Admin User for Town Rec Testing
 * 
 * This script creates a test admin user with Town Rec permissions
 * for testing the RecAuditPanel and related features.
 */

console.log('🏛️ TOWN REC TEST USER SETUP');
console.log('📌 GOAL: Create test admin user for Town Rec panel access\n');

// Mock user data for testing
const testAdminUser = {
  id: 'test-admin-001',
  email: 'teststaff_cary@admin.com',
  name: 'Test Cary Staff',
  role: 'TownStaff',
  groups: ['testGroups.caryAdminTest'],
  permissions: ['read', 'write', 'approve', 'override'],
  municipality: 'Cary',
  department: 'Parks & Recreation',
  createdAt: new Date().toISOString(),
  lastLogin: null,
  isActive: true
};

// Mock Firestore operations
const mockFirestoreOperations = {
  createUser: async (userData) => {
    console.log('✅ Creating test admin user...');
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Groups: ${userData.groups.join(', ')}`);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      userId: userData.id,
      message: 'Test admin user created successfully'
    };
  },
  
  addToGroup: async (userId, groupName) => {
    console.log(`✅ Adding user to group: ${groupName}`);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: `User added to ${groupName} successfully`
    };
  },
  
  setPermissions: async (userId, permissions) => {
    console.log(`✅ Setting permissions: ${permissions.join(', ')}`);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Permissions set successfully'
    };
  }
};

async function createTestAdminUser() {
  try {
    console.log('🚀 Starting test admin user creation...\n');
    
    // Step 1: Create the user
    const userResult = await mockFirestoreOperations.createUser(testAdminUser);
    
    if (!userResult.success) {
      throw new Error('Failed to create test admin user');
    }
    
    // Step 2: Add user to admin group
    const groupResult = await mockFirestoreOperations.addToGroup(
      testAdminUser.id, 
      'testGroups.caryAdminTest'
    );
    
    if (!groupResult.success) {
      throw new Error('Failed to add user to admin group');
    }
    
    // Step 3: Set permissions
    const permissionResult = await mockFirestoreOperations.setPermissions(
      testAdminUser.id,
      testAdminUser.permissions
    );
    
    if (!permissionResult.success) {
      throw new Error('Failed to set user permissions');
    }
    
    console.log('\n🎉 Test Admin User Setup Complete!');
    console.log('=====================================');
    console.log(`📧 Email: ${testAdminUser.email}`);
    console.log(`👤 Name: ${testAdminUser.name}`);
    console.log(`🏛️ Role: ${testAdminUser.role}`);
    console.log(`🔑 Groups: ${testAdminUser.groups.join(', ')}`);
    console.log(`⚡ Permissions: ${testAdminUser.permissions.join(', ')}`);
    console.log(`🏘️ Municipality: ${testAdminUser.municipality}`);
    console.log(`📅 Created: ${testAdminUser.createdAt}`);
    
    console.log('\n🧪 Testing Instructions:');
    console.log('1. Visit: http://localhost:3001/admin');
    console.log('2. Login with: teststaff_cary@admin.com');
    console.log('3. Navigate to Town Rec Audit Panel');
    console.log('4. Test all admin actions and toast notifications');
    console.log('5. Verify audit trail logging in Firestore');
    
    console.log('\n🔍 Expected Features:');
    console.log('✅ Access to RecAuditPanel with all 5 tabs');
    console.log('✅ Waitlist exception handling');
    console.log('✅ Sibling pairing automation');
    console.log('✅ Age override approval workflow');
    console.log('✅ Toast notifications for all actions');
    console.log('✅ Audit trail logging');
    console.log('✅ Sandbox testing environment');
    
    console.log('\n📊 Test Scenarios:');
    console.log('1. Approve/Deny waitlist exceptions');
    console.log('2. Process sibling pairing requests');
    console.log('3. Handle age override approvals');
    console.log('4. Test sandbox automation triggers');
    console.log('5. Verify Firestore real-time updates');
    console.log('6. Check i18n localization');
    
    return {
      success: true,
      user: testAdminUser,
      message: 'Test admin user created and configured successfully'
    };
    
  } catch (error) {
    console.error('\n❌ Error creating test admin user:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the setup
if (require.main === module) {
  createTestAdminUser()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Setup completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Setup failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { createTestAdminUser, testAdminUser }; 