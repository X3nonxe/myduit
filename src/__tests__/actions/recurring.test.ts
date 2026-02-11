import { addRecurringTransaction, updateRecurringTransaction, processRecurringTransactions } from "@/actions/recurring";
import { Frequency, TransactionType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: {
        recurringTransaction: {
            create: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        transaction: {
            create: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe("Recurring Transaction Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
        mockGetServerSession.mockResolvedValue({
            user: { id: "user-123", email: "test@example.com", name: "Test User" },
            expires: "2099-12-31",
        });
    });

    describe("addRecurringTransaction", () => {
        it("should create a recurring transaction successfully", async () => {
            const mockData = {
                amount: 1000,
                type: TransactionType.EXPENSE,
                category: "Subscription",
                frequency: Frequency.MONTHLY,
                start_date: new Date("2024-01-01"),
                description: "Netflix",
            };

            const mockCreated = {
                id: "rec-123",
                user_id: "user-123",
                ...mockData,
                next_run_date: mockData.start_date,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
                account_id: null,
                end_date: null,
                last_run_date: null,
            };

            (prisma.recurringTransaction.create as jest.Mock).mockResolvedValue(mockCreated);

            const result = await addRecurringTransaction(mockData);

            expect(prisma.recurringTransaction.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    amount: 1000,
                    frequency: Frequency.MONTHLY,
                    user_id: "user-123",
                    next_run_date: mockData.start_date,
                }),
            });
            expect(result).toHaveProperty("success", true);
            expect(result).toHaveProperty("data", mockCreated);
        });

        it("should return error if user is not authenticated", async () => {
            mockGetServerSession.mockResolvedValueOnce(null);

            const result = await addRecurringTransaction({
                amount: 1000,
                type: TransactionType.EXPENSE,
                category: "Test",
                frequency: Frequency.DAILY,
                start_date: new Date(),
            });

            expect(result).toHaveProperty("error");
        });
    });

    describe("updateRecurringTransaction", () => {
        it("should update a recurring transaction successfully", async () => {
            const mockUpdateData = {
                amount: 2000,
                type: TransactionType.EXPENSE,
                category: "Updated Category",
                frequency: Frequency.WEEKLY,
                start_date: new Date("2024-02-01"),
                is_active: false,
            };

            const mockUpdated = {
                id: "rec-123",
                user_id: "user-123",
                ...mockUpdateData,
                next_run_date: new Date("2024-01-01"),
                created_at: new Date(),
                updated_at: new Date(),
                account_id: null,
                end_date: null,
                last_run_date: null,
                description: null,
            };

            (prisma.recurringTransaction.update as jest.Mock).mockResolvedValue(mockUpdated);

            const result = await updateRecurringTransaction("rec-123", mockUpdateData);

            expect(prisma.recurringTransaction.update).toHaveBeenCalledWith({
                where: { id: "rec-123", user_id: "user-123" },
                data: expect.objectContaining({
                    amount: 2000,
                    category: "Updated Category",
                    is_active: false,
                }),
            });
            expect(result).toHaveProperty("success", true);
            expect(result).toHaveProperty("data", mockUpdated);
        });

        it("should return error if update fails", async () => {
            (prisma.recurringTransaction.update as jest.Mock).mockRejectedValue(new Error("DB Error"));

            const result = await updateRecurringTransaction("rec-123", {
                amount: 1000,
                type: TransactionType.EXPENSE,
                category: "Test",
                frequency: Frequency.DAILY,
                start_date: new Date(),
            });

            expect(result).toHaveProperty("error");
        });
    });

    describe("processRecurringTransactions", () => {
        it("should process due transactions and update next run date", async () => {
            const now = new Date();
            const dueTransaction = {
                id: "rec-1",
                user_id: "user-123",
                amount: 500,
                type: TransactionType.EXPENSE,
                category: "Bill",
                description: "Monthly Bill",
                frequency: Frequency.MONTHLY,
                next_run_date: new Date(now.getTime() - 10000),
                end_date: null,
                account_id: "acc-1",
                is_active: true,
            };

            (prisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([dueTransaction]);

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    transaction: { create: jest.fn() },
                    recurringTransaction: { update: jest.fn() },
                };
                return await callback(mockTx);
            });

            const result = await processRecurringTransactions();

            expect(prisma.recurringTransaction.findMany).toHaveBeenCalled();
            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
            expect(result).toHaveProperty("processed", 1);
        });

        it("should stop processing when end_date is reached", async () => {
            const now = new Date();
            const dueTransaction = {
                id: "rec-ending",
                user_id: "user-123",
                amount: 100,
                type: TransactionType.EXPENSE,
                category: "Limited sub",
                description: "Ending soon",
                frequency: Frequency.DAILY,
                next_run_date: now,
                end_date: now,
                account_id: null,
                is_active: true,
            };

            (prisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([dueTransaction]);

            let capturedUpdateData: { is_active: boolean } | undefined;
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    transaction: { create: jest.fn() },
                    recurringTransaction: {
                        update: jest.fn().mockImplementation(({ data }) => {
                            capturedUpdateData = data;
                            return Promise.resolve();
                        })
                    },
                };
                return await callback(mockTx);
            });

            await processRecurringTransactions();

            expect(capturedUpdateData).toBeDefined();
            expect(capturedUpdateData?.is_active).toBe(false);
        });

        it("should handle end-of-month date calculation (Jan 31 -> Feb 28/29)", async () => {
            const jan31 = new Date("2023-01-31T00:00:00.000Z");

            const monthlyTransaction = {
                id: "rec-eom",
                user_id: "user-123",
                amount: 100,
                type: TransactionType.EXPENSE,
                category: "Monthly Bill",
                frequency: Frequency.MONTHLY,
                next_run_date: jan31,
                is_active: true,
                created_at: jan31,
                updated_at: jan31,
            };

            (prisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([monthlyTransaction]);

            let capturedNextDate: Date | undefined;
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    transaction: { create: jest.fn() },
                    recurringTransaction: {
                        update: jest.fn().mockImplementation(({ data }) => {
                            capturedNextDate = data.next_run_date;
                            return Promise.resolve();
                        })
                    },
                };
                return await callback(mockTx);
            });

            await processRecurringTransactions();

            expect(capturedNextDate).toBeDefined();
            expect(capturedNextDate?.toISOString()).toContain("2023-02-28");
        });

        it("should handle leap year calculation (Feb 29 -> Feb 28)", async () => {
            const feb29 = new Date("2024-02-29T00:00:00.000Z");

            const yearlyTransaction = {
                id: "rec-leap",
                user_id: "user-123",
                amount: 100,
                type: TransactionType.EXPENSE,
                category: "Yearly Sub",
                frequency: Frequency.YEARLY,
                next_run_date: feb29,
                is_active: true,
            };

            (prisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([yearlyTransaction]);

            let capturedNextDate: Date | undefined;
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {
                    transaction: { create: jest.fn() },
                    recurringTransaction: {
                        update: jest.fn().mockImplementation(({ data }) => {
                            capturedNextDate = data.next_run_date;
                            return Promise.resolve();
                        })
                    },
                };
                return await callback(mockTx);
            });

            await processRecurringTransactions();

            expect(capturedNextDate).toBeDefined();
            expect(capturedNextDate?.toISOString()).toContain("2025-02-28");
        });
    });
});