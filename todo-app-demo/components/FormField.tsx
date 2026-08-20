import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

export default function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}
