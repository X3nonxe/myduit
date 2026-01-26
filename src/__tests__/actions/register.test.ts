import { registerUser } from "@/actions/register";

jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

jest.mock("bcryptjs", () => ({
    hash: jest.fn().mockResolvedValue("hashed_password"),
}));

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("Register Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (mockPrisma.user.create as jest.Mock).mockResolvedValue({
            id: "test-user-id",
            email: "test@test.com",
            name: "Test User",
        });
    });

    const createFormData = (data: Record<string, string>): FormData => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            formData.set(key, value);
        });
        return formData;
    };

    describe("Email dengan Unicode/Emoji", () => {
        it("should handle email with emoji characters", async () => {
            const formData = createFormData({
                email: "user🔥💀@gmail.com",
                password: "password123",
                name: "Emoji User",
            });

            const result = await registerUser(formData);

            expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
            expect(result).toHaveProperty("error", "Email tidak valid.");
        });

        it("should reject email with special unicode characters if invalid format", async () => {
            const formData = createFormData({
                email: "üser@dömain.com",
                password: "password123",
                name: "Unicode User",
            });

            const result = await registerUser(formData);

            expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
            expect(result).toHaveProperty("error", "Email tidak valid.");
        });
    });

    describe("Null Byte Injection", () => {
        it("should handle email with null byte character", async () => {
            const formData = createFormData({
                email: "admin@gmail.com\x00@evil.com",
                password: "password123",
                name: "Null Byte User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Email tidak valid.");
            expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
        });
    });

    describe("Password dengan Panjang Ekstrem", () => {
        it("should handle extremely long password (potential DoS)", async () => {
            const extremelyLongPassword = "a".repeat(100_000); // 100KB password

            const formData = createFormData({
                email: "dos@test.com",
                password: extremelyLongPassword,
                name: "DoS User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Kata sandi maksimal 128 karakter.");
            expect(mockBcrypt.hash).not.toHaveBeenCalled();
        });

        it("should handle password with only 1 character", async () => {
            const formData = createFormData({
                email: "short@test.com",
                password: "a",
                name: "Short Pass User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Kata sandi minimal 8 karakter.");
        });
    });

    describe("Type Confusion", () => {
        it("should handle email that looks like object toString", async () => {
            const formData = createFormData({
                email: "[object Object]",
                password: "password123",
                name: "Object User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Email tidak valid.");
            expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
        });

        it("should handle multiple values for same key", async () => {
            const formData = new FormData();
            formData.append("email", "first@test.com");
            formData.append("email", "second@test.com"); // Duplicate key
            formData.set("password", "password123");
            formData.set("name", "Multi Email User");

            const result = await registerUser(formData);

            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: "first@test.com" },
            });
            expect(result).toHaveProperty("success", true);
        });
    });

    describe("Wrong Key Names (Case Sensitivity)", () => {
        it("should fail when keys have wrong casing", async () => {
            const formData = new FormData();
            formData.set("Email", "test@test.com");
            formData.set("Password", "password123");
            formData.set("Name", "Wrong Case User");

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error");
        });

        it("should fail when keys are completely wrong", async () => {
            const formData = new FormData();
            formData.set("user_email", "test@test.com");
            formData.set("user_password", "password123");
            formData.set("user_name", "Wrong Key User");

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error");
        });
    });

    describe("Empty String vs Null/Undefined", () => {
        it("should reject empty string as email", async () => {
            const formData = createFormData({
                email: "",
                password: "password123",
                name: "Empty Email User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Email tidak valid.");
        });

        it("should reject empty string as password", async () => {
            const formData = createFormData({
                email: "test@test.com",
                password: "",
                name: "Empty Password User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Kata sandi tidak boleh kosong.");
        });

        it("should accept empty name (no validation)", async () => {
            const formData = createFormData({
                email: "noname@test.com",
                password: "password123",
                name: "",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Nama tidak boleh kosong.");
            expect(mockPrisma.user.create).not.toHaveBeenCalled();
        });
    });

    describe("SQL/NoSQL Injection", () => {
        it("should handle SQL injection in email", async () => {
            const formData = createFormData({
                email: "'; DROP TABLE users; --",
                password: "password123",
                name: "SQL Injection User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Email tidak valid.");
            expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
        });

        it("should handle NoSQL injection attempt", async () => {
            const formData = createFormData({
                email: '{"$gt":""}@test.com',
                password: "password123",
                name: "NoSQL Injection User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Email tidak valid.");
            expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
        });

        it("should handle LDAP injection attempt", async () => {
            const formData = createFormData({
                email: "*)(&(objectClass=*))@test.com",
                password: "password123",
                name: "LDAP Injection User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Email tidak valid.");
            expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
        });
    });

    describe("XSS/HTML Injection", () => {
        it("should handle XSS script tag in name", async () => {
            const xssPayload = '<script>alert("XSS")</script>';

            const formData = createFormData({
                email: "xss@test.com",
                password: "password123",
                name: xssPayload,
            });

            const result = await registerUser(formData);

            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: xssPayload,
                }),
            });
            expect(result).toHaveProperty("success", true);
        });

        it("should handle img onerror XSS in name", async () => {
            const xssPayload = '<img src=x onerror=alert(1)>';

            const formData = createFormData({
                email: "imgxss@test.com",
                password: "password123",
                name: xssPayload,
            });

            const result = await registerUser(formData);

            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: xssPayload,
                }),
            });
            expect(result).toHaveProperty("success", true);
        });

        it("should handle SVG onload XSS in email", async () => {
            const formData = createFormData({
                email: '<svg onload=alert(1)>@test.com',
                password: "password123",
                name: "SVG XSS User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Email tidak valid.");
            expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
        });
    });

    describe("Race Condition - Double Registration", () => {
        it("should potentially allow duplicate registration in race condition", async () => {
            let _callCount = 0;
            (mockPrisma.user.findUnique as jest.Mock).mockImplementation(
                async () => {
                    _callCount++;
                    return null;
                }
            );

            const formData = createFormData({
                email: "race@test.com",
                password: "password123",
                name: "Race Condition User",
            });

            const results = await Promise.all([
                registerUser(formData),
                registerUser(formData),
            ]);

            expect(mockPrisma.user.create).toHaveBeenCalledTimes(2);
            expect(results[0]).toHaveProperty("success", true);
            expect(results[1]).toHaveProperty("success", true);
        });

        it("should handle database unique constraint error gracefully", async () => {
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (mockPrisma.user.create as jest.Mock).mockRejectedValue(
                new Error("Unique constraint failed on the fields: (`email`)")
            );

            const formData = createFormData({
                email: "duplicate@test.com",
                password: "password123",
                name: "Duplicate User",
            });

            const result = await registerUser(formData);

            expect(result).toEqual({ error: "Something went wrong" });
        });
    });

    describe("Whitespace-Only Values", () => {
        it("should reject password with only spaces", async () => {
            const formData = createFormData({
                email: "whitespace@test.com",
                password: "     ",
                name: "Whitespace Password User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Kata sandi tidak boleh kosong.");
            expect(mockBcrypt.hash).not.toHaveBeenCalled();
        });

        it("should accept name with only whitespace", async () => {
            const formData = createFormData({
                email: "spacename@test.com",
                password: "password123",
                name: "   ",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Nama tidak boleh kosong.");
            expect(mockPrisma.user.create).not.toHaveBeenCalled();
        });

        it("should handle tabs and newlines in password", async () => {
            const formData = createFormData({
                email: "tabpass@test.com",
                password: "\t\n\r",
                name: "Tab Password User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Kata sandi tidak boleh kosong.");
            expect(mockBcrypt.hash).not.toHaveBeenCalled();
        });

        it("should handle mixed unicode whitespace", async () => {
            const unicodeWhitespace =
                "\u00A0\u2000\u2001\u2002\u2003\u2004\u2005";

            const formData = createFormData({
                email: "unicodespace@test.com",
                password: unicodeWhitespace,
                name: "Unicode Whitespace User",
            });

            const result = await registerUser(formData);

            expect(mockBcrypt.hash).not.toHaveBeenCalled();
            expect(result).toHaveProperty("error", "Kata sandi tidak boleh kosong.");
        });
    });

    describe("Additional Edge Cases", () => {
        it("should handle extremely long email", async () => {
            const longEmail = "a".repeat(1000) + "@test.com";

            const formData = createFormData({
                email: longEmail,
                password: "password123",
                name: "Long Email User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Email tidak valid.");
            expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
        });

        it("should handle email without @ symbol", async () => {
            const formData = createFormData({
                email: "notanemail",
                password: "password123",
                name: "Invalid Email User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Email tidak valid.");
            expect(mockPrisma.user.create).not.toHaveBeenCalled();
        });

        it("should handle email with multiple @ symbols", async () => {
            const formData = createFormData({
                email: "user@@domain@test.com",
                password: "password123",
                name: "Multi At User",
            });

            const result = await registerUser(formData);

            expect(result).toHaveProperty("error", "Email tidak valid.");
            expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
        });

        it("should handle prototype pollution attempt in name", async () => {
            const formData = createFormData({
                email: "proto@test.com",
                password: "password123",
                name: "__proto__",
            });

            const result = await registerUser(formData);

            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: "__proto__",
                }),
            });
            expect(result).toHaveProperty("success", true);
        });

        it("should handle null character in different positions", async () => {
            const formData = createFormData({
                email: "test@test.com",
                password: "pass\x00word",
                name: "Null\x00Name",
            });

            const result = await registerUser(formData);

            expect(mockBcrypt.hash).not.toHaveBeenCalled();
            expect(result).toHaveProperty("error", "Nama mengandung karakter yang tidak valid.");
        });
    });
});
