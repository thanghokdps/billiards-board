import type { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const control =
  "w-full rounded-md border border-line-strong bg-surface-2 px-3.5 text-base text-ivory placeholder:text-ivory-faint transition-colors focus:border-lamp/70 focus:outline-none disabled:opacity-50";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24 py-3", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-semibold text-ivory-muted", className)} {...props} />;
}
