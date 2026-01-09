import { cn } from "@/lib/utils";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

export const GlassCard = ({ children, className }: GlassCardProps) => {
    return (
        <div className={cn("claude-card p-6", className)}>
            {children}
        </div>
    );
};
