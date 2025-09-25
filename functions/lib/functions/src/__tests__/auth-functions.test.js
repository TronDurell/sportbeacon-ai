"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_functions_test_1 = __importDefault(require("firebase-functions-test"));
const chai_1 = require("chai");
const index_1 = require("../index");
const test = (0, firebase_functions_test_1.default)();
describe("Authentication Functions", () => {
    let admin;
    beforeAll(() => {
        admin = test.admin;
    });
    afterAll(() => {
        test.cleanup();
    });
    describe("authLogin", () => {
        it("should handle valid login attempt", async () => {
            const wrapped = test.wrap(index_1.authLogin);
            const result = await wrapped({
                email: "test@example.com",
                password: "ValidPass123!"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Login successful");
            (0, chai_1.expect)(result.data).to.have.property("user");
            (0, chai_1.expect)(result.data.user).to.have.property("email", "test@example.com");
        });
        it("should reject login with invalid email format", async () => {
            const wrapped = test.wrap(index_1.authLogin);
            const result = await wrapped({
                email: "invalid-email",
                password: "ValidPass123!"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Login failed");
        });
        it("should reject login with weak password", async () => {
            const wrapped = test.wrap(index_1.authLogin);
            const result = await wrapped({
                email: "test@example.com",
                password: "weak"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Login failed");
        });
        it("should reject login with missing email", async () => {
            const wrapped = test.wrap(index_1.authLogin);
            const result = await wrapped({
                password: "ValidPass123!"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Login failed");
        });
        it("should reject login with missing password", async () => {
            const wrapped = test.wrap(index_1.authLogin);
            const result = await wrapped({
                email: "test@example.com"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Login failed");
        });
        it("should reject login with invalid data type", async () => {
            const wrapped = test.wrap(index_1.authLogin);
            const result = await wrapped("invalid-data", {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Login failed");
        });
    });
    describe("authRegister", () => {
        it("should handle valid registration", async () => {
            const wrapped = test.wrap(index_1.authRegister);
            const result = await wrapped({
                email: "newuser@example.com",
                password: "ValidPass123!",
                firstName: "John",
                lastName: "Doe",
                role: "parent"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Registration successful");
            (0, chai_1.expect)(result.data).to.have.property("user");
            (0, chai_1.expect)(result.data.user).to.have.property("email", "newuser@example.com");
        });
        it("should reject registration with invalid email", async () => {
            const wrapped = test.wrap(index_1.authRegister);
            const result = await wrapped({
                email: "invalid-email",
                password: "ValidPass123!",
                firstName: "John",
                lastName: "Doe"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Registration failed");
        });
        it("should reject registration with weak password", async () => {
            const wrapped = test.wrap(index_1.authRegister);
            const result = await wrapped({
                email: "test@example.com",
                password: "weak",
                firstName: "John",
                lastName: "Doe"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Registration failed");
        });
        it("should reject registration with invalid role", async () => {
            const wrapped = test.wrap(index_1.authRegister);
            const result = await wrapped({
                email: "test@example.com",
                password: "ValidPass123!",
                firstName: "John",
                lastName: "Doe",
                role: "invalid-role"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Registration failed");
        });
        it("should reject registration with invalid phone number", async () => {
            const wrapped = test.wrap(index_1.authRegister);
            const result = await wrapped({
                email: "test@example.com",
                password: "ValidPass123!",
                firstName: "John",
                lastName: "Doe",
                phoneNumber: "invalid-phone"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Registration failed");
        });
        it("should reject registration with invalid date of birth", async () => {
            const wrapped = test.wrap(index_1.authRegister);
            const result = await wrapped({
                email: "test@example.com",
                password: "ValidPass123!",
                firstName: "John",
                lastName: "Doe",
                dateOfBirth: "invalid-date"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Registration failed");
        });
    });
    describe("authLogout", () => {
        it("should handle logout for authenticated user", async () => {
            const wrapped = test.wrap(index_1.authLogout);
            const result = await wrapped({}, {
                auth: { uid: "test-user-id" }
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
    describe("authSession", () => {
        it("should validate session for authenticated user", async () => {
            const wrapped = test.wrap(index_1.authSession);
            const result = await wrapped({}, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Session valid");
            (0, chai_1.expect)(result.data).to.have.property("uid", "test-user-id");
        });
        it("should reject session validation for unauthenticated user", async () => {
            const wrapped = test.wrap(index_1.authSession);
            const result = await wrapped({}, {});
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Session invalid");
        });
    });
    describe("authRefresh", () => {
        it("should handle token refresh", async () => {
            const wrapped = test.wrap(index_1.authRefresh);
            const result = await wrapped({}, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Token refreshed");
        });
    });
});
//# sourceMappingURL=auth-functions.test.js.map