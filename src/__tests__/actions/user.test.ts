import { updateProfile, changePassword } from "@/actions/user";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";

jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: {
        user: {
            update: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}));

jest.mock("bcryptjs", () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrismaUserUpdate = prisma.user.update as jest.MockedFunction<typeof prisma.user.update>;
const mockPrismaUserFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

describe("User Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
        mockGetServerSession.mockResolvedValue({
            user: { id: "user-123", email: "test@example.com", name: "Test User" },
            expires: "2099-12-31",
        });
    });

    describe("Extremely Long Name (Buffer Overflow Attack)", () => {
        it("should REJECT name exceeding 255 characters", async () => {
            const longName = "A".repeat(256);

            const result = await updateProfile({
                name: longName,
                image: "https://example.com/avatar.png",
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Nama tidak boleh lebih dari 255 karakter.");
            expect(mockPrismaUserUpdate).not.toHaveBeenCalled();
        });

        it("should ACCEPT name with exactly 255 characters", async () => {
            const maxLengthName = "A".repeat(255);

            mockPrismaUserUpdate.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: maxLengthName,
                image: null,
                password_hash: "hash",
                created_at: new Date(),
            });

            const result = await updateProfile({
                name: maxLengthName,
            });

            expect(result).toEqual({ success: true });
            expect(mockPrismaUserUpdate).toHaveBeenCalled();
        });
    });

    describe("SQL/NoSQL Injection", () => {
        const injectionPayloads = [
            "'; DROP TABLE User; --",
            "' OR '1'='1",
            "'; DELETE FROM User WHERE '1'='1",
            "admin'--",
            "${JSON.stringify({$gt: ''})}",
            "{{constructor.constructor('return this')()}}",
        ];

        injectionPayloads.forEach((payload, index) => {
            it(`should safely handle injection payload #${index + 1}: ${payload.substring(0, 30)}...`, async () => {
                mockPrismaUserUpdate.mockResolvedValue({
                    id: "user-123",
                    email: "test@example.com",
                    name: payload,
                    image: null,
                    password_hash: "hash",
                    created_at: new Date(),
                });

                const result = await updateProfile({ name: payload });

                expect(result).toEqual({ success: true });
            });
        });
    });

    describe("XSS via Image URL (NOW BLOCKED)", () => {
        const xssPayloads = [
            { payload: "javascript:alert('XSS')", reason: "javascript: scheme" },
            { payload: "data:text/html,<script>alert('hacked')</script>", reason: "data: scheme" },
            { payload: "data:image/svg+xml,<svg onload=alert('XSS')>", reason: "data: scheme" },
            { payload: "vbscript:msgbox('XSS')", reason: "vbscript: scheme" },
        ];

        xssPayloads.forEach(({ payload, reason }, index) => {
            it(`should REJECT XSS payload #${index + 1} (${reason})`, async () => {
                const result = await updateProfile({
                    name: "Normal Name",
                    image: payload,
                });

                expect(result).toHaveProperty("error");
                expect(result.error).toBe("URL gambar tidak valid.");
                expect(mockPrismaUserUpdate).not.toHaveBeenCalled();
            });
        });

        it("should REJECT non-https URLs", async () => {
            const result = await updateProfile({
                name: "Normal Name",
                image: "http://example.com/avatar.png",
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("URL gambar harus menggunakan HTTPS.");
        });

        it("should ACCEPT valid https URLs", async () => {
            mockPrismaUserUpdate.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Normal Name",
                image: "https://example.com/avatar.png",
                password_hash: "hash",
                created_at: new Date(),
            });

            const result = await updateProfile({
                name: "Normal Name",
                image: "https://example.com/avatar.png",
            });

            expect(result).toEqual({ success: true });
        });

        it("should ACCEPT relative URLs starting with /", async () => {
            mockPrismaUserUpdate.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Normal Name",
                image: "/uploads/avatar.png",
                password_hash: "hash",
                created_at: new Date(),
            });

            const result = await updateProfile({
                name: "Normal Name",
                image: "/uploads/avatar.png",
            });

            expect(result).toEqual({ success: true });
        });
    });

    describe("Unicode Null Byte & Control Characters (NOW BLOCKED)", () => {
        const blockedPayloads = [
            { payload: "User\x00Name", desc: "Null byte" },
            { payload: "User\x1FName", desc: "Control char 0x1F" },
            { payload: "User\x7FName", desc: "DEL char" },
            { payload: "User\u0001\u0002Name", desc: "Multiple control chars" },
        ];

        blockedPayloads.forEach(({ payload, desc }, index) => {
            it(`should REJECT name with ${desc}`, async () => {
                const result = await updateProfile({ name: payload });

                expect(result).toHaveProperty("error");
                expect(result.error).toBe("Nama mengandung karakter yang tidak valid.");
                expect(mockPrismaUserUpdate).not.toHaveBeenCalled();
            });
        });

        const allowedPayloads = [
            { payload: "\uFEFFUser", desc: "BOM" },
            { payload: "User\u200BName", desc: "Zero-width space" },
            { payload: "User 🔥 Name", desc: "Emoji" },
        ];

        allowedPayloads.forEach(({ payload, desc }) => {
            it(`should ACCEPT name with ${desc}`, async () => {
                mockPrismaUserUpdate.mockResolvedValue({
                    id: "user-123",
                    email: "test@example.com",
                    name: payload,
                    image: null,
                    password_hash: "hash",
                    created_at: new Date(),
                });

                const result = await updateProfile({ name: payload });

                expect(result).toEqual({ success: true });
            });
        });
    });

    describe("Prototype Pollution Attack", () => {
        it("should not allow prototype pollution via __proto__", async () => {
            const maliciousData = {
                name: "Normal Name",
                image: "https://example.com/avatar.png",
                __proto__: { isAdmin: true, role: "superadmin" },
            } as { name: string; image: string };

            mockPrismaUserUpdate.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Normal Name",
                image: "https://example.com/avatar.png",
                password_hash: "hash",
                created_at: new Date(),
            });

            const result = await updateProfile(maliciousData);

            expect(result).toEqual({ success: true });
            // Verify that extra fields were NOT passed to Prisma
            expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
                where: { id: "user-123" },
                data: {
                    name: "Normal Name",
                    image: "https://example.com/avatar.png",
                },
            });
        });
    });

    describe("Same Old and New Password (NOW BLOCKED)", () => {
        it("should REJECT identical old and new passwords", async () => {
            const samePassword = "MySecurePassword123!";

            const result = await changePassword({
                oldPassword: samePassword,
                newPassword: samePassword,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Kata sandi baru harus berbeda dari kata sandi lama.");
            expect(mockPrismaUserFindUnique).not.toHaveBeenCalled();
        });
    });

    describe("Empty String Password (NOW BLOCKED)", () => {
        it("should REJECT empty string as new password", async () => {
            const result = await changePassword({
                oldPassword: "correctOldPassword",
                newPassword: "",
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Kata sandi tidak boleh kosong.");
            expect(mockBcryptHash).not.toHaveBeenCalled();
        });

        it("should REJECT whitespace-only password", async () => {
            const result = await changePassword({
                oldPassword: "correctOldPassword",
                newPassword: "   \t\n   ",
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Kata sandi tidak boleh kosong.");
        });

        it("should REJECT password shorter than 8 characters", async () => {
            const result = await changePassword({
                oldPassword: "correctOldPassword",
                newPassword: "short",
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Kata sandi minimal 8 karakter.");
        });
    });

    describe("Valid Passwords with Special Characters", () => {
        it("should ACCEPT password with unicode characters", async () => {
            const unicodePassword = "MyP@ssw0rd🔥";

            mockPrismaUserFindUnique.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Test",
                image: null,
                password_hash: "$2a$12$hashedpassword",
                created_at: new Date(),
            });
            mockBcryptCompare.mockResolvedValue(true as never);
            mockBcryptHash.mockResolvedValue("$2a$12$unicodehash" as never);
            mockPrismaUserUpdate.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Test",
                image: null,
                password_hash: "$2a$12$unicodehash",
                created_at: new Date(),
            });

            const result = await changePassword({
                oldPassword: "correctOldPassword",
                newPassword: unicodePassword,
            });

            expect(result).toEqual({ success: true });
        });

        it("should ACCEPT password with exactly 8 characters (minimum)", async () => {
            mockPrismaUserFindUnique.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Test",
                image: null,
                password_hash: "$2a$12$hashedpassword",
                created_at: new Date(),
            });
            mockBcryptCompare.mockResolvedValue(true as never);
            mockBcryptHash.mockResolvedValue("$2a$12$minhash" as never);
            mockPrismaUserUpdate.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Test",
                image: null,
                password_hash: "$2a$12$minhash",
                created_at: new Date(),
            });

            const result = await changePassword({
                oldPassword: "correctOldPassword",
                newPassword: "12345678",
            });

            expect(result).toEqual({ success: true });
        });
    });

    describe("Concurrent Password Changes (Race Condition)", () => {
        it("should handle simultaneous password change requests", async () => {
            let callCount = 0;

            (prisma.user.findUnique as jest.Mock).mockImplementation(async () => {
                callCount++;
                await new Promise(resolve => setTimeout(resolve, 10));
                return {
                    id: "user-123",
                    email: "test@example.com",
                    name: "Test",
                    image: null,
                    password_hash: "$2a$12$originalpassword",
                    created_at: new Date(),
                };
            });
            mockBcryptCompare.mockResolvedValue(true as never);
            mockBcryptHash.mockImplementation(async (password: string | number) => {
                return `$2a$12$hash_${password}`;
            });
            mockPrismaUserUpdate.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Test",
                image: null,
                password_hash: "$2a$12$lasthash",
                created_at: new Date(),
            });

            const results = await Promise.all([
                changePassword({ oldPassword: "oldPass12", newPassword: "newPass11" }),
                changePassword({ oldPassword: "oldPass12", newPassword: "newPass22" }),
                changePassword({ oldPassword: "oldPass12", newPassword: "newPass33" }),
            ]);

            expect(results.every(r => r.success === true)).toBe(true);
            expect(callCount).toBe(3);
        });
    });

    describe("Extremely Long Password (DoS Attack - NOW BLOCKED)", () => {
        it("should REJECT password exceeding 128 characters", async () => {
            const longPassword = "X".repeat(129);

            const result = await changePassword({
                oldPassword: "correct12345",
                newPassword: longPassword,
            });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Kata sandi maksimal 128 karakter.");
            expect(mockBcryptHash).not.toHaveBeenCalled();
        });

        it("should ACCEPT password with exactly 128 characters (maximum)", async () => {
            const maxPassword = "X".repeat(128);

            mockPrismaUserFindUnique.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Test",
                image: null,
                password_hash: "$2a$12$hashedpassword",
                created_at: new Date(),
            });
            mockBcryptCompare.mockResolvedValue(true as never);
            mockBcryptHash.mockResolvedValue("$2a$12$maxhash" as never);
            mockPrismaUserUpdate.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Test",
                image: null,
                password_hash: "$2a$12$maxhash",
                created_at: new Date(),
            });

            const result = await changePassword({
                oldPassword: "correct12345",
                newPassword: maxPassword,
            });

            expect(result).toEqual({ success: true });
        });
    });

    describe("Authentication Edge Cases", () => {
        it("should throw error when no session exists", async () => {
            mockGetServerSession.mockResolvedValue(null);

            await expect(updateProfile({ name: "Test User" })).rejects.toThrow("Unauthorized");
            await expect(changePassword({
                oldPassword: "oldPassword",
                newPassword: "newPassword1"
            })).rejects.toThrow("Unauthorized");
        });

        it("should throw error when session.user is undefined", async () => {
            mockGetServerSession.mockResolvedValue({
                expires: "2099-12-31",
            } as never);

            await expect(updateProfile({ name: "Test User" })).rejects.toThrow("Unauthorized");
        });

        it("should handle user not found in database", async () => {
            mockPrismaUserFindUnique.mockResolvedValue(null);

            const result = await changePassword({
                oldPassword: "oldPassword",
                newPassword: "newPassword1",
            });

            expect(result).toEqual({ error: "Gagal mengubah kata sandi." });
        });

        it("should return error for incorrect old password", async () => {
            mockPrismaUserFindUnique.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Test",
                image: null,
                password_hash: "$2a$12$hashedpassword",
                created_at: new Date(),
            });
            mockBcryptCompare.mockResolvedValue(false as never);

            const result = await changePassword({
                oldPassword: "wrongPassword",
                newPassword: "newPassword1",
            });

            expect(result).toEqual({ error: "Kata sandi lama salah." });
        });

        it("should REJECT empty name", async () => {
            const result = await updateProfile({ name: "" });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Nama tidak boleh kosong.");
        });

        it("should REJECT whitespace-only name", async () => {
            const result = await updateProfile({ name: "   " });

            expect(result).toHaveProperty("error");
            expect(result.error).toBe("Nama tidak boleh kosong.");
        });
    });

    describe("Validation Success Cases", () => {
        it("should successfully update profile with valid data", async () => {
            mockPrismaUserUpdate.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "John Doe",
                image: "https://example.com/avatar.png",
                password_hash: "hash",
                created_at: new Date(),
            });

            const result = await updateProfile({
                name: "John Doe",
                image: "https://example.com/avatar.png",
            });

            expect(result).toEqual({ success: true });
            expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
                where: { id: "user-123" },
                data: {
                    name: "John Doe",
                    image: "https://example.com/avatar.png",
                },
            });
        });

        it("should successfully change password with valid data", async () => {
            mockPrismaUserFindUnique.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Test",
                image: null,
                password_hash: "$2a$12$hashedpassword",
                created_at: new Date(),
            });
            mockBcryptCompare.mockResolvedValue(true as never);
            mockBcryptHash.mockResolvedValue("$2a$12$newhashedpassword" as never);
            mockPrismaUserUpdate.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "Test",
                image: null,
                password_hash: "$2a$12$newhashedpassword",
                created_at: new Date(),
            });

            const result = await changePassword({
                oldPassword: "OldPassword123!",
                newPassword: "NewPassword456!",
            });

            expect(result).toEqual({ success: true });
            expect(mockBcryptHash).toHaveBeenCalledWith("NewPassword456!", 12);
        });

        it("should allow empty image (optional field)", async () => {
            mockPrismaUserUpdate.mockResolvedValue({
                id: "user-123",
                email: "test@example.com",
                name: "John Doe",
                image: null,
                password_hash: "hash",
                created_at: new Date(),
            });

            const result = await updateProfile({
                name: "John Doe",
                image: undefined,
            });

            expect(result).toEqual({ success: true });
        });
    });
});
