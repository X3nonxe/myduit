
import { getBudgets } from "@/actions/budgets";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Mock dependencies
jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: {
        budget: {
            findMany: jest.fn(),
        },
        transaction: {
            groupBy: jest.fn(),
            aggregate: jest.fn(),
        },
    },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe("Budget Progress Calculation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetServerSession.mockResolvedValue({
            user: { id: "user-123", email: "test@example.com", name: "Test User" },
            expires: "2099-12-31",
        });
    });

    it("should calculate spent amount correctly for a budget", async () => {
        // Mock Budgets
        const mockBudgets = [
            {
                id: "budget-1",
                user_id: "user-123",
                category: "Food",
                amount: 1000000,
                period: "MONTHLY",
                start_date: new Date("2024-01-01"),
                end_date: new Date("2024-01-31"),
                created_at: new Date(),
            },
        ];

        (prisma.budget.findMany as jest.Mock).mockResolvedValue(mockBudgets);

        // Mock Transaction Aggregation
        // The implementation will likely use groupBy or aggregate.
        // We'll assume the implementation uses groupBy for now as it's cleaner,
        // but if we use aggregate we might need to adjust this mock.
        // Let's assume the implementation will call groupBy or findMany.
        // Actually, to trigger the calculation we expect the implementation to query transactions.

        // Mocking the behavior we EXPECT the implementation to have:
        // It should query transactions that match the budget criteria.

        // Since we haven't implemented it yet, this test is expected to fail or return 0 spent depending on current implementation.
        // But for the "fix", we expect it to return the calculated amount.

        // Mock aggregate response
        (prisma.transaction.aggregate as jest.Mock).mockResolvedValue({
            _sum: { amount: 50000 },
        });


        const result = await getBudgets();

        // The current implementation returns the Prisma result directly, which doesn't have 'spent'.
        // So this test will verify that 'spent' exists and is correct after our changes.

        // Note: The original returned type is strictly prisma.Budget. 
        // We will extend it, so we cast to any or the Expected type for the test.
        expect(result[0]).toHaveProperty("spent");
        expect((result[0] as any).spent).toBe(50000);
    });
});
