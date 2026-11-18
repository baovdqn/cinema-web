import { forwardRef, useId } from "react";
import { Input } from "@/components/ui/input";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export const FormField = forwardRef<HTMLInputElement, Props>(function FormField(
  { label, error, id, ...props },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm text-neutral-300">
        {label}
      </label>
      <Input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={error ? "border-red-500" : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});
