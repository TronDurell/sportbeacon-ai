import functionsTest from "firebase-functions-test";
import {expect} from "chai";
import {authLogin, authLogout, submitLeague, getWaitlist} from "../index";

const test = functionsTest();

describe("Firebase Cloud Functions Tests", () => {
  let admin: any;

  beforeAll(() => {
    admin = test.admin;
  });

  afterAll(() => {
    test.cleanup();
  });

  describe("Authentication Functions", () => {
    it("should handle login attempt", async () => {
      const wrapped = test.wrap(authLogin);
      const result = await wrapped({email: "test@example.com", password: "password"}, {
        auth: {uid: "test-user-id"},
      });

      expect(result.success).to.be.true;
      expect(result.message).to.equal("Login stub hit");
    });

    it("should handle logout for authenticated user", async () => {
      const wrapped = test.wrap(authLogout);
      const result = await wrapped({}, {
        auth: {uid: "test-user-id"},
      });

      expect(result.success).to.be.true;
      expect(result.message).to.equal("Logout successful");
    });

    it("should reject logout for unauthenticated user", async () => {
      const wrapped = test.wrap(authLogout);
      const result = await wrapped({}, {});

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Logout failed");
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
      const wrapped = test.wrap(submitLeague);
      const result = await wrapped({
        leagueName: "U10 Soccer",
        ageGroup: "U10",
        sport: "soccer",
      }, {
        auth: {uid: "test-staff-id"},
      });

      expect(result.success).to.be.true;
      expect(result.message).to.equal("League submitted successfully");
    });

    it("should reject league submission for non-staff user", async () => {
      const wrapped = test.wrap(submitLeague);
      const result = await wrapped({
        leagueName: "U10 Soccer",
        ageGroup: "U10",
        sport: "soccer",
      }, {
        auth: {uid: "regular-user-id"},
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("League submission failed");
    });

    it("should handle waitlist retrieval for town staff", async () => {
      const wrapped = test.wrap(getWaitlist);
      const result = await wrapped({}, {
        auth: {uid: "test-staff-id"},
      });

      expect(result.success).to.be.true;
      expect(result.message).to.equal("Waitlist retrieved");
    });
  });

  describe("Error Handling", () => {
    it("should handle function errors gracefully", async () => {
      const wrapped = test.wrap(authLogin);
      const result = await wrapped(null, {});

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Login failed");
      expect(result.error).to.exist;
    });
  });
});

