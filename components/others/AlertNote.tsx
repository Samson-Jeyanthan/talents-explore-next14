"use client";

import { toast } from "sonner";

function AlertNote() {
  toast.error("Please Login first!", { duration: 3000 });
  return <></>;
}

export default AlertNote;
