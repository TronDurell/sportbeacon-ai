import functionsTest from "firebase-functions-test";
import { expect } from "chai";
import { authLogin, authRegister, authLogout, authSession, authRefresh } from "../index";

const test = functionsTest();

describe("Authentication Functions", () => {
  let admin: any;

  beforeAll(() => {
    admin = test.admin;
  });

  afterAll(() => {
    test.cleanup();
  });

  describe("authLogin", () => {
    it("should handle valid login attempt", async () => {
      const wrapped = test.wrap(authLogin);
      const result = await wrapped({
        email: "test@example.com",
        password: "ValidPass123!"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.true;
      expect(result.message).to.equal("Login successful");
      expect(result.data).to.have.property("user");
      expect(result.data.user).to.have.property("email", "test@example.com");
    });

    it("should reject login with invalid email format", async () => {
      const wrapped = test.wrap(authLogin);
      const result = await wrapped({
        email: "invalid-email",
        password: "ValidPass123!"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Login failed");
    });

    it("should reject login with weak password", async () => {
      const wrapped = test.wrap(authLogin);
      const result = await wrapped({
        email: "test@example.com",
        password: "weak"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Login failed");
    });

    it("should reject login with missing email", async () => {
      const wrapped = test.wrap(authLogin);
      const result = await wrapped({
        password: "ValidPass123!"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Login failed");
    });

    it("should reject login with missing password", async () => {
      const wrapped = test.wrap(authLogin);
      const result = await wrapped({
        email: "test@example.com"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Login failed");
    });

    it("should reject login with invalid data type", async () => {
      const wrapped = test.wrap(authLogin);
      const result = await wrapped("invalid-data", {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Login failed");
    });
  });

  describe("authRegister", () => {
    it("should handle valid registration", async () => {
      const wrapped = test.wrap(authRegister);
      const result = await wrapped({
        email: "newuser@example.com",
        password: "ValidPass123!",
        firstName: "John",
        lastName: "Doe",
        role: "parent"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.true;
      expect(result.message).to.equal("Registration successful");
      expect(result.data).to.have.property("user");
      expect(result.data.user).to.have.property("email", "newuser@example.com");
    });

    it("should reject registration with invalid email", async () => {
      const wrapped = test.wrap(authRegister);
      const result = await wrapped({
        email: "invalid-email",
        password: "ValidPass123!",
        firstName: "John",
        lastName: "Doe"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Registration failed");
    });

    it("should reject registration with weak password", async () => {
      const wrapped = test.wrap(authRegister);
      const result = await wrapped({
        email: "test@example.com",
        password: "weak",
        firstName: "John",
        lastName: "Doe"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Registration failed");
    });

    it("should reject registration with invalid role", async () => {
      const wrapped = test.wrap(authRegister);
      const result = await wrapped({
        email: "test@example.com",
        password: "ValidPass123!",
        firstName: "John",
        lastName: "Doe",
        role: "invalid-role"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Registration failed");
    });

    it("should reject registration with invalid phone number", async () => {
      const wrapped = test.wrap(authRegister);
      const result = await wrapped({
        email: "test@example.com",
        password: "ValidPass123!",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "invalid-phone"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Registration failed");
    });

    it("should reject registration with invalid date of birth", async () => {
      const wrapped = test.wrap(authRegister);
      const result = await wrapped({
        email: "test@example.com",
        password: "ValidPass123!",
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "invalid-date"
      }, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Registration failed");
    });
  });

  describe("authLogout", () => {
    it("should handle logout for authenticated user", async () => {
      const wrapped = test.wrap(authLogout);
      const result = await wrapped({}, {
        auth: { uid: "test-user-id" }
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

  describe("authSession", () => {
    it("should validate session for authenticated user", async () => {
      const wrapped = test.wrap(authSession);
      const result = await wrapped({}, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.true;
      expect(result.message).to.equal("Session valid");
      expect(result.data).to.have.property("uid", "test-user-id");
    });

    it("should reject session validation for unauthenticated user", async () => {
      const wrapped = test.wrap(authSession);
      const result = await wrapped({}, {});

      expect(result.success).to.be.false;
      expect(result.message).to.equal("Session invalid");
    });
  });

  describe("authRefresh", () => {
    it("should handle token refresh", async () => {
      const wrapped = test.wrap(authRefresh);
      const result = await wrapped({}, {
        auth: { uid: "test-user-id" }
      });

      expect(result.success).to.be.true;
      expect(result.message).to.equal("Token refreshed");
    });
  });
}); 