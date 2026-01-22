import { addTransaction, deleteTransaction, getDashboardStats } from "@/actions/transactions";
import { TransactionType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: {
        transaction: {
            create: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
            groupBy: jest.fn(),
        },
        account: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        $transaction: jest.fn(),
        $queryRaw: jest.fn(),
    },
}));

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe("Transaction Actions - Absurd & Edge Case Tests (With Validation)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetServerSession.mockResolvedValue({
            user: { id: "user-123", email: "test@example.com", name: "Test User" },
            expires: "2099-12-31",
        });
    });

    describe("Amount Exceeds MAX_SAFE_INTEGER (NOW BLOCKED)", () => {
        it("should REJECT amount exceeding Number.MAX_SAFE_INTEGER", async () => {
            const result = await addTransaction({
                amount: Number.MAX_SAFE_INTEGER + 1,
                type: TransactionType.INCOME,
                category: "lottery_win",
                date: new Date(),
                account_id: "test-account-id"
            });

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Amount exceeds maximum allowed value.");
            }
        });

        it("should ACCEPT amount equal to Number.MAX_SAFE_INTEGER", async () => {
            const mockTransaction = {
                id: "txn-max",
                amount: Number.MAX_SAFE_INTEGER,
                type: TransactionType.INCOME,
                category: "big_win",
                date: new Date(),
                user_id: "user-123",
                account_id: null,
                description: null,
                created_at: new Date(),
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
                    account: { findFirst: jest.fn(), update: jest.fn() },
                };
                return await callback(mockTx);
            });

            const result = await addTransaction({
                amount: Number.MAX_SAFE_INTEGER,
                type: TransactionType.INCOME,
                category: "big_win",
                date: new Date(),
            });

            expect(result).toBeDefined();
            expect(result).not.toHaveProperty("error");
        });
    });

    describe("Negative Amount (NOW BLOCKED)", () => {
        it("should REJECT negative amount for INCOME type", async () => {
            const result = await addTransaction({
                amount: -1000000,
                type: TransactionType.INCOME,
                category: "salary",
                date: new Date(),
                account_id: "test-account-id"
            });

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Amount cannot be negative.");
            }
        });

        it("should REJECT negative amount for EXPENSE type", async () => {
            const result = await addTransaction({
                amount: -500,
                type: TransactionType.EXPENSE,
                category: "groceries",
                date: new Date(),
            });

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Amount cannot be negative.");
            }
        });

        it("should ACCEPT zero amount", async () => {
            const mockTransaction = {
                id: "txn-zero",
                amount: 0,
                type: TransactionType.EXPENSE,
                category: "free_item",
                date: new Date(),
                user_id: "user-123",
                account_id: null,
                description: null,
                created_at: new Date(),
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
                    account: { findFirst: jest.fn(), update: jest.fn() },
                };
                return await callback(mockTx);
            });

            const result = await addTransaction({
                amount: 0,
                type: TransactionType.EXPENSE,
                category: "free_item",
                date: new Date(),
            });

            expect(result).toBeDefined();
            expect(result).not.toHaveProperty("error");
        });
    });

    describe("SQL Injection Attempts (STILL SAFE)", () => {
        const injectionPayloads = [
            "'; DROP TABLE \"Transaction\"; --",
            "' OR '1'='1",
            "'; DELETE FROM \"Transaction\" WHERE '1'='1",
            "admin'--",
        ];

        injectionPayloads.forEach((payload, index) => {
            it(`should safely handle SQL injection payload #${index + 1}`, async () => {
                const mockTransaction = {
                    id: `txn-sql-${index}`,
                    amount: 1000,
                    type: TransactionType.EXPENSE,
                    category: payload,
                    date: new Date(),
                    user_id: "user-123",
                    account_id: null,
                    description: "SQL injection attempt",
                    created_at: new Date(),
                };

                (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                    const mockTx = {
                        transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
                        account: { findFirst: jest.fn(), update: jest.fn() },
                    };
                    return await callback(mockTx);
                });

                const result = await addTransaction({
                    amount: 1000,
                    type: TransactionType.EXPENSE,
                    category: payload,
                    date: new Date(),
                    description: "SQL injection attempt"
                });

                expect(result).toBeDefined();
                expect(result).not.toHaveProperty("error");
            });
        });
    });

    describe("Extreme Date Values", () => {
        it("should handle future date (year 2099)", async () => {
            const mockTransaction = {
                id: "txn-future",
                amount: 5000,
                type: TransactionType.INCOME,
                category: "time_travel_income",
                date: new Date("2099-12-31"),
                user_id: "user-123",
                account_id: "test-account-id",
                description: null,
                created_at: new Date(),
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
                    account: {
                        findFirst: jest.fn().mockResolvedValue({ id: "test-account-id", balance: 10000 }),
                        update: jest.fn().mockResolvedValue({ id: "test-account-id" }),
                    },
                };
                return await callback(mockTx);
            });

            const result = await addTransaction({
                amount: 5000,
                type: TransactionType.INCOME,
                category: "time_travel_income",
                date: new Date("2099-12-31"),
                account_id: "test-account-id"
            });

            expect(result).toBeDefined();
            expect(result).not.toHaveProperty("error");
        });

        it("should handle past date (year 1900)", async () => {
            const mockTransaction = {
                id: "txn-past",
                amount: 100,
                type: TransactionType.EXPENSE,
                category: "ancient_debt",
                date: new Date("1900-01-01"),
                user_id: "user-123",
                account_id: null,
                description: null,
                created_at: new Date(),
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
                    account: { findFirst: jest.fn(), update: jest.fn() },
                };
                return await callback(mockTx);
            });

            const result = await addTransaction({
                amount: 100,
                type: TransactionType.EXPENSE,
                category: "ancient_debt",
                date: new Date("1900-01-01"),
            });

            expect(result).toBeDefined();
            expect(result).not.toHaveProperty("error");
        });

        it("should return empty stats for dates outside current period", async () => {
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

            const stats = await getDashboardStats("year");
            expect(stats).toEqual([]);
        });
    });

    describe("Race Condition with Concurrent Transactions", () => {
        it("should handle 100 concurrent transactions to same account", async () => {
            const account_id = "race-condition-account";

            let callCount = 0;
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                callCount++;
                const mockTx = {
                    transaction: { create: jest.fn().mockResolvedValue({ id: `txn-${callCount}` }) },
                    account: {
                        findFirst: jest.fn().mockResolvedValue({ id: account_id, balance: 1000 }),
                        update: jest.fn().mockResolvedValue({ id: account_id }),
                    },
                };
                return await callback(mockTx);
            });

            const promises = Array.from({ length: 100 }, (_, i) =>
                addTransaction({
                    amount: 1,
                    type: i % 2 === 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
                    category: `concurrent_tx_${i}`,
                    date: new Date(),
                    account_id
                })
            );

            const results = await Promise.all(promises);
            expect(results).toHaveLength(100);
            expect(callCount).toBe(100);
        });
    });

    describe("Account ID Length Validation (NOW BLOCKED)", () => {
        it("should REJECT account ID exceeding 255 characters", async () => {
            const result = await addTransaction({
                amount: 1000,
                type: TransactionType.INCOME,
                category: "test",
                date: new Date(),
                account_id: "A".repeat(10000)
            });

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Account ID is too long.");
            }
        });

        it("should ACCEPT account ID with exactly 255 characters", async () => {
            const longButValidId = "A".repeat(255);
            const mockTransaction = {
                id: "txn-long-id",
                amount: 1000,
                type: TransactionType.INCOME,
                category: "test",
                date: new Date(),
                user_id: "user-123",
                account_id: longButValidId,
                description: null,
                created_at: new Date(),
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
                    account: {
                        findFirst: jest.fn().mockResolvedValue({ id: longButValidId, balance: 10000 }),
                        update: jest.fn().mockResolvedValue({ id: longButValidId }),
                    },
                };
                return await callback(mockTx);
            });

            const result = await addTransaction({
                amount: 1000,
                type: TransactionType.INCOME,
                category: "test",
                date: new Date(),
                account_id: longButValidId
            });

            expect(result).toBeDefined();
            expect(result).not.toHaveProperty("error");
        });
    });

    describe("Unicode Exploits in Description", () => {
        it("should handle description with emoji bombs and zero-width characters", async () => {
            const unicodeHell = "👨‍👩‍👧‍👦".repeat(100) + "\u200B".repeat(100) + "﷽".repeat(10);

            const mockTransaction = {
                id: "txn-unicode",
                amount: 100,
                type: TransactionType.EXPENSE,
                category: "unicode_test",
                date: new Date(),
                user_id: "user-123",
                account_id: null,
                description: unicodeHell,
                created_at: new Date(),
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
                    account: { findFirst: jest.fn(), update: jest.fn() },
                };
                return await callback(mockTx);
            });

            const result = await addTransaction({
                amount: 100,
                type: TransactionType.EXPENSE,
                category: "unicode_test",
                date: new Date(),
                description: unicodeHell
            });

            expect(result).toBeDefined();
            expect(result).not.toHaveProperty("error");
        });
    });

    describe("Special Numeric Values (NOW BLOCKED)", () => {
        it("should REJECT NaN amount", async () => {
            const result = await addTransaction({
                amount: NaN,
                type: TransactionType.INCOME,
                category: "invalid_amount",
                date: new Date()
            });

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Amount must be a valid number.");
            }
        });

        it("should REJECT Infinity amount", async () => {
            const result = await addTransaction({
                amount: Infinity,
                type: TransactionType.INCOME,
                category: "invalid_amount",
                date: new Date()
            });

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Amount exceeds maximum allowed value.");
            }
        });

        it("should REJECT -Infinity amount", async () => {
            const result = await addTransaction({
                amount: -Infinity,
                type: TransactionType.EXPENSE,
                category: "invalid_amount",
                date: new Date()
            });

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Amount cannot be negative.");
            }
        });

        it("should REJECT undefined amount", async () => {
            const result = await addTransaction({
                amount: undefined as unknown as number,
                type: TransactionType.INCOME,
                category: "invalid_amount",
                date: new Date()
            });

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Amount must be a valid number.");
            }
        });
    });

    describe("Invalid Filter Values for getDashboardStats (NOW BLOCKED)", () => {
        const invalidFilters = [
            "__proto__" as unknown as "week" | "month" | "year",
            "constructor" as unknown as "week" | "month" | "year",
            null as unknown as "week" | "month" | "year",
            undefined as unknown as "week" | "month" | "year",
            "" as unknown as "week" | "month" | "year",
            "   " as unknown as "week" | "month" | "year",
            "month' OR '1'='1" as unknown as "week" | "month" | "year",
        ];

        invalidFilters.forEach((filter, index) => {
            it(`should reject invalid filter value #${index + 1}: ${filter}`, async () => {
                await expect(getDashboardStats(filter)).rejects.toThrow("Invalid filter value");
            });
        });

        it("should accept valid filter: week", async () => {
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
            const result = await getDashboardStats("week");
            expect(result).toBeDefined();
        });

        it("should accept valid filter: month", async () => {
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
            const result = await getDashboardStats("month");
            expect(result).toBeDefined();
        });

        it("should accept valid filter: year", async () => {
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
            const result = await getDashboardStats("year");
            expect(result).toBeDefined();
        });
    });

    describe("Delete Non-Existent Transaction (NOW HANDLES ERRORS)", () => {
        it("should handle deleting transaction that doesn't exist", async () => {
            (prisma.transaction.delete as jest.Mock).mockRejectedValue(
                new Error("Record to delete does not exist")
            );

            await expect(deleteTransaction("non-existent-id")).rejects.toThrow(
                "Failed to delete transaction"
            );
        });

        it("should handle deleting same transaction twice", async () => {
            const mockTransaction = {
                id: "txn-del-123",
                amount: 1000,
                type: TransactionType.INCOME,
                category: "test_delete",
                date: new Date(),
                user_id: "user-123",
                account_id: null,
                description: null,
                created_at: new Date(),
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
                    account: { findFirst: jest.fn(), update: jest.fn() },
                };
                return await callback(mockTx);
            });

            const created = await addTransaction({
                amount: 1000,
                type: TransactionType.INCOME,
                category: "test_delete",
                date: new Date()
            });

            const id = (created as { id: string }).id;

            (prisma.transaction.delete as jest.Mock).mockResolvedValueOnce(mockTransaction);
            await deleteTransaction(id);

            (prisma.transaction.delete as jest.Mock).mockRejectedValueOnce(
                new Error("Record to delete does not exist")
            );
            await expect(deleteTransaction(id)).rejects.toThrow("Failed to delete transaction");
        });
    });

    describe("Type Coercion Attack", () => {
        it("should handle stringified number as amount", async () => {
            const result = await addTransaction({
                amount: "1000" as unknown as number,
                type: TransactionType.INCOME,
                category: "test",
                date: new Date(),
            });

            expect(result).toBeDefined();
        });

        it("should handle object masquerading as enum", async () => {
            const result = await addTransaction({
                amount: 1000,
                type: { valueOf: () => "INCOME" } as unknown as TransactionType,
                category: "test",
                date: new Date(),
            });

            expect(result).toBeDefined();
        });
    });

    describe("Category Validation (NOW ENFORCED)", () => {
        it("should REJECT empty category", async () => {
            const result = await addTransaction({
                amount: 1000,
                type: TransactionType.INCOME,
                category: "",
                date: new Date(),
            });

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Category cannot be empty.");
            }
        });

        it("should REJECT whitespace-only category", async () => {
            const result = await addTransaction({
                amount: 1000,
                type: TransactionType.INCOME,
                category: "   ",
                date: new Date(),
            });

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Category cannot be empty.");
            }
        });

        it("should REJECT category exceeding 100 characters", async () => {
            const result = await addTransaction({
                amount: 1000,
                type: TransactionType.INCOME,
                category: "A".repeat(101),
                date: new Date(),
            });

            expect(result).toHaveProperty("error");
            if ("error" in result) {
                expect(result.error).toBe("Category is too long.");
            }
        });

        it("should ACCEPT category with exactly 100 characters", async () => {
            const validCategory = "A".repeat(100);
            const mockTransaction = {
                id: "txn-cat",
                amount: 1000,
                type: TransactionType.INCOME,
                category: validCategory,
                date: new Date(),
                user_id: "user-123",
                account_id: null,
                description: null,
                created_at: new Date(),
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
                    account: { findFirst: jest.fn(), update: jest.fn() },
                };
                return await callback(mockTx);
            });

            const result = await addTransaction({
                amount: 1000,
                type: TransactionType.INCOME,
                category: validCategory,
                date: new Date(),
            });

            expect(result).toBeDefined();
            expect(result).not.toHaveProperty("error");
        });
    });
});
