import { addRecurringTransaction, processRecurringTransactions, deleteRecurringTransaction } from "@/actions/recurring";
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

            let capturedUpdateData: any;
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
            expect(capturedUpdateData.is_active).toBe(false);
        });
    });
});