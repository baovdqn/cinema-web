import { cn } from "@/lib/utils";

export function ActiveSwitch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50",
        checked ? "bg-red-600" : "bg-neutral-700",
      )}
    >
      <span className={cn("inline-block h-5 w-5 rounded-full bg-white transition", checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}
