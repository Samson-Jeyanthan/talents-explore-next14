"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MdClose } from "react-icons/md";
import { saveProfileLanguageAction } from "@/actions/profile-languages.action";
import { profileLanguageFormValidation } from "@/lib/utils/profile-languages";
import { useProfileOptions } from "@/lib/hooks/useProfileOptions";
import { useProfileAwardWrite as useProfileWrite } from "@/lib/hooks/useProfileAwardWrite";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import LanguageEditForm from "@/components/forms/LanguageEditForm";
import type { ILanguage } from "@/types/profile.types";

export default function ProfileLanguageEditor({
  isOpen,
  isEdit,
  onClose,
  data,
}: {
  isOpen: boolean;
  isEdit: boolean;
  onClose: () => void;
  data?: ILanguage;
}) {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const selection = isEdit ? data?._id || "" : "new";
  const write = useProfileWrite(`${params.userId}:${selection}:${isOpen}`);
  const options = useProfileOptions("language", undefined);
  const form = useForm<z.input<typeof profileLanguageFormValidation>>({
    resolver: zodResolver(profileLanguageFormValidation),
    defaultValues: { languageId: "", languageLevel: undefined },
  });
  const initial = useRef(data);
  initial.current = data;
  const { reset } = form;
  useEffect(() => {
    if (!isOpen) return;
    const row = isEdit ? initial.current : undefined;
    reset({
      languageId: row?.languageId || "",
      languageLevel: row?.level as
        | z.input<typeof profileLanguageFormValidation>["languageLevel"]
        | undefined,
    });
  }, [isOpen, selection, isEdit, reset]);
  const submit = async (
    values: z.input<typeof profileLanguageFormValidation>,
  ) => {
    if (isEdit && !selection) {
      write.setError(
        "Unable to identify this language. Refresh your profile and try again.",
      );
      return;
    }
    if (
      options.status !== "ready" &&
      !(isEdit && values.languageId === initial.current?.languageId)
    ) {
      write.setError(
        "Reload the language choices before adding or changing a language.",
      );
      return;
    }
    await write.run(
      () =>
        saveProfileLanguageAction({
          profileId: params.userId,
          ...(isEdit ? { entryId: selection } : {}),
          language: {
            languageId: values.languageId,
            level: values.languageLevel,
          },
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
          {isEdit ? "Edit Language Detail" : "Add Language Detail"}
        </DialogTitle>
        <Form {...form}>
          <LanguageEditForm
            isEdit={isEdit}
            form={form}
            lookup={options}
            savedLanguage={isEdit ? data : undefined}
            onSubmit={submit}
            pending={write.pending}
            error={write.error}
          />
        </Form>
        <button
          type="button"
          aria-label="Close language editor"
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
