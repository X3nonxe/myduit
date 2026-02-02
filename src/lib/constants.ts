export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const CACHE_TTL_SECONDS = 300;

export const MAX_STRING_LENGTH = 255;
export const MAX_CATEGORY_LENGTH = 100;
export const MAX_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 500;

export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
export const ERROR_MESSAGES = {
    UNAUTHORIZED: "Unauthorized",
    SESSION_INVALID: "Sesi tidak valid. Silakan login kembali.",
    NOT_FOUND: "Data tidak ditemukan.",
    DELETE_FAILED: "Gagal menghapus data.",
    UPDATE_FAILED: "Gagal memperbarui data.",
    CREATE_FAILED: "Gagal menyimpan data.",
    VALIDATION_FAILED: "Data tidak valid.",
} as const;

export const PATHS = {
    DASHBOARD: "/dashboard",
} as const;

export const CACHE_TAGS = {
    DASHBOARD_STATS: "dashboard-stats",
    TRANSACTION_SUMMARY: "transaction-summary",
} as const;
