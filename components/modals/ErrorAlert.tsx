"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ErrorAlert = ({
  isOpen,
  title,
  error,
  onClick,
}: {
  isOpen: boolean;
  title: string;
  error: string;
  onClick?: () => void;
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogOverlay />
      <AlertDialogContent className="rounded-2xl border-none bg-dark-250 p-6 text-light-900">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{error}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClick}
            className="shad-btn_primary-200 border-none"
          >
            Ok
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ErrorAlert;
