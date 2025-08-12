import {parentFollowUpEmails} from "../index";

import {

  createMockScheduledEvent,

  clearFirestoreData,

  seedTestData,

  countDocuments,

  mockData,

  waitForAsync,

} from "../../__tests__/test-utils";



describe("parentFollowUpEmails", () => {

  beforeEach(async () => {

    await clearFirestoreData();

  });



  afterEach(async () => {

    await clearFirestoreData();

  });



  it("should process parent follow-up emails successfully", async () => {

    // Arrange

    const event = createMockScheduledEvent();



    // Seed test data with pending requests older than 3 days

    await seedTestData("ageOverrides", {

      "override-old-1": {

        ...mockData.ageOverride,

        status: "pending",

        createdAt: new Date("2024-01-10T10:00:00Z"),

        lastReminderSent: null,

      },

      "override-old-2": {

        ...mockData.ageOverride,

        status: "pending",

        createdAt: new Date("2024-01-11T14:30:00Z"),

        lastReminderSent: null,

      },

    });



    await seedTestData("siblingPairings", {

      "pairing-old-1": {

        ...mockData.siblingPairing,

        status: "pending",

        createdAt: new Date("2024-01-10T10:00:00Z"),

        lastReminderSent: null,

      },

    });



    // Act

    await parentFollowUpEmails.test();



    // Wait for async operations to complete

    await waitForAsync(300);



    // Assert

    const overrideCount = await countDocuments("ageOverrides");

    const pairingCount = await countDocuments("siblingPairings");

    expect(overrideCount).toBe(2);

    expect(pairingCount).toBe(1);

  });



  it("should handle empty dataset gracefully", async () => {

    // Arrange

    const event = createMockScheduledEvent();



    // Act

    await parentFollowUpEmails.test();



    // Wait for async operations to complete

    await waitForAsync(200);



    // Assert

    const overrideCount = await countDocuments("ageOverrides");

    const pairingCount = await countDocuments("siblingPairings");

    expect(overrideCount).toBe(0);

    expect(pairingCount).toBe(0);

  });



  it("should process only requests older than 3 days", async () => {

    // Arrange

    const event = createMockScheduledEvent();



    // Seed test data with mixed ages

    await seedTestData("ageOverrides", {

      "override-old": {

        ...mockData.ageOverride,

        status: "pending",

        createdAt: new Date("2024-01-10T10:00:00Z"), // 5 days old

        lastReminderSent: null,

      },

      "override-recent": {

        ...mockData.ageOverride,

        status: "pending",

        createdAt: new Date("2024-01-14T10:00:00Z"), // 1 day old

        lastReminderSent: null,

      },

    });



    // Act

    await parentFollowUpEmails.test();



    // Wait for async operations to complete

    await waitForAsync(300);



    // Assert

    const overrideCount = await countDocuments("ageOverrides");

    expect(overrideCount).toBe(2);

  });



  it("should handle requests with existing reminders", async () => {

    // Arrange

    const event = createMockScheduledEvent();



    // Seed test data with existing reminders

    await seedTestData("ageOverrides", {

      "override-with-reminder": {

        ...mockData.ageOverride,

        status: "pending",

        createdAt: new Date("2024-01-10T10:00:00Z"),

        lastReminderSent: new Date("2024-01-13T10:00:00Z"),

        reminderCount: 1,

      },

    });



    // Act

    await parentFollowUpEmails.test();



    // Wait for async operations to complete

    await waitForAsync(300);



    // Assert

    const overrideCount = await countDocuments("ageOverrides");

    expect(overrideCount).toBe(1);

  });



  it("should process multiple request types", async () => {

    // Arrange

    const event = createMockScheduledEvent();



    // Seed test data with different request types

    await seedTestData("ageOverrides", {

      "override-multi-1": {

        ...mockData.ageOverride,

        status: "pending",

        createdAt: new Date("2024-01-10T10:00:00Z"),

        lastReminderSent: null,

      },

    });



    await seedTestData("siblingPairings", {

      "pairing-multi-1": {

        ...mockData.siblingPairing,

        status: "pending",

        createdAt: new Date("2024-01-10T10:00:00Z"),

        lastReminderSent: null,

      },

    });



    await seedTestData("waitlists", {

      "waitlist-multi-1": {

        ...mockData.waitlistEntry,

        status: "waiting",

        createdAt: new Date("2024-01-10T10:00:00Z"),

        lastReminderSent: null,

      },

    });



    // Act

    await parentFollowUpEmails.test();



    // Wait for async operations to complete

    await waitForAsync(300);



    // Assert

    const overrideCount = await countDocuments("ageOverrides");

    const pairingCount = await countDocuments("siblingPairings");

    const waitlistCount = await countDocuments("waitlists");

    expect(overrideCount).toBe(1);

    expect(pairingCount).toBe(1);

    expect(waitlistCount).toBe(1);

  });



  it("should handle requests with different statuses", async () => {

    // Arrange

    const event = createMockScheduledEvent();



    // Seed test data with different statuses

    await seedTestData("ageOverrides", {

      "override-pending": {

        ...mockData.ageOverride,

        status: "pending",

        createdAt: new Date("2024-01-10T10:00:00Z"),

        lastReminderSent: null,

      },

      "override-approved": {

        ...mockData.ageOverride,

        status: "approved",

        createdAt: new Date("2024-01-10T10:00:00Z"),

        lastReminderSent: null,

      },

      "override-denied": {

        ...mockData.ageOverride,

        status: "denied",

        createdAt: new Date("2024-01-10T10:00:00Z"),

        lastReminderSent: null,

      },

    });



    // Act

    await parentFollowUpEmails.test();



    // Wait for async operations to complete

    await waitForAsync(300);



    // Assert

    const overrideCount = await countDocuments("ageOverrides");

    expect(overrideCount).toBe(3);

  });



  it("should handle requests with multiple reminders", async () => {

    // Arrange

    const event = createMockScheduledEvent();



    // Seed test data with multiple reminders

    await seedTestData("ageOverrides", {

      "override-multiple-reminders": {

        ...mockData.ageOverride,

        status: "pending",

        createdAt: new Date("2024-01-05T10:00:00Z"), // 10 days old

        lastReminderSent: new Date("2024-01-12T10:00:00Z"),

        reminderCount: 2,

        reminderHistory: [

          {sentAt: new Date("2024-01-08T10:00:00Z"), type: "first_reminder"},

          {sentAt: new Date("2024-01-12T10:00:00Z"), type: "second_reminder"},

        ],

      },

    });



    // Act

    await parentFollowUpEmails.test();



    // Wait for async operations to complete

    await waitForAsync(300);



    // Assert

    const overrideCount = await countDocuments("ageOverrides");

    expect(overrideCount).toBe(1);

  });



  it("should handle requests with special characters and complex data", async () => {

    // Arrange

    const event = createMockScheduledEvent();



    // Seed test data with special characters

    await seedTestData("ageOverrides", {

      "override-special": {

        ...mockData.ageOverride,

        childName: "José María O'Connor-Smith",

        parentEmail: "jose.maria+followup@example-domain.com",

        reason: "This is a very detailed reason with multiple sentences. The child has demonstrated exceptional skills in multiple sports and has received professional training.",

        status: "pending",

        createdAt: new Date("2024-01-10T10:00:00Z"),

        lastReminderSent: null,

        specialNeeds: "Hearing impairment - needs sign language interpreter",

        additionalNotes: "Special accommodation request for sign language interpreter",

      },

    });



    // Act

    await parentFollowUpEmails.test();



    // Wait for async operations to complete

    await waitForAsync(300);



    // Assert

    const overrideCount = await countDocuments("ageOverrides");

    expect(overrideCount).toBe(1);

  });



  it("should handle large dataset for follow-up emails", async () => {

    // Arrange

    const event = createMockScheduledEvent();



    // Create large dataset

    const largeOverrideData: Record<string, any> = {};

    const largePairingData: Record<string, any> = {};



    for (let i = 1; i <= 50; i++) {

      largeOverrideData[`override-large-${i}`] = {

        ...mockData.ageOverride,

        childName: `Child ${i}`,

        parentEmail: `parent${i}@example.com`,

        status: "pending",

        createdAt: new Date(`2024-01-${10 + (i % 5)}T${10 + (i % 10)}:00:00Z`),

        lastReminderSent: null,

      };



      largePairingData[`pairing-large-${i}`] = {

        ...mockData.siblingPairing,

        familyId: `family${i}`,

        parentEmail: `parent${i}@example.com`,

        status: "pending",

        createdAt: new Date(`2024-01-${10 + (i % 5)}T${10 + (i % 10)}:00:00Z`),

        lastReminderSent: null,

      };

    }



    await seedTestData("ageOverrides", largeOverrideData);

    await seedTestData("siblingPairings", largePairingData);



    // Act

    await parentFollowUpEmails.test();



    // Wait for async operations to complete

    await waitForAsync(500);



    // Assert

    const overrideCount = await countDocuments("ageOverrides");

    const pairingCount = await countDocuments("siblingPairings");

    expect(overrideCount).toBe(50);

    expect(pairingCount).toBe(50);

  });



  it("should handle scheduled event with specific timezone", async () => {

    // Arrange

    const event = createMockScheduledEvent("2024-01-15T10:00:00Z", "America/New_York");



    await seedTestData("ageOverrides", {

      "override-timezone": {

        ...mockData.ageOverride,

        status: "pending",

        createdAt: new Date("2024-01-10T10:00:00Z"),

        lastReminderSent: null,

      },

    });



    // Act

    await parentFollowUpEmails.test();



    // Wait for async operations to complete

    await waitForAsync(200);



    // Assert

    const overrideCount = await countDocuments("ageOverrides");

    expect(overrideCount).toBe(1);

  });



  it("should handle requests with different reminder frequencies", async () => {

    // Arrange

    const event = createMockScheduledEvent();



    // Seed test data with different reminder frequencies

    await seedTestData("ageOverrides", {

      "override-first-reminder": {

        ...mockData.ageOverride,

        status: "pending",

        createdAt: new Date("2024-01-10T10:00:00Z"),

        lastReminderSent: null,

        reminderCount: 0,

      },

      "override-second-reminder": {

        ...mockData.ageOverride,

        status: "pending",

        createdAt: new Date("2024-01-05T10:00:00Z"),

        lastReminderSent: new Date("2024-01-12T10:00:00Z"),

        reminderCount: 1,

      },

      "override-final-reminder": {

        ...mockData.ageOverride,

        status: "pending",

        createdAt: new Date("2024-01-01T10:00:00Z"),

        lastReminderSent: new Date("2024-01-08T10:00:00Z"),

        reminderCount: 2,

      },

    });



    // Act

    await parentFollowUpEmails.test();



    // Wait for async operations to complete

    await waitForAsync(300);



    // Assert

    const overrideCount = await countDocuments("ageOverrides");

    expect(overrideCount).toBe(3);

  });



  // TODO: Add edge case tests

  // - Test with malformed email addresses

  // - Test with missing required fields

  // - Test with invalid date ranges

  // - Test with processing timeouts

  // - Test with database connection failures

  // - Test with email sending failures

  // - Test with reminder tracking failures

  // - Test with concurrent processing conflicts

  // - Test with data validation failures

  // - Test with rate limiting scenarios



  // TODO: Add integration tests

  // - Test with real Firestore emulator

  // - Test with email service integration

  // - Test with reminder tracking service

  // - Test with parent communication workflows

  // - Test with email template rendering

  // - Test with email delivery tracking

  // - Test with audit trail completeness

  // - Test with data consistency checks

  // - Test with performance benchmarks

  // - Test with error recovery scenarios

  // - Test with concurrent processing limits

  // - Test with email batching optimization

  // - Test with reminder frequency management

  // - Test with monitoring and alerting

  // - Test with email personalization

  // - Test with multi-language support

});


