import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "secondary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "border-blue-500 bg-blue-500 text-white hover:bg-blue-400",
        variant === "secondary" && "border-neutral-800 bg-neutral-900 text-neutral-100 hover:bg-neutral-800",
        variant === "ghost" && "border-transparent bg-transparent text-neutral-300 hover:bg-neutral-900 hover:text-white",
        variant === "danger" && "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
        size === "sm" && "h-8 px-3",
        size === "md" && "h-10 px-4",
        size === "icon" && "h-9 w-9 p-0",
        className
      )}
      {...props}
    />
  );
}
