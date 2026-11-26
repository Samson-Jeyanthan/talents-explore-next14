"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "./input";

interface PasswordInputProps extends InputProps {
  visibilityLabel?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { className, id, disabled, visibilityLabel = "password", ...props },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const [visible, setVisible] = React.useState(false);
    const label = `${visible ? "Hide" : "Show"} ${visibilityLabel}`;
    return (
      <div className="relative w-full">
        <Input
          {...props}
          id={inputId}
          ref={ref}
          disabled={disabled}
          type={visible ? "text" : "password"}
          className={cn(className, "pr-12")}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={label}
          aria-controls={inputId}
          aria-pressed={visible}
          title={label}
          className="absolute inset-y-0 right-1 flex w-10 items-center justify-center rounded-md text-light-500 hover:text-light-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
