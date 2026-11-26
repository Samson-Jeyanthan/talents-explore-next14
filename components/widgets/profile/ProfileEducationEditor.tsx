"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MdClose } from "react-icons/md";
import { saveProfileEducationAction } from "@/actions/profile-education.action";
import {
  educationKey,
  educationEndValue,
  profileEducationValidation,
  type ProfileEducation,
} from "@/lib/utils/profile-education";
import { useProfileAwardWrite as useProfileDetailWrite } from "@/lib/hooks/useProfileAwardWrite";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import EducationEditForm from "@/components/forms/EducationEditForm";

export default function ProfileEducationEditor({
  isOpen,
  onClose,
  data,
  isEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  data?: ProfileEducation;
  isEdit: boolean;
}) {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const selection = isEdit ? educationKey(data) : "new";
  const write = useProfileDetailWrite(
    `${params.userId}:${selection}:${isOpen}`,
  );
  const form = useForm<z.input<typeof profileEducationValidation>>({
    resolver: zodResolver(profileEducationValidation),
    defaultValues: { course: "", institution: "", from: "", to: "" },
  });
  const initial = useRef(data);
  initial.current = data;
  const { reset } = form;
  useEffect(() => {
    if (!isOpen) return;
    const row = isEdit ? initial.current : undefined;
    reset({
      course: row?.course || "",
      institution: row?.institution || "",
      from: row?.from == null ? "" : String(row.from),
      to: educationEndValue(row?.to),
    });
  }, [isOpen, selection, isEdit, reset]);
  const submit = async (
    education: z.input<typeof profileEducationValidation>,
  ) => {
    await write.run(
      () =>
        saveProfileEducationAction({
          profileId: params.userId,
          ...(isEdit ? { educationId: selection } : {}),
          education,
        }),
      () => {
        onClose();
        router.refresh();
      },
    );
  };
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !write.pending) onClose();
      }}
    >
      <DialogContent
        className="modal-content-container max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
        onEscapeKeyDown={(event) => {
          if (write.pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (write.pending) event.preventDefault();
        }}
      >
        <DialogTitle className="mb-2 border-b border-dark-400 px-6 pb-2 text-center text-light-900">
          {isEdit ? "Edit Education Detail" : "Add Education Detail"}
        </DialogTitle>
        <Form {...form}>
          <EducationEditForm
            isEdit={isEdit}
            form={form}
            onSubmit={submit}
            pending={write.pending}
            error={write.error}
          />
        </Form>
        <button
          type="button"
          aria-label="Close education editor"
          disabled={write.pending}
          onClick={onClose}
          className="absolute right-2 top-2 cursor-pointer rounded-full bg-dark-400 p-[6px] text-light-900 focus:outline-none"
        >
          <MdClose className="text-2xl" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
