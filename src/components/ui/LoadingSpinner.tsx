import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    className?: string;
    size?: number;
}

export function LoadingSpinner({
    className,
    size = 24
}: LoadingSpinnerProps) {
    return (
        <div className={cn("flex justify-center items-center w-full p-4", className)}>
            <Loader2
                className="animate-spin text-accent"
                size={size}
            />
        </div>
    );
}
