import React, { TextareaHTMLAttributes } from "react";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea
    ref={ref}
    className={
      "w-full rounded-md bg-neutral-800/70 border border-neutral-600/40 p-3 text-sm outline-none focus:ring " +
      className
    }
    {...props}
  />
));
Textarea.displayName = "Textarea";
