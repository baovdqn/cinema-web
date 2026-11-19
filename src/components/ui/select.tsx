import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string };

/** <select> theo theme tối, có label + lỗi giống FormField. */
export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, id, className, children, ...props },
  ref,
) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm text-neutral-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={!!error}
        className={cn(
          "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-red-500 disabled:opacity-50",
          error && "border-red-500",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
});
