"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_functions_test_1 = __importDefault(require("firebase-functions-test"));
const chai_1 = require("chai");
const index_1 = require("../index");
const test = (0, firebase_functions_test_1.default)();
describe("Player Functions", () => {
    let admin;
    beforeAll(() => {
        admin = test.admin;
    });
    afterAll(() => {
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
            const wrapped = test.wrap(index_1.getPlayer);
            const result = await wrapped({
                playerId: "test-player-id"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Player data retrieved");
            (0, chai_1.expect)(result.data).to.have.property("playerId", "test-player-id");
        });
        it("should reject request with invalid UUID format", async () => {
            const wrapped = test.wrap(index_1.getPlayer);
            const result = await wrapped({
                playerId: "invalid-uuid"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Get player failed");
        });
        it("should reject request with missing playerId", async () => {
            const wrapped = test.wrap(index_1.getPlayer);
            const result = await wrapped({}, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Get player failed");
        });
        it("should reject request with invalid data type", async () => {
            const wrapped = test.wrap(index_1.getPlayer);
            const result = await wrapped("invalid-data", {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Get player failed");
        });
    });
    describe("getPlayerAiAnalysis", () => {
        it("should retrieve AI analysis with valid player ID", async () => {
            const wrapped = test.wrap(index_1.getPlayerAiAnalysis);
            const result = await wrapped({
                playerId: "test-player-id"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Player AI analysis retrieved");
            (0, chai_1.expect)(result.data).to.have.property("playerId", "test-player-id");
        });
        it("should reject request with invalid UUID format", async () => {
            const wrapped = test.wrap(index_1.getPlayerAiAnalysis);
            const result = await wrapped({
                playerId: "invalid-uuid"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Player AI analysis failed");
        });
        it("should reject request with missing playerId", async () => {
            const wrapped = test.wrap(index_1.getPlayerAiAnalysis);
            const result = await wrapped({}, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Player AI analysis failed");
        });
    });
    describe("getPlayerVideoClips", () => {
        it("should retrieve video clips with valid parameters", async () => {
            const wrapped = test.wrap(index_1.getPlayerVideoClips);
            const result = await wrapped({
                playerId: "test-player-id",
                includeVideos: true,
                includeAnalytics: false,
                limit: 10,
                offset: 0
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Player video clips retrieved");
            (0, chai_1.expect)(result.data).to.have.property("playerId", "test-player-id");
        });
        it("should reject request with invalid UUID format", async () => {
            const wrapped = test.wrap(index_1.getPlayerVideoClips);
            const result = await wrapped({
                playerId: "invalid-uuid"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Player video clips failed");
        });
        it("should reject request with invalid limit", async () => {
            const wrapped = test.wrap(index_1.getPlayerVideoClips);
            const result = await wrapped({
                playerId: "test-player-id",
                limit: 150 // Exceeds max of 100
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Player video clips failed");
        });
        it("should reject request with negative offset", async () => {
            const wrapped = test.wrap(index_1.getPlayerVideoClips);
            const result = await wrapped({
                playerId: "test-player-id",
                offset: -1
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Player video clips failed");
        });
        it("should reject request with invalid includeVideos type", async () => {
            const wrapped = test.wrap(index_1.getPlayerVideoClips);
            const result = await wrapped({
                playerId: "test-player-id",
                includeVideos: "not-a-boolean"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Player video clips failed");
        });
    });
    describe("getPlayerDrillHistory", () => {
        it("should retrieve drill history with valid parameters", async () => {
            const wrapped = test.wrap(index_1.getPlayerDrillHistory);
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
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Player drill history retrieved");
            (0, chai_1.expect)(result.data).to.have.property("playerId", "test-player-id");
        });
        it("should reject request with invalid UUID format", async () => {
            const wrapped = test.wrap(index_1.getPlayerDrillHistory);
            const result = await wrapped({
                playerId: "invalid-uuid"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Player drill history failed");
        });
        it("should reject request with invalid date format", async () => {
            const wrapped = test.wrap(index_1.getPlayerDrillHistory);
            const result = await wrapped({
                playerId: "test-player-id",
                startDate: "invalid-date"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Player drill history failed");
        });
        it("should reject request with invalid limit", async () => {
            const wrapped = test.wrap(index_1.getPlayerDrillHistory);
            const result = await wrapped({
                playerId: "test-player-id",
                limit: 0 // Must be >= 1
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Player drill history failed");
        });
        it("should reject request with negative offset", async () => {
            const wrapped = test.wrap(index_1.getPlayerDrillHistory);
            const result = await wrapped({
                playerId: "test-player-id",
                offset: -5
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Player drill history failed");
        });
    });
});
//# sourceMappingURL=player-functions.test.js.map