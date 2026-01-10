import { z } from "zod";

export const budgetSchema = z.object({
    category: z.string().min(1),
    amount: z.number().positive(),
    period: z.enum(["MONTHLY", "WEEKLY"]),
    start_date: z.date(),
    end_date: z.date(),
});

export type BudgetInput = z.infer<typeof budgetSchema>;