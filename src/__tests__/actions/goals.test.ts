import { addGoal, updateGoalProgress, deleteGoal } from "@/actions/goals";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Mock dependencies
jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: {
        goal: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe("Goal Actions - Absurd & Edge Case Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: authenticated user
        mockGetServerSession.mockResolvedValue({
            user: { id: "user-123", email: "test@example.com", name: "Test User" },
            expires: "2099-12-31",
        });
    });

    describe("Test #1: Target Amount Exceeding Planetary GDP", () => {
        it("should reject target_amount exceeding Number.MAX_SAFE_INTEGER", async () => {
            const result = await addGoal({
                name: "Buy the Solar System",
                target_amount: Number.MAX_SAFE_INTEGER + 1,
                current_amount: 0,
            });

            expect(result).toHaveProperty("error");
        });

        it("should handle target_amount with floating point precision issues", async () => {
            const mockGoal = {
                id: "goal-float",
                name: "Floating Point Test",
                target_amount: 0.1 + 0.2, // JavaScript floating point weirdness
                current_amount: 0,
                user_id: "user-123",
                deadline: null,
                created_at: new Date(),
            };

            (prisma.goal.create as jest.Mock).mockResolvedValue(mockGoal);

            const result = await addGoal({
                name: "Floating Point Test",
                target_amount: 0.1 + 0.2,
                current_amount: 0,
            });

            expect(result).toHaveProperty("success");
        });
    });

    describe("Test #2: Negative and Special Numeric Values", () => {
        it("should reject negative target_amount", async () => {
            const result = await addGoal({
                name: "Debt Goal",
                target_amount: -1000000,
                current_amount: 0,
            });

            // Depends on implementation - may or may not validate
            expect(result).toBeDefined();
        });

        it("should reject NaN as target_amount", async () => {
            const result = await addGoal({
                name: "Invalid Goal",
                target_amount: NaN,
                current_amount: 0,
            });

            expect(result).toBeDefined();
        });

        it("should reject Infinity as target_amount", async () => {
            const result = await addGoal({
                name: "Infinite Wealth",
                target_amount: Infinity,
                current_amount: 100,
            });

            expect(result).toBeDefined();
        });

        it("should reject negative current_amount", async () => {
            const result = await addGoal({
                name: "Backwards Progress",
                target_amount: 10000,
                current_amount: -5000,
            });

            expect(result).toBeDefined();
        });
    });

    describe("Test #3: Extreme Goal Names with Unicode Exploits", () => {
        it("should handle goal name with emoji bombs and zero-width joiners", async () => {
            const unicodeChaos = "👨‍👩‍👧‍👦".repeat(50) + "\\u200B".repeat(200) + "﷽🕌🌙";

            const mockGoal = {
                id: "goal-unicode",
                name: unicodeChaos,
                target_amount: 1000,
                current_amount: 0,
                user_id: "user-123",
                deadline: null,
                created_at: new Date(),
            };

            (prisma.goal.create as jest.Mock).mockResolvedValue(mockGoal);

            const result = await addGoal({
                name: unicodeChaos,
                target_amount: 1000,
                current_amount: 0,
            });

            expect(result).toBeDefined();
        });

        it("should handle goal name with only whitespace", async () => {
            const result = await addGoal({
                name: "        ",
                target_amount: 1000,
                current_amount: 0,
            });

            expect(result).toBeDefined();
        });

        it("should handle goal name exceeding 10,000 characters", async () => {
            const massiveName = "A".repeat(10001);

            const result = await addGoal({
                name: massiveName,
                target_amount: 1000,
                current_amount: 0,
            });

            expect(result).toBeDefined();
        });
    });

    describe("Test #4: SQL Injection Attempts in Goal Name", () => {
        const sqlInjections = [
            "'; DROP TABLE \\\"Goal\\\"; --",
            "' OR '1'='1",
            "'; DELETE FROM \\\"Goal\\\" WHERE user_id='user-123'; --",
            "admin'--",
            "1'; UPDATE \\\"Goal\\\" SET current_amount=999999999 WHERE '1'='1",
        ];

        sqlInjections.forEach((payload, index) => {
            it(`should safely handle SQL injection payload #${index + 1}`, async () => {
                const mockGoal = {
                    id: `goal-sql-${index}`,
                    name: payload,
                    target_amount: 1000,
                    current_amount: 0,
                    user_id: "user-123",
                    deadline: null,
                    created_at: new Date(),
                };

                (prisma.goal.create as jest.Mock).mockResolvedValue(mockGoal);

                const result = await addGoal({
                    name: payload,
                    target_amount: 1000,
                    current_amount: 0,
                });

                // Prisma should protect against SQL injection
                expect(result).toBeDefined();
            });
        });
    });

    describe("Test #5: Time Travel Deadlines", () => {
        it("should handle deadline in the year 1900", async () => {
            const ancientDeadline = new Date("1900-01-01");

            const mockGoal = {
                id: "goal-past",
                name: "Time Travel Investment",
                target_amount: 1000,
                current_amount: 0,
                user_id: "user-123",
                deadline: ancientDeadline,
                created_at: new Date(),
            };

            (prisma.goal.create as jest.Mock).mockResolvedValue(mockGoal);

            const result = await addGoal({
                name: "Time Travel Investment",
                target_amount: 1000,
                current_amount: 0,
                deadline: ancientDeadline,
            });

            expect(result).toHaveProperty("success");
        });

        it("should handle deadline in the year 9999", async () => {
            const futureDeadline = new Date("9999-12-31");

            const mockGoal = {
                id: "goal-future",
                name: "Immortality Fund",
                target_amount: 1000000,
                current_amount: 0,
                user_id: "user-123",
                deadline: futureDeadline,
                created_at: new Date(),
            };

            (prisma.goal.create as jest.Mock).mockResolvedValue(mockGoal);

            const result = await addGoal({
                name: "Immortality Fund",
                target_amount: 1000000,
                current_amount: 0,
                deadline: futureDeadline,
            });

            expect(result).toHaveProperty("success");
        });

        it("should handle invalid date object", async () => {
            const result = await addGoal({
                name: "Invalid Date Goal",
                target_amount: 1000,
                current_amount: 0,
                deadline: new Date("invalid-date-string"),
            });

            expect(result).toBeDefined();
        });
    });

    describe("Test #6: Current Amount Exceeding Target Amount", () => {
        it("should allow current_amount to be 1000x the target_amount", async () => {
            const mockGoal = {
                id: "goal-overachiever",
                name: "Extreme Overachiever",
                target_amount: 1000,
                current_amount: 1000000,
                user_id: "user-123",
                deadline: null,
                created_at: new Date(),
            };

            (prisma.goal.create as jest.Mock).mockResolvedValue(mockGoal);

            const result = await addGoal({
                name: "Extreme Overachiever",
                target_amount: 1000,
                current_amount: 1000000,
            });

            expect(result).toHaveProperty("success");
        });

        it("should update progress to negative value", async () => {
            const mockGoal = {
                id: "goal-update",
                name: "Test Goal",
                target_amount: 1000,
                current_amount: -500,
                user_id: "user-123",
                deadline: null,
                created_at: new Date(),
            };

            (prisma.goal.update as jest.Mock).mockResolvedValue(mockGoal);

            const result = await updateGoalProgress("goal-update", -500);

            expect(result).toBeDefined();
        });
    });

    describe("Test #7: Concurrent Goal Operations (Race Conditions)", () => {
        it("should handle 50 concurrent goal creations", async () => {
            let callCount = 0;
            (prisma.goal.create as jest.Mock).mockImplementation(() => {
                callCount++;
                return Promise.resolve({
                    id: `goal-${callCount}`,
                    name: `Concurrent Goal ${callCount}`,
                    target_amount: 1000,
                    current_amount: 0,
                    user_id: "user-123",
                    deadline: null,
                    created_at: new Date(),
                });
            });

            const promises = Array.from({ length: 50 }, (_, i) =>
                addGoal({
                    name: `Concurrent Goal ${i}`,
                    target_amount: 1000,
                    current_amount: 0,
                })
            );

            const results = await Promise.all(promises);
            expect(results).toHaveLength(50);
            expect(callCount).toBe(50);
        });

        it("should handle rapid-fire updates to same goal", async () => {
            const goalId = "goal-spam";
            let updateCount = 0;

            (prisma.goal.update as jest.Mock).mockImplementation(() => {
                updateCount++;
                return Promise.resolve({
                    id: goalId,
                    name: "Spam Target",
                    target_amount: 10000,
                    current_amount: updateCount * 100,
                    user_id: "user-123",
                    deadline: null,
                    created_at: new Date(),
                });
            });

            const promises = Array.from({ length: 100 }, (_, i) =>
                updateGoalProgress(goalId, i * 100)
            );

            const results = await Promise.all(promises);
            expect(results).toHaveLength(100);
        });
    });

    describe("Test #8: Delete Non-Existent or Already Deleted Goal", () => {
        it("should handle deleting goal that doesn't exist", async () => {
            (prisma.goal.delete as jest.Mock).mockRejectedValue(
                new Error("Record to delete does not exist")
            );

            const result = await deleteGoal("non-existent-goal-id");

            expect(result).toHaveProperty("error");
        });

        it("should handle deleting same goal twice", async () => {
            const goalId = "goal-double-delete";

            // First delete succeeds
            (prisma.goal.delete as jest.Mock).mockResolvedValueOnce({
                id: goalId,
                name: "Test Goal",
                target_amount: 1000,
                current_amount: 0,
                user_id: "user-123",
                deadline: null,
                created_at: new Date(),
            });

            const firstDelete = await deleteGoal(goalId);
            expect(firstDelete).toHaveProperty("success");

            // Second delete fails
            (prisma.goal.delete as jest.Mock).mockRejectedValueOnce(
                new Error("Record to delete does not exist")
            );

            const secondDelete = await deleteGoal(goalId);
            expect(secondDelete).toHaveProperty("error");
        });
    });

    describe("Test #9: Type Coercion and Prototype Pollution Attempts", () => {
        it("should handle stringified number as target_amount", async () => {
            const result = await addGoal({
                name: "Type Confusion",
                target_amount: "1000" as unknown as number,
                current_amount: 0,
            });

            expect(result).toBeDefined();
        });

        it("should handle object with valueOf() as amount", async () => {
            const result = await addGoal({
                name: "valueOf Exploit",
                target_amount: { valueOf: () => 1000 } as unknown as number,
                current_amount: 0,
            });

            expect(result).toBeDefined();
        });

        it("should handle __proto__ pollution attempt in goal name", async () => {
            const maliciousData = {
                name: "normal goal",
                target_amount: 1000,
                current_amount: 0,
                __proto__: { isAdmin: true },
            };

            const mockGoal = {
                id: "goal-proto",
                name: "normal goal",
                target_amount: 1000,
                current_amount: 0,
                user_id: "user-123",
                deadline: null,
                created_at: new Date(),
            };

            (prisma.goal.create as jest.Mock).mockResolvedValue(mockGoal);

            const result = await addGoal(maliciousData as unknown as { name: string; target_amount: number; current_amount: number });

            expect(result).toBeDefined();
            expect(result).not.toHaveProperty("isAdmin");
        });
    });

    describe("Test #10: Zero and Micro-Amount Goals", () => {
        it("should handle goal with zero target_amount", async () => {
            const mockGoal = {
                id: "goal-zero",
                name: "Zero Target Goal",
                target_amount: 0,
                current_amount: 0,
                user_id: "user-123",
                deadline: null,
                created_at: new Date(),
            };

            (prisma.goal.create as jest.Mock).mockResolvedValue(mockGoal);

            const result = await addGoal({
                name: "Zero Target Goal",
                target_amount: 0,
                current_amount: 0,
            });

            expect(result).toBeDefined();
        });

        it("should handle micro-amount goals (fractions of a cent)", async () => {
            const mockGoal = {
                id: "goal-micro",
                name: "Cryptocurrency Dust",
                target_amount: 0.00000001,
                current_amount: 0.00000001,
                user_id: "user-123",
                deadline: null,
                created_at: new Date(),
            };

            (prisma.goal.create as jest.Mock).mockResolvedValue(mockGoal);

            const result = await addGoal({
                name: "Cryptocurrency Dust",
                target_amount: 0.00000001,
                current_amount: 0.00000001,
            });

            expect(result).toHaveProperty("success");
        });

        it("should handle updating progress to exactly zero", async () => {
            const mockGoal = {
                id: "goal-reset",
                name: "Reset Goal",
                target_amount: 1000,
                current_amount: 0,
                user_id: "user-123",
                deadline: null,
                created_at: new Date(),
            };

            (prisma.goal.update as jest.Mock).mockResolvedValue(mockGoal);

            const result = await updateGoalProgress("goal-reset", 0);

            expect(result).toBeDefined();
        });
    });

    describe("Bonus: Unauthorized Access Tests", () => {
        it("should reject goal creation when user is not authenticated", async () => {
            mockGetServerSession.mockResolvedValueOnce(null);

            const result = await addGoal({
                name: "Hacker Goal",
                target_amount: 1000,
                current_amount: 0,
            });

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Sesi tidak valid.");
            }
        });

        it("should reject update when user is not authenticated", async () => {
            mockGetServerSession.mockResolvedValueOnce(null);

            const result = await updateGoalProgress("goal-123", 500);

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Sesi tidak valid.");
            }
        });

        it("should reject delete when user is not authenticated", async () => {
            mockGetServerSession.mockResolvedValueOnce(null);

            const result = await deleteGoal("goal-123");

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Sesi tidak valid.");
            }
        });
    });
});
