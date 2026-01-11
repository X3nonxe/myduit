import { getAccounts, addAccount, deleteAccount } from "@/actions/accounts";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Mock dependencies
jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: {
        account: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
        transaction: {
            findFirst: jest.fn(),
        },
    },
}));

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrismaAccountFindMany = prisma.account.findMany as jest.MockedFunction<typeof prisma.account.findMany>;
const mockPrismaAccountFindFirst = prisma.account.findFirst as jest.MockedFunction<typeof prisma.account.findFirst>;
const mockPrismaAccountCreate = prisma.account.create as jest.MockedFunction<typeof prisma.account.create>;
const mockPrismaAccountDelete = prisma.account.delete as jest.MockedFunction<typeof prisma.account.delete>;
const mockPrismaTransactionFindFirst = prisma.transaction.findFirst as jest.MockedFunction<typeof prisma.transaction.findFirst>;

describe("Account Actions - 10 Absurd & Edge Case Tests (With Validation)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: authenticated user
        mockGetServerSession.mockResolvedValue({
            user: { id: "user-123", email: "test@example.com", name: "Test User" },
            expires: "2099-12-31",
        });
        // Default: no duplicate accounts
        mockPrismaAccountFindFirst.mockResolvedValue(null);
    });

    describe("Test #1: Balance dengan Nilai Infinity (NOW BLOCKED)", () => {
        it("should REJECT Infinity balance", async () => {
            const result = await addAccount({
                name: "Rekening Infinity",
                type: "bank",
                balance: Infinity,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Saldo harus berupa angka yang valid.");
            expect(mockPrismaAccountCreate).not.toHaveBeenCalled();
        });

        it("should REJECT negative Infinity balance", async () => {
            const result = await addAccount({
                name: "Hutang Infinity",
                type: "bank",
                balance: -Infinity,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Saldo harus berupa angka yang valid.");
            expect(mockPrismaAccountCreate).not.toHaveBeenCalled();
        });
    });

    describe("Test #2: Balance dengan NaN (NOW BLOCKED)", () => {
        it("should REJECT NaN balance", async () => {
            const result = await addAccount({
                name: "Rekening NaN",
                type: "bank",
                balance: NaN,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Saldo harus berupa angka yang valid.");
            expect(mockPrismaAccountCreate).not.toHaveBeenCalled();
        });

        it("should REJECT balance from parseInt of invalid string", async () => {
            const invalidBalance = parseInt("not-a-number", 10); // Returns NaN

            const result = await addAccount({
                name: "Parsed Invalid",
                type: "bank",
                balance: invalidBalance,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Saldo harus berupa angka yang valid.");
        });
    });

    describe("Test #3: Name dengan String Kosong atau Whitespace Only (NOW BLOCKED)", () => {
        it("should REJECT empty string name", async () => {
            const result = await addAccount({
                name: "",
                type: "bank",
                balance: 1000,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Nama akun tidak boleh kosong.");
            expect(mockPrismaAccountCreate).not.toHaveBeenCalled();
        });

        it("should REJECT whitespace-only name", async () => {
            const result = await addAccount({
                name: "     ",
                type: "bank",
                balance: 1000,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Nama akun tidak boleh kosong.");
        });

        it("should REJECT tab and newline characters in name", async () => {
            const result = await addAccount({
                name: "\t\n\r",
                type: "bank",
                balance: 1000,
            });

            expect(result).toHaveProperty("error");
            // Either empty after trim or control char error
            expect(result.error).toMatch(/tidak boleh kosong|tidak valid/);
        });

        it("should REJECT name with control characters", async () => {
            const result = await addAccount({
                name: "Test\x00Name",
                type: "bank",
                balance: 1000,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Nama akun mengandung karakter yang tidak valid.");
        });
    });

    describe("Test #4: SQL Injection / NoSQL Injection Attempts (STILL SAFE)", () => {
        const injectionPayloads = [
            "'; DROP TABLE account; --",
            "' OR '1'='1",
            "'; DELETE FROM account WHERE '1'='1",
            "admin'--",
            "${JSON.stringify({$gt: ''})}",
            "{{constructor.constructor('return this')()}}",
            "Robert'); DROP TABLE Students;--",
            "1; UPDATE account SET balance=999999999 WHERE 1=1;--",
        ];

        injectionPayloads.forEach((payload, index) => {
            it(`should safely handle SQL injection payload #${index + 1}`, async () => {
                mockPrismaAccountCreate.mockResolvedValue({
                    id: "acc-123",
                    name: payload,
                    type: "bank",
                    balance: 1000,
                    user_id: "user-123",
                    created_at: new Date(),
                });

                const result = await addAccount({
                    name: payload,
                    type: "bank",
                    balance: 1000,
                });

                // Prisma uses parameterized queries, should be safe
                expect(result.success).toBe(true);
            });
        });
    });

    describe("Test #5: Delete Account dengan ID yang Tidak Exist", () => {
        it("should handle deleting non-existent account ID", async () => {
            mockPrismaTransactionFindFirst.mockResolvedValue(null);
            mockPrismaAccountDelete.mockRejectedValue(
                new Error("Record to delete does not exist")
            );

            const result = await deleteAccount("id-yang-tidak-ada-sama-sekali-123456789");

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Gagal menghapus akun.");
        });

        it("should REJECT deleting with empty string ID", async () => {
            const result = await deleteAccount("");

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("ID akun tidak valid.");
            expect(mockPrismaTransactionFindFirst).not.toHaveBeenCalled();
        });

        it("should handle deleting with UUID-like but invalid format", async () => {
            mockPrismaTransactionFindFirst.mockResolvedValue(null);
            mockPrismaAccountDelete.mockRejectedValue(new Error("Invalid ID format"));

            const result = await deleteAccount("not-a-real-uuid-format");

            expect(result).toHaveProperty("error");
        });
    });

    describe("Test #6: ID dengan Karakter Special/Unicode (CONTROL CHARS BLOCKED)", () => {
        it("should REJECT ID with null bytes", async () => {
            const result = await deleteAccount("\x00\x00\x00");

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("ID akun mengandung karakter yang tidak valid.");
            expect(mockPrismaTransactionFindFirst).not.toHaveBeenCalled();
        });

        it("should REJECT ID with control characters", async () => {
            const result = await deleteAccount("id\x1Ftest");

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("ID akun mengandung karakter yang tidak valid.");
        });

        it("should ACCEPT ID with unicode emojis (safe)", async () => {
            mockPrismaTransactionFindFirst.mockResolvedValue(null);
            mockPrismaAccountDelete.mockRejectedValue(new Error("Not found"));

            const result = await deleteAccount("💀🔥😈");

            // This is technically allowed, will fail at database level
            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Gagal menghapus akun.");
        });

        it("should handle path traversal attempts (blocked at DB level)", async () => {
            mockPrismaTransactionFindFirst.mockResolvedValue(null);
            mockPrismaAccountDelete.mockRejectedValue(new Error("Not found"));

            const result = await deleteAccount("../../../etc/passwd");

            expect(result).toHaveProperty("error");
        });
    });

    describe("Test #7: Balance dengan Angka Negatif (NOW BLOCKED)", () => {
        it("should REJECT negative balance", async () => {
            const result = await addAccount({
                name: "Hutang Unlimited",
                type: "bank",
                balance: -999999999999999,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Saldo tidak boleh negatif.");
            expect(mockPrismaAccountCreate).not.toHaveBeenCalled();
        });

        it("should ACCEPT zero balance", async () => {
            mockPrismaAccountCreate.mockResolvedValue({
                id: "acc-123",
                name: "Empty Account",
                type: "bank",
                balance: 0,
                user_id: "user-123",
                created_at: new Date(),
            });

            const result = await addAccount({
                name: "Empty Account",
                type: "bank",
                balance: 0,
            });

            expect(result.success).toBe(true);
        });

        it("should ACCEPT Number.MAX_SAFE_INTEGER", async () => {
            mockPrismaAccountCreate.mockResolvedValue({
                id: "acc-123",
                name: "Max Integer",
                type: "bank",
                balance: Number.MAX_SAFE_INTEGER,
                user_id: "user-123",
                created_at: new Date(),
            });

            const result = await addAccount({
                name: "Max Integer",
                type: "bank",
                balance: Number.MAX_SAFE_INTEGER,
            });

            expect(result.success).toBe(true);
        });
    });

    describe("Test #8: Name dengan String Sangat Panjang (NOW BLOCKED)", () => {
        it("should REJECT name exceeding 100 characters", async () => {
            const longName = "A".repeat(101);

            const result = await addAccount({
                name: longName,
                type: "bank",
                balance: 1000,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Nama akun tidak boleh lebih dari 100 karakter.");
            expect(mockPrismaAccountCreate).not.toHaveBeenCalled();
        });

        it("should ACCEPT name with exactly 100 characters", async () => {
            const maxName = "A".repeat(100);
            mockPrismaAccountCreate.mockResolvedValue({
                id: "acc-123",
                name: maxName,
                type: "bank",
                balance: 1000,
                user_id: "user-123",
                created_at: new Date(),
            });

            const result = await addAccount({
                name: maxName,
                type: "bank",
                balance: 1000,
            });

            expect(result.success).toBe(true);
        });
    });

    describe("Test #9: Type Validation (NOW ENFORCED)", () => {
        it("should REJECT invalid account type", async () => {
            const result = await addAccount({
                name: "Test Account",
                type: "__proto__",
                balance: 1000,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toContain("Tipe akun tidak valid");
        });

        it("should REJECT empty type", async () => {
            const result = await addAccount({
                name: "Test Account",
                type: "",
                balance: 1000,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Tipe akun tidak boleh kosong.");
        });

        const validTypes = ["bank", "cash", "e-wallet", "credit_card", "other"];
        validTypes.forEach(type => {
            it(`should ACCEPT valid type: ${type}`, async () => {
                mockPrismaAccountCreate.mockResolvedValue({
                    id: "acc-123",
                    name: "Test Account",
                    type: type,
                    balance: 1000,
                    user_id: "user-123",
                    created_at: new Date(),
                });

                const result = await addAccount({
                    name: "Test Account",
                    type: type,
                    balance: 1000,
                });

                expect(result.success).toBe(true);
            });
        });

        it("should ACCEPT type with different casing (case-insensitive)", async () => {
            mockPrismaAccountCreate.mockResolvedValue({
                id: "acc-123",
                name: "Test Account",
                type: "bank",
                balance: 1000,
                user_id: "user-123",
                created_at: new Date(),
            });

            const result = await addAccount({
                name: "Test Account",
                type: "BANK",
                balance: 1000,
            });

            expect(result.success).toBe(true);
        });
    });

    describe("Test #10: Duplicate Account Name (NOW BLOCKED)", () => {
        it("should REJECT duplicate account name for same user", async () => {
            mockPrismaAccountFindFirst.mockResolvedValue({
                id: "existing-acc",
                name: "My Bank Account",
                type: "bank",
                balance: 5000,
                user_id: "user-123",
                created_at: new Date(),
            });

            const result = await addAccount({
                name: "My Bank Account",
                type: "cash",
                balance: 1000,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Akun dengan nama tersebut sudah ada.");
            expect(mockPrismaAccountCreate).not.toHaveBeenCalled();
        });

        it("should REJECT duplicate name (case-insensitive)", async () => {
            mockPrismaAccountFindFirst.mockResolvedValue({
                id: "existing-acc",
                name: "My Bank Account",
                type: "bank",
                balance: 5000,
                user_id: "user-123",
                created_at: new Date(),
            });

            const result = await addAccount({
                name: "MY BANK ACCOUNT",
                type: "cash",
                balance: 1000,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Akun dengan nama tersebut sudah ada.");
        });

        it("should ACCEPT unique account name", async () => {
            mockPrismaAccountFindFirst.mockResolvedValue(null);
            mockPrismaAccountCreate.mockResolvedValue({
                id: "acc-123",
                name: "New Unique Account",
                type: "bank",
                balance: 1000,
                user_id: "user-123",
                created_at: new Date(),
            });

            const result = await addAccount({
                name: "New Unique Account",
                type: "bank",
                balance: 1000,
            });

            expect(result.success).toBe(true);
        });
    });

    describe("Bonus: Authentication Edge Cases", () => {
        it("should throw error when no session exists for getAccounts", async () => {
            mockGetServerSession.mockResolvedValue(null);

            await expect(getAccounts()).rejects.toThrow("Unauthorized");
        });

        it("should return error when no session exists for addAccount", async () => {
            mockGetServerSession.mockResolvedValue(null);

            const result = await addAccount({
                name: "Test",
                type: "bank",
                balance: 1000,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Sesi tidak valid. Silakan login kembali.");
        });

        it("should return error when no session exists for deleteAccount", async () => {
            mockGetServerSession.mockResolvedValue(null);

            const result = await deleteAccount("acc-123");

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Sesi tidak valid.");
        });

        it("should handle session with undefined user id", async () => {
            mockGetServerSession.mockResolvedValue({
                user: { email: "test@example.com", name: "Test" }, // Missing id
                expires: "2099-12-31",
            } as never);

            const result = await addAccount({
                name: "Test",
                type: "bank",
                balance: 1000,
            });

            expect(result).toHaveProperty("error");
        });
    });

    describe("Bonus: Delete Account with Transactions", () => {
        it("should prevent deletion when account has transactions", async () => {
            mockPrismaTransactionFindFirst.mockResolvedValue({
                id: "txn-123",
                amount: 1000,
                account_id: "acc-123",
                user_id: "user-123",
                description: "Test",
                type: "INCOME",
                category: "Salary",
                created_at: new Date(),
            } as never);

            const result = await deleteAccount("acc-123");

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Akun tidak bisa dihapus karena masih memiliki riwayat transaksi.");
            expect(mockPrismaAccountDelete).not.toHaveBeenCalled();
        });
    });

    describe("Bonus: Valid Operations Should Succeed", () => {
        it("should successfully get accounts", async () => {
            const mockAccounts = [
                { id: "acc-1", name: "Account 1", type: "bank", balance: 1000, user_id: "user-123", created_at: new Date() },
                { id: "acc-2", name: "Account 2", type: "cash", balance: 500, user_id: "user-123", created_at: new Date() },
            ];
            mockPrismaAccountFindMany.mockResolvedValue(mockAccounts);

            const result = await getAccounts();

            expect(result).toEqual(mockAccounts);
        });

        it("should successfully add account with valid data", async () => {
            mockPrismaAccountCreate.mockResolvedValue({
                id: "acc-123",
                name: "Valid Account",
                type: "bank",
                balance: 5000,
                user_id: "user-123",
                created_at: new Date(),
            });

            const result = await addAccount({
                name: "Valid Account",
                type: "bank",
                balance: 5000,
            });

            expect(result).toEqual({
                success: true,
                data: expect.objectContaining({
                    name: "Valid Account",
                    type: "bank",
                    balance: 5000,
                }),
            });
        });

        it("should successfully delete account without transactions", async () => {
            mockPrismaTransactionFindFirst.mockResolvedValue(null);
            mockPrismaAccountDelete.mockResolvedValue({
                id: "acc-123",
                name: "Test",
                type: "bank",
                balance: 1000,
                user_id: "user-123",
                created_at: new Date(),
            });

            const result = await deleteAccount("acc-123");

            expect(result).toEqual({ success: true });
        });
    });
});
