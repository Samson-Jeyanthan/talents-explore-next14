"use client";

import React from "react";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/context/ThemeProvider";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme}
      // className="toaster group"
      toastOptions={{
        classNames: {
          // toast:
          //   "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          toast:
            "!border-dark-400 !bg-dark-250 !text-light-900 font-css-poppins",
          description: "!text-light-700",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
