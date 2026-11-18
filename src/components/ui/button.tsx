import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-red-600 text-white hover:bg-red-500",
        variant === "secondary" && "bg-neutral-800 text-white hover:bg-neutral-700",
        variant === "ghost" && "hover:bg-neutral-800",
        className,
      )}
      {...props}
    />
  );
}
