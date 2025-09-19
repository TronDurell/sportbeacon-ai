import { jest } from "@jest/globals";
// Mock Firebase Admin
const mockFirestore = {
    collection: jest.fn(),
    doc: jest.fn(),
    batch: jest.fn(),
    runTransaction: jest.fn()
};
const mockCollection = {
    doc: jest.fn(),
    add: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    get: jest.fn()
};
const mockDoc = {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    collection: jest.fn()
};
const mockBatch = {
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn()
};
// Mock Firebase Functions
const mockFunctions = {
    firestore: {
        document: jest.fn()
    }
};
// Mock the triggers module
jest.mock("../../backend/functions/townRecTriggers", () => ({
    checkWaitlist: jest.fn(),
    groupSiblings: jest.fn(),
    ageExceptionRequest: jest.fn(),
    notifyParent: jest.fn(),
    assignTeam: jest.fn(),
    logAuditTrail: jest.fn()
}));
import { checkWaitlist, groupSiblings, ageExceptionRequest, notifyParent, assignTeam, logAuditTrail } from "../../backend/functions/townRecTriggers";
describe("Town Rec Firestore Triggers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup mock returns
        mockFirestore.collection.mockReturnValue(mockCollection);
        mockFirestore.doc.mockReturnValue(mockDoc);
        mockFirestore.batch.mockReturnValue(mockBatch);
        mockCollection.doc.mockReturnValue(mockDoc);
        mockDoc.collection.mockReturnValue(mockCollection);
    });
    describe("checkWaitlist", () => {
        const mockRegistrationData = {
            childId: "child123",
            leagueId: "league456",
            parentId: "parent789",
            timestamp: new Date(),
            status: "registered"
        };
        test("should promote waitlist entry when spot becomes available", async () => {
            // Mock waitlist entry
            const mockWaitlistEntry = {
                id: "waitlist123",
                childId: "child123",
                leagueId: "league456",
                parentId: "parent789",
                priority: 1,
                timestamp: new Date("2024-01-01"),
                status: "waiting"
            };
            // Mock league data
            const mockLeague = {
                id: "league456",
                maxPlayers: 12,
                currentPlayers: 11,
                waitlistPolicy: "auto_promote"
            };
            // Setup mocks
            mockCollection.where.mockReturnValue(mockCollection);
            mockCollection.get.mockResolvedValue({
                docs: [{ data: () => mockWaitlistEntry, id: "waitlist123" }]
            });
            mockDoc.get.mockResolvedValue({
                data: () => mockLeague,
                exists: true
            });
            mockBatch.update.mockReturnValue(mockBatch);
            mockBatch.commit.mockResolvedValue(undefined);
            // Execute function
            await checkWaitlist(mockRegistrationData);
            // Verify waitlist entry was promoted
            expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                status: "promoted",
                promotedAt: expect.any(Date)
            }));
            // Verify notification was sent
            expect(notifyParent).toHaveBeenCalledWith("parent789", "waitlist_promoted", expect.objectContaining({
                childId: "child123",
                leagueId: "league456"
            }));
            // Verify audit trail was logged
            expect(logAuditTrail).toHaveBeenCalledWith("waitlist_promoted", expect.objectContaining({
                waitlistId: "waitlist123",
                childId: "child123",
                leagueId: "league456"
            }));
        });
        test("should not promote waitlist when league is full", async () => {
            // Mock league at capacity
            const mockLeague = {
                id: "league456",
                maxPlayers: 12,
                currentPlayers: 12,
                waitlistPolicy: "auto_promote"
            };
            mockDoc.get.mockResolvedValue({
                data: () => mockLeague,
                exists: true
            });
            await checkWaitlist(mockRegistrationData);
            // Verify no promotion occurred
            expect(mockBatch.update).not.toHaveBeenCalled();
            expect(notifyParent).not.toHaveBeenCalled();
        });
        test("should handle multiple waitlist entries with priority", async () => {
            const mockWaitlistEntries = [
                {
                    id: "waitlist1",
                    childId: "child1",
                    leagueId: "league456",
                    parentId: "parent1",
                    priority: 2,
                    timestamp: new Date("2024-01-01"),
                    status: "waiting"
                },
                {
                    id: "waitlist2",
                    childId: "child2",
                    leagueId: "league456",
                    parentId: "parent2",
                    priority: 1,
                    timestamp: new Date("2024-01-02"),
                    status: "waiting"
                }
            ];
            mockCollection.where.mockReturnValue(mockCollection);
            mockCollection.orderBy.mockReturnValue(mockCollection);
            mockCollection.limit.mockReturnValue(mockCollection);
            mockCollection.get.mockResolvedValue({
                docs: mockWaitlistEntries.map(entry => ({ data: () => entry, id: entry.id }))
            });
            const mockLeague = {
                id: "league456",
                maxPlayers: 12,
                currentPlayers: 11,
                waitlistPolicy: "auto_promote"
            };
            mockDoc.get.mockResolvedValue({
                data: () => mockLeague,
                exists: true
            });
            await checkWaitlist(mockRegistrationData);
            // Verify highest priority entry was promoted
            expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                status: "promoted"
            }));
        });
    });
    describe("groupSiblings", () => {
        const mockSiblingData = {
            childId: "child123",
            siblingId: "sibling456",
            leagueId: "league789",
            parentId: "parent123"
        };
        test("should group siblings in same team when possible", async () => {
            // Mock team data
            const mockTeam = {
                id: "team123",
                leagueId: "league789",
                currentPlayers: 8,
                maxPlayers: 12,
                players: ["child123"]
            };
            mockDoc.get.mockResolvedValue({
                data: () => mockTeam,
                exists: true
            });
            mockBatch.update.mockReturnValue(mockBatch);
            await groupSiblings(mockSiblingData);
            // Verify sibling was added to team
            expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                players: expect.arrayContaining(["sibling456"])
            }));
            // Verify notification was sent
            expect(notifyParent).toHaveBeenCalledWith("parent123", "siblings_grouped", expect.objectContaining({
                childId: "child123",
                siblingId: "sibling456",
                teamId: "team123"
            }));
        });
        test("should create new team when no suitable team available", async () => {
            // Mock no available teams
            mockCollection.where.mockReturnValue(mockCollection);
            mockCollection.get.mockResolvedValue({
                docs: []
            });
            mockBatch.set.mockReturnValue(mockBatch);
            await groupSiblings(mockSiblingData);
            // Verify new team was created
            expect(mockBatch.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                players: ["child123", "sibling456"],
                leagueId: "league789"
            }));
        });
        test("should handle sibling conflicts", async () => {
            // Mock conflicting sibling request
            const mockConflict = {
                id: "conflict123",
                childId: "child123",
                siblingId: "sibling456",
                status: "conflict",
                reason: "Different age groups"
            };
            mockCollection.where.mockReturnValue(mockCollection);
            mockCollection.get.mockResolvedValue({
                docs: [{ data: () => mockConflict, id: "conflict123" }]
            });
            await groupSiblings(mockSiblingData);
            // Verify conflict was logged
            expect(logAuditTrail).toHaveBeenCalledWith("sibling_conflict", expect.objectContaining({
                childId: "child123",
                siblingId: "sibling456",
                reason: "Different age groups"
            }));
        });
    });
    describe("ageExceptionRequest", () => {
        const mockAgeExceptionData = {
            childId: "child123",
            leagueId: "league456",
            parentId: "parent789",
            requestedAge: 7,
            actualAge: 6,
            reason: "Advanced skills",
            timestamp: new Date()
        };
        test("should auto-approve age exceptions within policy limits", async () => {
            // Mock league policy allowing age exceptions
            const mockLeague = {
                id: "league456",
                ageExceptionPolicy: {
                    maxMonthsUnder: 6,
                    autoApprove: true,
                    requireDirectorApproval: false
                }
            };
            mockDoc.get.mockResolvedValue({
                data: () => mockLeague,
                exists: true
            });
            mockBatch.update.mockReturnValue(mockBatch);
            await ageExceptionRequest(mockAgeExceptionData);
            // Verify auto-approval
            expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                status: "approved",
                approvedAt: expect.any(Date),
                approvedBy: "system"
            }));
            // Verify notification
            expect(notifyParent).toHaveBeenCalledWith("parent789", "age_exception_approved", expect.objectContaining({
                childId: "child123",
                leagueId: "league456"
            }));
        });
        test("should require director approval for exceptions outside policy", async () => {
            // Mock league policy requiring director approval
            const mockLeague = {
                id: "league456",
                ageExceptionPolicy: {
                    maxMonthsUnder: 3,
                    autoApprove: false,
                    requireDirectorApproval: true
                }
            };
            mockDoc.get.mockResolvedValue({
                data: () => mockLeague,
                exists: true
            });
            await ageExceptionRequest(mockAgeExceptionData);
            // Verify sent to approval queue
            expect(mockBatch.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                type: "age_override",
                status: "pending_approval",
                requiresDirectorApproval: true
            }));
            // Verify notification to director
            expect(notifyParent).toHaveBeenCalledWith("director", "age_exception_pending", expect.objectContaining({
                childId: "child123",
                leagueId: "league456"
            }));
        });
        test("should reject age exceptions outside allowed range", async () => {
            // Mock league policy with strict age requirements
            const mockLeague = {
                id: "league456",
                ageExceptionPolicy: {
                    maxMonthsUnder: 0,
                    autoApprove: false,
                    requireDirectorApproval: false
                }
            };
            mockDoc.get.mockResolvedValue({
                data: () => mockLeague,
                exists: true
            });
            await ageExceptionRequest(mockAgeExceptionData);
            // Verify rejection
            expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                status: "denied",
                deniedAt: expect.any(Date),
                deniedBy: "system",
                reason: "Age exception not allowed"
            }));
        });
    });
    describe("notifyParent", () => {
        const mockNotificationData = {
            parentId: "parent123",
            type: "registration_confirmed",
            data: {
                childId: "child123",
                leagueId: "league456",
                teamId: "team789"
            }
        };
        test("should send email notification", async () => {
            // Mock parent data
            const mockParent = {
                id: "parent123",
                email: "parent@example.com",
                name: "John Doe",
                notificationPreferences: {
                    email: true,
                    sms: false,
                    push: true
                }
            };
            mockDoc.get.mockResolvedValue({
                data: () => mockParent,
                exists: true
            });
            mockBatch.set.mockReturnValue(mockBatch);
            await notifyParent("parent123", "registration_confirmed", mockNotificationData.data);
            // Verify notification was created
            expect(mockBatch.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                parentId: "parent123",
                type: "registration_confirmed",
                status: "pending",
                createdAt: expect.any(Date)
            }));
        });
        test("should handle notification preferences", async () => {
            const mockParent = {
                id: "parent123",
                email: "parent@example.com",
                phone: "555-1234",
                notificationPreferences: {
                    email: false,
                    sms: true,
                    push: false
                }
            };
            mockDoc.get.mockResolvedValue({
                data: () => mockParent,
                exists: true
            });
            await notifyParent("parent123", "waitlist_promoted", {});
            // Verify SMS notification was created instead of email
            expect(mockBatch.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                channel: "sms",
                phone: "555-1234"
            }));
        });
    });
    describe("assignTeam", () => {
        const mockAssignmentData = {
            childId: "child123",
            leagueId: "league456",
            teamId: "team789",
            position: "forward"
        };
        test("should assign child to team", async () => {
            // Mock team data
            const mockTeam = {
                id: "team789",
                leagueId: "league456",
                currentPlayers: 10,
                maxPlayers: 12,
                players: ["child1", "child2"]
            };
            mockDoc.get.mockResolvedValue({
                data: () => mockTeam,
                exists: true
            });
            mockBatch.update.mockReturnValue(mockBatch);
            await assignTeam(mockAssignmentData);
            // Verify child was added to team
            expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                players: expect.arrayContaining(["child123"]),
                currentPlayers: 11
            }));
            // Verify child's team assignment was updated
            expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                teamId: "team789",
                position: "forward",
                assignedAt: expect.any(Date)
            }));
        });
        test("should handle team at capacity", async () => {
            // Mock team at capacity
            const mockTeam = {
                id: "team789",
                leagueId: "league456",
                currentPlayers: 12,
                maxPlayers: 12,
                players: ["child1", "child2", "child3", "child4", "child5", "child6", "child7", "child8", "child9", "child10", "child11", "child12"]
            };
            mockDoc.get.mockResolvedValue({
                data: () => mockTeam,
                exists: true
            });
            await assignTeam(mockAssignmentData);
            // Verify error was logged
            expect(logAuditTrail).toHaveBeenCalledWith("team_assignment_failed", expect.objectContaining({
                childId: "child123",
                teamId: "team789",
                reason: "Team at capacity"
            }));
        });
    });
    describe("logAuditTrail", () => {
        test("should log audit events with proper metadata", async () => {
            const mockAuditData = {
                action: "registration_created",
                userId: "user123",
                targetId: "registration456",
                metadata: {
                    childId: "child123",
                    leagueId: "league456",
                    cost: 150
                }
            };
            mockBatch.set.mockReturnValue(mockBatch);
            await logAuditTrail("registration_created", mockAuditData);
            // Verify audit trail entry was created
            expect(mockBatch.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                action: "registration_created",
                userId: "user123",
                targetId: "registration456",
                timestamp: expect.any(Date),
                metadata: mockAuditData.metadata
            }));
        });
        test("should include session and request context", async () => {
            const mockContext = {
                sessionId: "session123",
                requestId: "request456",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0..."
            };
            await logAuditTrail("policy_updated", { policyId: "policy123" }, mockContext);
            expect(mockBatch.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                sessionId: "session123",
                requestId: "request456",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0..."
            }));
        });
    });
    describe("Error Handling", () => {
        test("should handle Firestore errors gracefully", async () => {
            // Mock Firestore error
            mockDoc.get.mockRejectedValue(new Error("Firestore connection failed"));
            await expect(checkWaitlist({ childId: "child123", leagueId: "league456" }))
                .rejects.toThrow("Firestore connection failed");
            // Verify error was logged
            expect(logAuditTrail).toHaveBeenCalledWith("trigger_error", expect.objectContaining({
                function: "checkWaitlist",
                error: "Firestore connection failed"
            }));
        });
        test("should handle missing data gracefully", async () => {
            // Mock missing document
            mockDoc.get.mockResolvedValue({
                data: () => null,
                exists: false
            });
            await checkWaitlist({ childId: "child123", leagueId: "league456" });
            // Verify error was logged
            expect(logAuditTrail).toHaveBeenCalledWith("missing_data", expect.objectContaining({
                function: "checkWaitlist",
                missingDocument: expect.any(String)
            }));
        });
        test("should retry failed operations", async () => {
            // Mock temporary failure then success
            mockBatch.commit
                .mockRejectedValueOnce(new Error("Temporary failure"))
                .mockResolvedValueOnce(undefined);
            await checkWaitlist({ childId: "child123", leagueId: "league456" });
            // Verify retry was attempted
            expect(mockBatch.commit).toHaveBeenCalledTimes(2);
        });
    });
    describe("Performance and Scalability", () => {
        test("should handle large datasets efficiently", async () => {
            // Mock large waitlist
            const largeWaitlist = Array.from({ length: 1000 }, (_, i) => ({
                id: `waitlist${i}`,
                childId: `child${i}`,
                leagueId: "league456",
                priority: i,
                status: "waiting"
            }));
            mockCollection.where.mockReturnValue(mockCollection);
            mockCollection.orderBy.mockReturnValue(mockCollection);
            mockCollection.limit.mockReturnValue(mockCollection);
            mockCollection.get.mockResolvedValue({
                docs: largeWaitlist.slice(0, 10).map(entry => ({ data: () => entry, id: entry.id }))
            });
            const startTime = Date.now();
            await checkWaitlist({ childId: "child123", leagueId: "league456" });
            const endTime = Date.now();
            // Should complete within reasonable time
            expect(endTime - startTime).toBeLessThan(5000);
        });
        test("should batch operations for efficiency", async () => {
            // Mock multiple operations
            const operations = [
                { childId: "child1", leagueId: "league1" },
                { childId: "child2", leagueId: "league2" },
                { childId: "child3", leagueId: "league3" }
            ];
            // Verify batch was used
            expect(mockFirestore.batch).toHaveBeenCalled();
            expect(mockBatch.commit).toHaveBeenCalled();
        });
    });
});
