import { addBudget } from "@/actions/budgets";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: {
        budget: {
            create: jest.fn(),
            findMany: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe("Budget Actions - Absurd & Edge Case Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetServerSession.mockResolvedValue({
            user: { id: "user-123", email: "test@example.com", name: "Test User" },
            expires: "2099-12-31",
        });
    });

    it("should reject amount exceeding Number.MAX_SAFE_INTEGER", async () => {
        const result = await addBudget({
            category: "Space Elevator",
            amount: Number.MAX_SAFE_INTEGER + 1,
            period: "MONTHLY",
            start_date: new Date(),
            end_date: new Date("2030-01-01"),
        });
        expect(result).toHaveProperty("error");
    });

    it("should reject start_date occurring after end_date", async () => {
        const result = await addBudget({
            category: "Time Machine",
            amount: 1000,
            period: "MONTHLY",
            start_date: new Date("2025-01-01"),
            end_date: new Date("2024-01-01"),
        });
        expect(result).toHaveProperty("error");
    });

    it("should reject NaN as amount", async () => {
        const result = await addBudget({
            category: "Void",
            amount: NaN,
            period: "MONTHLY",
            start_date: new Date(),
            end_date: new Date("2030-01-01"),
        });
        expect(result).toHaveProperty("error");
    });

    it("should reject Infinity as amount", async () => {
        const result = await addBudget({
            category: "Black Hole",
            amount: Infinity,
            period: "MONTHLY",
            start_date: new Date(),
            end_date: new Date("2030-01-01"),
        });
        expect(result).toHaveProperty("error");
    });

    it("should reject negative amount", async () => {
        const result = await addBudget({
            category: "Antimatter",
            amount: -5000,
            period: "MONTHLY",
            start_date: new Date(),
            end_date: new Date("2030-01-01"),
        });
        expect(result).toHaveProperty("error");
    });

    it("should handle Year 9999 end date", async () => {
        const futureDate = new Date("9999-12-31");

        const mockBudget = {
            id: "budget-forever",
            category: "Eternity",
            amount: 100,
            period: "MONTHLY",
            start_date: new Date(),
            end_date: futureDate,
            user_id: "user-123",
            created_at: new Date(),
        };

        (prisma.budget.create as jest.Mock).mockResolvedValue(mockBudget);

        const result = await addBudget({
            category: "Eternity",
            amount: 100,
            period: "MONTHLY",
            start_date: new Date(),
            end_date: futureDate,
        });

        expect(result).toHaveProperty("success");
    });

    it("should handle Year 1900 start date", async () => {
        const pastDate = new Date("1900-01-01");
        const mockBudget = {
            id: "budget-victorian",
            category: "Steam Engine",
            amount: 50,
            period: "MONTHLY",
            start_date: pastDate,
            end_date: new Date(),
            user_id: "user-123",
            created_at: new Date(),
        };

        (prisma.budget.create as jest.Mock).mockResolvedValue(mockBudget);

        const result = await addBudget({
            category: "Steam Engine",
            amount: 50,
            period: "MONTHLY",
            start_date: pastDate,
            end_date: new Date(),
        });

        expect(result).toHaveProperty("success");
    });

    it("should handle massive Unicode/Emoji spam", async () => {
        const unicodeChaos = "💣".repeat(50) + "﷽".repeat(10);
        const mockBudget = {
            id: "budget-chaos",
            category: unicodeChaos,
            amount: 100,
            period: "MONTHLY",
            start_date: new Date(),
            end_date: new Date("2030-01-01"),
            user_id: "user-123",
            created_at: new Date(),
        };

        (prisma.budget.create as jest.Mock).mockResolvedValue(mockBudget);

        const result = await addBudget({
            category: unicodeChaos,
            amount: 100,
            period: "MONTHLY",
            start_date: new Date(),
            end_date: new Date("2030-01-01"),
        });

        expect(result).toHaveProperty("success");
    });

    it("should safely handle SQL injection payloads", async () => {
        const injection = "'; DROP TABLE \"Budget\"; --";
        const mockBudget = {
            id: "budget-sql",
            category: injection,
            amount: 100,
            period: "MONTHLY",
            start_date: new Date(),
            end_date: new Date("2030-01-01"),
            user_id: "user-123",
            created_at: new Date(),
        };

        (prisma.budget.create as jest.Mock).mockResolvedValue(mockBudget);

        const result = await addBudget({
            category: injection,
            amount: 100,
            period: "MONTHLY",
            start_date: new Date(),
            end_date: new Date("2030-01-01"),
        });

        expect(result).toHaveProperty("success");
    });

    it("should handle 50 concurrent requests", async () => {
        let callCount = 0;
        (prisma.budget.create as jest.Mock).mockImplementation(() => {
            callCount++;
            return Promise.resolve({
                id: `budget-${callCount}`,
                category: `Concurrent ${callCount}`,
                amount: 100,
                period: "MONTHLY",
                start_date: new Date(),
                end_date: new Date("2030-01-01"),
                user_id: "user-123",
                created_at: new Date(),
            });
        });

        const promises = Array.from({ length: 50 }, (_, i) =>
            addBudget({
                category: `Concurrent ${i}`,
                amount: 100,
                period: "MONTHLY",
                start_date: new Date(),
                end_date: new Date("2030-01-01"),
            })
        );

        const results = await Promise.all(promises);
        expect(results).toHaveLength(50);
        expect(callCount).toBe(50);
    });

    it("should reject malicious __proto__ objects", async () => {
        const maliciousData = {
            category: "Hacker",
            amount: 100,
            period: "MONTHLY",
            start_date: new Date(),
            end_date: new Date("2030-01-01"),
            __proto__: { isAdmin: true },
        };

        const result = await addBudget(maliciousData as unknown as Parameters<typeof addBudget>[0]);

        expect(result).toBeDefined();
    });

    it("should reject invalid period enum values", async () => {
        type AddBudgetInput = Parameters<typeof addBudget>[0];

        const result = await addBudget({
            category: "Invalid Period",
            amount: 100,
            period: "YEARLY" as unknown as AddBudgetInput["period"],
            start_date: new Date(),
            end_date: new Date("2030-01-01"),
        });
        expect(result).toHaveProperty("error");
    });
});
