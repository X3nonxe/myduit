import { AuthCard } from "@/components/auth/AuthCard";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#f9f8f4]">
            <AuthCard type="login" />
        </div>
    );
}
