
import { getBudgets } from "@/actions/budgets";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

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

        (prisma.transaction.aggregate as jest.Mock).mockResolvedValue({
            _sum: { amount: 50000 },
        });


        const result = await getBudgets();

        expect(result[0]).toHaveProperty("spent");
        expect((result[0] as unknown as { spent: number }).spent).toBe(50000);
    });
});
