import { z } from "zod";

export const budgetSchema = z.object({
    category: z.string().min(1, "Kategori tidak boleh kosong."),
    amount: z.number()
        .positive("Jumlah harus positif.")
        .max(Number.MAX_SAFE_INTEGER, "Jumlah anggaran terlalu besar.")
        .finite("Jumlah tidak valid."),
    period: z.enum(["MONTHLY", "WEEKLY"], { errorMap: () => ({ message: "Periode tidak valid." }) }),
    start_date: z.date(),
    end_date: z.date(),
}).refine((data) => data.start_date <= data.end_date, {
    message: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai.",
    path: ["start_date"], // Attach error to start_date
});

export const userProfileSchema = z.object({
    name: z.string()
        .min(1, "Nama tidak boleh kosong.")
        .max(255, "Nama tidak boleh lebih dari 255 karakter.")
        .refine((name) => name.trim().length > 0, "Nama tidak boleh kosong.")
        .refine((name) => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(name), "Nama mengandung karakter yang tidak valid."),
    image: z.string().optional().nullable().superRefine((val, ctx) => {
        if (!val || val.trim() === "") return;

        if (val.length > 2048) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL gambar terlalu panjang." });
            return;
        }

        const dangerousSchemes = /^(javascript|data|vbscript|java):/i;
        if (dangerousSchemes.test(val.trim())) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL gambar tidak valid." });
            return;
        }

        const isValidUrl = val.startsWith("https://") || val.startsWith("/");
        if (!isValidUrl) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL gambar harus menggunakan HTTPS." });
            return;
        }
    }),
});

export const changePasswordSchema = z.object({
    oldPassword: z.string(),
    newPassword: z.string()
        .min(1, "Kata sandi tidak boleh kosong.")
        .refine((pwd) => pwd.trim().length > 0, "Kata sandi tidak boleh kosong.")
        .refine((pwd) => pwd.length >= 8, "Kata sandi minimal 8 karakter.")
        .refine((pwd) => pwd.length <= 128, "Kata sandi maksimal 128 karakter."),
    confirmPassword: z.string().optional(),
});

export const registerSchema = z.object({
    name: userProfileSchema.shape.name,
    email: z.string().email("Email tidak valid.").max(255, "Email tidak valid."),
    password: changePasswordSchema.shape.newPassword,
});

export const accountSchema = z.object({
    name: z.string()
        .min(1, "Nama akun tidak boleh kosong.")
        .max(100, "Nama akun tidak boleh lebih dari 100 karakter.")
        .refine((name) => name.trim().length > 0, "Nama akun tidak boleh kosong.")
        .refine((name) => !/[\x00-\x1F\x7F]/.test(name), "Nama akun mengandung karakter yang tidak valid."),
    type: z.enum(["bank", "cash", "e-wallet", "credit_card", "other"], {
        errorMap: () => ({ message: "Tipe akun tidak valid. Pilih: bank, cash, e-wallet, credit_card, other." })
    }),
    balance: z.number({ invalid_type_error: "Saldo harus berupa angka yang valid." })
        .min(0, "Saldo tidak boleh negatif.")
        .max(Number.MAX_SAFE_INTEGER, "Saldo melebihi batas maksimum.")
        .finite("Saldo harus berupa angka yang valid."), // Ensure not Infinity
});

export const goalSchema = z.object({
    name: z.string()
        .min(1, "Goal name cannot be empty.")
        .max(255, "Goal name is too long.")
        .refine((name) => name.trim().length > 0, "Goal name cannot be empty."),
    target_amount: z.number({ invalid_type_error: "Target amount must be a valid number." })
        .min(0, "Target amount cannot be negative.")
        .max(Number.MAX_SAFE_INTEGER, "Target amount exceeds maximum allowed value.")
        .finite("Target amount must be a valid number."),
    current_amount: z.number({ invalid_type_error: "Current amount must be a valid number." })
        .min(0, "Current amount cannot be negative.")
        .max(Number.MAX_SAFE_INTEGER, "Current amount exceeds maximum allowed value.")
        .finite("Current amount must be a valid number."),
    deadline: z.date({ invalid_type_error: "Invalid deadline date." }).optional(),
});

export const transactionSchema = z.object({
    amount: z.number({ invalid_type_error: "Amount must be a valid number.", required_error: "Amount must be a valid number." })
        .min(0, "Amount cannot be negative.")
        .max(Number.MAX_SAFE_INTEGER, "Amount exceeds maximum allowed value.")
        .finite("Amount must be a valid number."),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    category: z.string()
        .min(1, "Category cannot be empty.")
        .max(100, "Category is too long.")
        .refine((val) => val.trim().length > 0, "Category cannot be empty."),
    date: z.date(),
    description: z.string().optional().nullable(),
    account_id: z.string().max(255, "Account ID is too long.").optional().nullable(),
});

export type BudgetInput = z.infer<typeof budgetSchema>;