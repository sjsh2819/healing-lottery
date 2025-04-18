import React, { ButtonHTMLAttributes } from "react";

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className = "", ...props }, ref) => (
  <button
    ref={ref}
    className={
      "inline-flex items-center justify-center font-semibold focus:outline-none transition disabled:opacity-50 " +
      className
    }
    {...props}
  />
));
Button.displayName = "Button";
