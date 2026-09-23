"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FileUp, LifeBuoy, MessageSquare, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { submitFeedbackAction, submitHelpSupportAction } from "@/actions/settings.action";
import { FormInput, TextArea } from "@/components/inputs";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalLoading } from "@/context/LoadingProvider";
import { uploadFileToStorage } from "@/lib/utils/uploadFile";

type Feature = "help-support" | "feedback";

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required`);
const email = z.string().trim().email("Enter a valid email");

const helpSchema = z.object({
  name: requiredText("Name"),
  email,
  accountType: requiredText("Account Type"),
  priority: z.enum(["Low", "Medium", "High"], { required_error: "Priority Level is required" }),
  summary: requiredText("Subject"),
  description: requiredText("Description"),
});

const feedbackSchema = z
  .object({
    fullName: requiredText("Full Name"),
    email,
    workingWell: z.string().trim(),
    improvements: z.string().trim(),
  })
  .refine((values) => Boolean(values.workingWell || values.improvements), {
    path: ["improvements"],
    message: "Complete at least one feedback section",
  });

type HelpValues = z.infer<typeof helpSchema>;
type FeedbackValues = z.infer<typeof feedbackSchema>;

const ACCOUNT_TYPES = [
  { value: "Creator", label: "Creator / Talent" },
  { value: "Agency/Manager", label: "Agency / Manager" },
  { value: "Brand/Partner", label: "Brand / Partner" },
];

const PRIORITIES = ["Low", "Medium", "High"] as const;

function getUserName(currentUser: any) {
  const firstName = currentUser?.firstName || currentUser?.personalInfo?.firstName || "";
  const lastName = currentUser?.lastName || currentUser?.personalInfo?.lastName || "";
  return [firstName, lastName].filter(Boolean).join(" ").trim() || currentUser?.userName || "";
}

function getUserEmail(currentUser: any) {
  return currentUser?.email || currentUser?.personalInfo?.email || "";
}

function RequestShell({ feature, children }: { feature: Feature; children: ReactNode }) {
  const isFeedback = feature === "feedback";
  const Icon = isFeedback ? MessageSquare : LifeBuoy;
  const title = isFeedback ? "Share Feedback" : "Help / Support";
  const description = isFeedback
    ? "Tell us what would make Talents Explore better."
    : "Tell us what you need help with and our team will review it.";

  return (
    <section className="w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/settings" className="mb-5 inline-flex items-center gap-2 text-sm text-light-500 transition hover:text-light-900">
        <ChevronLeft size={18} /> Back to Settings
      </Link>
      <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-5 sm:p-7">
        <div className="mb-7 flex items-start gap-4">
          <div className={`rounded-2xl p-3 ${isFeedback ? "bg-sky-500/15 text-sky-300" : "bg-primary-500/15 text-primary-500"}`}>
            <Icon size={23} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-light-900">{title}</h1>
            <p className="pt-1 text-sm leading-6 text-light-500">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function AttachmentField({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-dark-300 bg-dark-200 p-4">
      <label className="flex cursor-pointer items-center gap-3 text-sm text-light-700">
        <FileUp className="shrink-0 text-primary-500" size={20} />
        <span className="min-w-0 flex-1 truncate">{file?.name || "Add attachment (Image or PDF) - Optional"}</span>
        <span className="shrink-0 text-xs text-light-500">Browse</span>
        <Input
          className="sr-only"
          type="file"
          accept="image/*,application/pdf"
          onChange={(event) => onChange(event.target.files?.[0] || null)}
        />
      </label>
      <p className="pt-2 text-xs text-light-500">You can attach an image or PDF to help explain your request.</p>
    </div>
  );
}

function HelpSupportForm({ currentUser }: { currentUser: any }) {
  const router = useRouter();
  const { withLoading } = useGlobalLoading();
  const [attachment, setAttachment] = useState<File | null>(null);
  const form = useForm<HelpValues>({
    resolver: zodResolver(helpSchema),
    defaultValues: { name: "", email: "", accountType: "", priority: undefined, summary: "", description: "" },
  });

  useEffect(() => {
    form.reset({
      name: getUserName(currentUser),
      email: getUserEmail(currentUser),
      accountType: currentUser?.isTalent ? "Creator" : "",
      priority: undefined,
      summary: "",
      description: "",
    });
  }, [currentUser, form]);

  const submit = async (values: HelpValues) => {
    try {
      const result = await withLoading("Submitting support request...", async () => {
        const uploaded = attachment
          ? await uploadFileToStorage(attachment, "help-support", currentUser?.userName || currentUser?._id || "user")
          : null;
        return submitHelpSupportAction({ ...values, attachmentUrl: uploaded?.url || "" });
      });
      if (result?.status !== "7400") throw new Error(result?.message || "Unable to submit support request");
      toast.success(result?.message || "Support request submitted successfully");
      router.push("/settings");
    } catch (error: any) {
      toast.error(error?.message || "Unable to submit support request");
    }
  };

  return (
    <RequestShell feature="help-support">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="grid gap-5">
          <p className="text-sm font-medium text-light-900">Personal Details</p>
          <FormInput form={form} formLabel="Name" inputName="name" inputType="text" placeholder="Name" />
          <FormInput form={form} formLabel="Email" inputName="email" inputType="email" placeholder="Email" />
          <FormField control={form.control} name="accountType" render={({ field }) => (
            <FormItem><FormLabel className="shad-auth_form_label">Account Type</FormLabel><Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger className="shad-form-input text-light-900"><SelectValue placeholder="Account Type" /></SelectTrigger></FormControl>
              <SelectContent className="border-dark-300 bg-dark-200 text-light-900">{ACCOUNT_TYPES.map((option) => <SelectItem key={option.value} value={option.value} className="text-light-900 focus:bg-dark-300 focus:text-light-900">{option.label}</SelectItem>)}</SelectContent>
            </Select><FormMessage className="shad-auth_form_message" /></FormItem>
          )} />
          <p className="pt-2 text-sm font-medium text-light-900">Issue Details</p>
          <FormField control={form.control} name="priority" render={({ field }) => (
            <FormItem><FormLabel className="shad-auth_form_label">Priority Level</FormLabel>
              <div className="flex flex-wrap gap-3">{PRIORITIES.map((priority) => {
                const active = field.value === priority;
                return <button key={priority} type="button" onClick={() => field.onChange(priority)} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${active ? "border-primary-500 bg-primary-500/10 text-light-900" : "border-dark-300 bg-dark-200 text-light-500 hover:border-primary-500/40"}`}><span className={`size-4 rounded-full border-2 ${active ? "border-primary-500 bg-primary-500 shadow-[inset_0_0_0_3px_#182238]" : "border-light-500"}`} />{priority}</button>;
              })}</div><FormMessage className="shad-auth_form_message" />
            </FormItem>
          )} />
          <FormInput form={form} formLabel="Subject" inputName="summary" inputType="text" placeholder="Brief summary of your request" />
          <TextArea form={form} formLabel="Description" inputName="description" placeholder="Describe the issue with details" className="min-h-32" />
          <AttachmentField file={attachment} onChange={setAttachment} />
          <SubmitButton loading={form.formState.isSubmitting} label="Submit Request" />
        </form>
      </Form>
    </RequestShell>
  );
}

