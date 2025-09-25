"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_functions_test_1 = __importDefault(require("firebase-functions-test"));
const chai_1 = require("chai");
const index_1 = require("../index");
const test = (0, firebase_functions_test_1.default)();
describe("Firebase Cloud Functions Tests", () => {
    let admin;
    beforeAll(() => {
        admin = test.admin;
    });
    afterAll(() => {
        test.cleanup();
    });
    describe("Authentication Functions", () => {
        it("should handle login attempt", async () => {
            const wrapped = test.wrap(index_1.authLogin);
            const result = await wrapped({ email: "test@example.com", password: "password" }, {
                auth: { uid: "test-user-id" },
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Login stub hit");
        });
        it("should handle logout for authenticated user", async () => {
            const wrapped = test.wrap(index_1.authLogout);
            const result = await wrapped({}, {
                auth: { uid: "test-user-id" },
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Logout successful");
        });
        it("should reject logout for unauthenticated user", async () => {
            const wrapped = test.wrap(index_1.authLogout);
            const result = await wrapped({}, {});
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Logout failed");
        });
    });
    describe("Town Rec Functions", () => {
        beforeEach(async () => {
            // Mock town staff user
            await admin.firestore().collection("townStaff").doc("test-staff-id").set({
                isActive: true,
                role: "RecCoordinator",
                email: "staff@town.gov",
            });
        });
        afterEach(async () => {
            // Clean up test data
            await admin.firestore().collection("townStaff").doc("test-staff-id").delete();
        });
        it("should handle league submission for town staff", async () => {
            const wrapped = test.wrap(index_1.submitLeague);
            const result = await wrapped({
                leagueName: "U10 Soccer",
                ageGroup: "U10",
                sport: "soccer",
            }, {
                auth: { uid: "test-staff-id" },
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("League submitted successfully");
        });
        it("should reject league submission for non-staff user", async () => {
            const wrapped = test.wrap(index_1.submitLeague);
            const result = await wrapped({
                leagueName: "U10 Soccer",
                ageGroup: "U10",
                sport: "soccer",
            }, {
                auth: { uid: "regular-user-id" },
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("League submission failed");
        });
        it("should handle waitlist retrieval for town staff", async () => {
            const wrapped = test.wrap(index_1.getWaitlist);
            const result = await wrapped({}, {
                auth: { uid: "test-staff-id" },
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Waitlist retrieved");
        });
    });
    describe("Error Handling", () => {
        it("should handle function errors gracefully", async () => {
            const wrapped = test.wrap(index_1.authLogin);
            const result = await wrapped(null, {});
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Login failed");
            (0, chai_1.expect)(result.error).to.exist;
        });
    });
});
//# sourceMappingURL=functions.test.js.map