"use client";

import React from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      // theme={theme as ToasterProps["theme"]}
      // className="toaster group"
      toastOptions={{
        classNames: {
          // toast:
          //   "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          success:
            "bg-light-900 dark:bg-dark-100 text-green-400 border-2 border-[#fafafa] dark:border-[#161616] font-poppins font-regular",
          error:
            "bg-light-900 dark:bg-dark-100 text-red-400 border-2 border-[#fafafa] dark:border-[#161616] font-poppins font-regular",
          info: "bg-light-900 dark:bg-dark-100 text-red-400 border-2 border-[#fafafa] dark:border-[#161616] font-poppins font-regular",
          description: "group-[.toast]:text-muted-foreground",
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