function FeedbackForm({ currentUser }: { currentUser: any }) {
  const router = useRouter();
  const { withLoading } = useGlobalLoading();
  const [attachment, setAttachment] = useState<File | null>(null);
  const form = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { fullName: "", email: "", workingWell: "", improvements: "" },
  });

  useEffect(() => {
    form.reset({ fullName: getUserName(currentUser), email: getUserEmail(currentUser), workingWell: "", improvements: "" });
  }, [currentUser, form]);

  const submit = async (values: FeedbackValues) => {
    try {
      const result = await withLoading("Submitting feedback...", async () => {
        const uploaded = attachment
          ? await uploadFileToStorage(attachment, "feedback", currentUser?.userName || currentUser?._id || "user")
          : null;
        return submitFeedbackAction({ ...values, attachmentUrl: uploaded?.url || "" });
      });
      if (result?.status !== "7400") throw new Error(result?.message || "Unable to submit feedback");
      toast.success(result?.message || "Feedback submitted successfully");
      router.push("/settings");
    } catch (error: any) {
      toast.error(error?.message || "Unable to submit feedback");
    }
  };

  return (
    <RequestShell feature="feedback">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="grid gap-5">
          <p className="text-sm font-medium text-light-900">Personal Details</p>
          <FormInput form={form} formLabel="Full Name" inputName="fullName" inputType="text" placeholder="Full Name" />
          <FormInput form={form} formLabel="Email" inputName="email" inputType="email" placeholder="Email" />
          <p className="pt-2 text-sm font-medium text-light-900">Feedback</p>
          <TextArea form={form} formLabel="What is working well?" inputName="workingWell" placeholder="What is working well?" className="min-h-28" />
          <TextArea form={form} formLabel="What could be improved or added?" inputName="improvements" placeholder="What could be improved or added?" className="min-h-28" />
          <AttachmentField file={attachment} onChange={setAttachment} />
          <SubmitButton loading={form.formState.isSubmitting} label="Submit Feedback" />
        </form>
      </Form>
    </RequestShell>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return <Button type="submit" disabled={loading} className="mt-1 w-full rounded-2xl bg-primary-500 py-6 text-base font-semibold text-light-900 hover:bg-primary-500/90">{loading ? "Submitting..." : label}</Button>;
}

export default function SupportFeedback({ feature, currentUser }: { feature: Feature; currentUser: any }) {
  return feature === "feedback" ? <FeedbackForm currentUser={currentUser} /> : <HelpSupportForm currentUser={currentUser} />;
}
