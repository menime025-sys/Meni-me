"use client";

import * as React from "react";

interface SwitchProps extends React.ComponentProps<"button"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, className = "", ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        ref={ref}
        className={`relative inline-flex h-6 w-11 items-center rounded-full border border-slate-200 transition ${
          checked ? "bg-slate-900" : "bg-slate-100"
        } ${className}`}
        {...props}
      >
        <span
          className={`inline-block size-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    );
  },
);

Switch.displayName = "Switch";
