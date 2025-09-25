"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_functions_test_1 = __importDefault(require("firebase-functions-test"));
const chai_1 = require("chai");
const index_1 = require("../index");
const test = (0, firebase_functions_test_1.default)();
describe("Video Functions", () => {
    let admin;
    beforeAll(() => {
        admin = test.admin;
    });
    afterAll(() => {
        test.cleanup();
    });
    beforeEach(async () => {
        // Setup test data
        await admin.firestore().collection("videos").doc("test-video-id").set({
            fileName: "test-video.mp4",
            fileSize: 1024000,
            fileType: "video/mp4",
            status: "processing",
            createdAt: new Date()
        });
    });
    afterEach(async () => {
        // Clean up test data
        await admin.firestore().collection("videos").doc("test-video-id").delete();
    });
    describe("videoInit", () => {
        it("should initialize video upload with valid parameters", async () => {
            const wrapped = test.wrap(index_1.videoInit);
            const result = await wrapped({
                fileName: "new-video.mp4",
                fileSize: 2048000,
                fileType: "video/mp4",
                playerId: "test-player-id",
                sessionId: "test-session-123"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Video initialized");
            (0, chai_1.expect)(result.data).to.have.property("fileName", "new-video.mp4");
        });
        it("should reject request with invalid file name", async () => {
            const wrapped = test.wrap(index_1.videoInit);
            const result = await wrapped({
                fileName: "../malicious-file.mp4",
                fileSize: 1024000,
                fileType: "video/mp4"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video init failed");
        });
        it("should reject request with file too large", async () => {
            const wrapped = test.wrap(index_1.videoInit);
            const result = await wrapped({
                fileName: "large-video.mp4",
                fileSize: 600 * 1024 * 1024,
                fileType: "video/mp4"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video init failed");
        });
        it("should reject request with invalid file type", async () => {
            const wrapped = test.wrap(index_1.videoInit);
            const result = await wrapped({
                fileName: "document.pdf",
                fileSize: 1024000,
                fileType: "application/pdf"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video init failed");
        });
        it("should reject request with invalid player ID format", async () => {
            const wrapped = test.wrap(index_1.videoInit);
            const result = await wrapped({
                fileName: "test-video.mp4",
                fileSize: 1024000,
                fileType: "video/mp4",
                playerId: "invalid-uuid"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video init failed");
        });
        it("should reject request with missing required fields", async () => {
            const wrapped = test.wrap(index_1.videoInit);
            const result = await wrapped({
                fileSize: 1024000,
                fileType: "video/mp4"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video init failed");
        });
    });
    describe("videoComplete", () => {
        it("should complete video processing with valid parameters", async () => {
            const wrapped = test.wrap(index_1.videoComplete);
            const result = await wrapped({
                videoId: "test-video-id",
                status: "completed",
                results: {
                    analysisScore: 85,
                    keyPoints: ["Good form", "Needs improvement on follow-through"]
                }
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Video completed");
            (0, chai_1.expect)(result.data).to.have.property("videoId", "test-video-id");
        });
        it("should reject request with invalid UUID format", async () => {
            const wrapped = test.wrap(index_1.videoComplete);
            const result = await wrapped({
                videoId: "invalid-uuid",
                status: "completed"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video completion failed");
        });
        it("should reject request with invalid status", async () => {
            const wrapped = test.wrap(index_1.videoComplete);
            const result = await wrapped({
                videoId: "test-video-id",
                status: "invalid-status"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video completion failed");
        });
        it("should reject request with invalid analysis score", async () => {
            const wrapped = test.wrap(index_1.videoComplete);
            const result = await wrapped({
                videoId: "test-video-id",
                status: "completed",
                results: {
                    analysisScore: 150 // Exceeds max of 100
                }
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video completion failed");
        });
        it("should reject request with invalid key points format", async () => {
            const wrapped = test.wrap(index_1.videoComplete);
            const result = await wrapped({
                videoId: "test-video-id",
                status: "completed",
                results: {
                    keyPoints: "not-an-array"
                }
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video completion failed");
        });
    });
    describe("videoAnalyze", () => {
        it("should analyze video with valid parameters", async () => {
            const wrapped = test.wrap(index_1.videoAnalyze);
            const result = await wrapped({
                videoId: "test-video-id",
                analysisType: "pose",
                parameters: {
                    confidence: 0.8,
                    includeHeatmap: true
                },
                priority: "high"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.true;
            (0, chai_1.expect)(result.message).to.equal("Video analyzed");
            (0, chai_1.expect)(result.data).to.have.property("videoId", "test-video-id");
        });
        it("should reject request with invalid UUID format", async () => {
            const wrapped = test.wrap(index_1.videoAnalyze);
            const result = await wrapped({
                videoId: "invalid-uuid",
                analysisType: "pose"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video analysis failed");
        });
        it("should reject request with invalid analysis type", async () => {
            const wrapped = test.wrap(index_1.videoAnalyze);
            const result = await wrapped({
                videoId: "test-video-id",
                analysisType: "invalid-type"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video analysis failed");
        });
        it("should reject request with invalid confidence value", async () => {
            const wrapped = test.wrap(index_1.videoAnalyze);
            const result = await wrapped({
                videoId: "test-video-id",
                analysisType: "pose",
                parameters: {
                    confidence: 1.5 // Exceeds max of 1.0
                }
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video analysis failed");
        });
        it("should reject request with invalid priority", async () => {
            const wrapped = test.wrap(index_1.videoAnalyze);
            const result = await wrapped({
                videoId: "test-video-id",
                analysisType: "pose",
                priority: "invalid-priority"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video analysis failed");
        });
        it("should reject request with missing required fields", async () => {
            const wrapped = test.wrap(index_1.videoAnalyze);
            const result = await wrapped({
                videoId: "test-video-id"
            }, {
                auth: { uid: "test-user-id" }
            });
            (0, chai_1.expect)(result.success).to.be.false;
            (0, chai_1.expect)(result.message).to.equal("Video analysis failed");
        });
    });
});
//# sourceMappingURL=video-functions.test.js.map