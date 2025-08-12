import * as functionsTest from "firebase-functions-test";
import { expect } from "chai";
import { getPlayer, getPlayerAiAnalysis, getPlayerVideoClips, getPlayerDrillHistory } from "../index";

const test = functionsTest();

describe("Player Functions", () => {
  let admin: any;

  before(() => {
    admin = test.admin;
  });

  after(() => {
    test.cleanup();
  });

  beforeEach(async () => {
    // Setup test data
    await admin.firestore().collection("players").doc("test-player-id").set({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      age: 12,
      teamId: "test-team-id"
    });
  });

  afterEach(async () => {
    // Clean up test data
    await admin.firestore().collection("players").doc("test-player-id").delete();
  });

  describe("getPlayer", () => {
    it("should retrieve player data with valid UUID", async () => {
      const wrapped = test.wrap(getPlayer);
      const result = await wrapped({
        playerId: "test-player-id"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.true;
      expect(result.message).to.equal("Player data retrieved");
      expect(result.data).to.have.property("playerId", "test-player-id");
    });

    it("should reject request with invalid UUID format", async () => {
      const wrapped = test.wrap(getPlayer);
      const result = await wrapped({
        playerId: "invalid-uuid"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Get player failed");
    });

    it("should reject request with missing playerId", async () => {
      const wrapped = test.wrap(getPlayer);
      const result = await wrapped({}, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Get player failed");
    });

    it("should reject request with invalid data type", async () => {
      const wrapped = test.wrap(getPlayer);
      const result = await wrapped("invalid-data", {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Get player failed");
    });
  });

  describe("getPlayerAiAnalysis", () => {
    it("should retrieve AI analysis with valid player ID", async () => {
      const wrapped = test.wrap(getPlayerAiAnalysis);
      const result = await wrapped({
        playerId: "test-player-id"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.true;
      expect(result.message).to.equal("Player AI analysis retrieved");
      expect(result.data).to.have.property("playerId", "test-player-id");
    });

    it("should reject request with invalid UUID format", async () => {
      const wrapped = test.wrap(getPlayerAiAnalysis);
      const result = await wrapped({
        playerId: "invalid-uuid"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Player AI analysis failed");
    });

    it("should reject request with missing playerId", async () => {
      const wrapped = test.wrap(getPlayerAiAnalysis);
      const result = await wrapped({}, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Player AI analysis failed");
    });
  });

  describe("getPlayerVideoClips", () => {
    it("should retrieve video clips with valid parameters", async () => {
      const wrapped = test.wrap(getPlayerVideoClips);
      const result = await wrapped({
        playerId: "test-player-id",
        includeVideos: true,
        includeAnalytics: false,
        limit: 10,
        offset: 0
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.true;
      expect(result.message).to.equal("Player video clips retrieved");
      expect(result.data).to.have.property("playerId", "test-player-id");
    });

    it("should reject request with invalid UUID format", async () => {
      const wrapped = test.wrap(getPlayerVideoClips);
      const result = await wrapped({
        playerId: "invalid-uuid"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Player video clips failed");
    });

    it("should reject request with invalid limit", async () => {
      const wrapped = test.wrap(getPlayerVideoClips);
      const result = await wrapped({
        playerId: "test-player-id",
        limit: 150 // Exceeds max of 100
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Player video clips failed");
    });

    it("should reject request with negative offset", async () => {
      const wrapped = test.wrap(getPlayerVideoClips);
      const result = await wrapped({
        playerId: "test-player-id",
        offset: -1
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Player video clips failed");
    });

    it("should reject request with invalid includeVideos type", async () => {
      const wrapped = test.wrap(getPlayerVideoClips);
      const result = await wrapped({
        playerId: "test-player-id",
        includeVideos: "not-a-boolean"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Player video clips failed");
    });
  });

  describe("getPlayerDrillHistory", () => {
    it("should retrieve drill history with valid parameters", async () => {
      const wrapped = test.wrap(getPlayerDrillHistory);
      const result = await wrapped({
        playerId: "test-player-id",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        drillType: "passing",
        limit: 20,
        offset: 0
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.true;
      expect(result.message).to.equal("Player drill history retrieved");
      expect(result.data).to.have.property("playerId", "test-player-id");
    });

    it("should reject request with invalid UUID format", async () => {
      const wrapped = test.wrap(getPlayerDrillHistory);
      const result = await wrapped({
        playerId: "invalid-uuid"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Player drill history failed");
    });

    it("should reject request with invalid date format", async () => {
      const wrapped = test.wrap(getPlayerDrillHistory);
      const result = await wrapped({
        playerId: "test-player-id",
        startDate: "invalid-date"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Player drill history failed");
    });

    it("should reject request with invalid limit", async () => {
      const wrapped = test.wrap(getPlayerDrillHistory);
      const result = await wrapped({
        playerId: "test-player-id",
        limit: 0 // Must be >= 1
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Player drill history failed");
    });

    it("should reject request with negative offset", async () => {
      const wrapped = test.wrap(getPlayerDrillHistory);
      const result = await wrapped({
        playerId: "test-player-id",
        offset: -5
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Player drill history failed");
    });
  });
}); 