"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { BadgeDollarSign, ChevronLeft, Megaphone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormInput, TextArea } from "@/components/inputs";
import { TransparentLoader } from "@/components/modals";
import {
  getAdvertisementRequestsAction,
  getPaidPromotionRequestsAction,
  submitAdvertisementRequestAction,
  submitPaidPromotionRequestAction,
  type AdvertisementRequestPayload,
  type PaidPromotionRequestPayload,
} from "@/actions/settings.action";

type Feature = "advertisement" | "paid-promotions";
type View = "list" | "form";

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required`);
const positiveNumber = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => !Number.isNaN(Number(value)), `${label} must be a valid number`)
    .refine((value) => Number(value) > 0, `${label} must be greater than 0`);

const advertisementSchema = z
  .object({
    firstName: requiredText("First Name"),
    lastName: requiredText("Last Name"),
    companyName: requiredText("Company Name"),
    typeOfAdvertisement: requiredText("Type of Advertisement"),
    targetAudience: requiredText("Target Audience"),
    contactInfo: requiredText("Contact Info"),
    preferredLocations: requiredText("Preferred Locations"),
    budget: positiveNumber("Budget for Advertisement Campaign"),
    startDate: requiredText("Start Date"),
    finishDate: requiredText("Finish Date"),
    furtherDetails: requiredText("Any Further Relevant Details"),
  })
  .refine((value) => value.finishDate >= value.startDate, {
    path: ["finishDate"],
    message: "Finish Date cannot be earlier than Start Date",
  });

const paidPromotionSchema = z.object({
  firstName: requiredText("First Name"),
  lastName: requiredText("Last Name"),
  dob: requiredText("DOB"),
  profession: requiredText("Profession"),
  teProfileUsername: requiredText("TE profile username"),
  skills: requiredText("Skills"),
  height: requiredText("Height"),
  ethnic: requiredText("Ethnic"),
  language: requiredText("Language"),
  location: requiredText("Location"),
  contactInfo: requiredText("Contact Info"),
  previousExperience: requiredText("Previous Experience"),
  availability: requiredText("Availability"),
  expectedPayPerPost: positiveNumber("Expected pay per post"),
  followersByPlatform: requiredText("Followers in different platforms"),
  socialMediaLinks: requiredText("Social media links"),
});

type AdvertisementValues = z.infer<typeof advertisementSchema>;
type PaidPromotionValues = z.infer<typeof paidPromotionSchema>;

const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const formatStatus = (value?: string) => {
  const status = (value || "").trim().toUpperCase().replace(/[\s_-]+/g, "");
  if (status === "INREVIEW") return "In Review";
  if (status === "ACCEPTED" || status === "APPROVED") return "Accepted";
  if (status === "REJECTED") return "Rejected";
  if (status === "PENDING") return "Pending";
  if (status === "DRAFT") return "Draft";
  return value || "-";
};

const statusClass = (value?: string) => {
  const status = (value || "").trim().toUpperCase().replace(/[\s_-]+/g, "");
  if (status === "INREVIEW" || status === "PENDING") return "bg-amber-500/15 text-amber-300";
  if (status === "ACCEPTED" || status === "APPROVED") return "bg-emerald-500/15 text-emerald-300";
  if (status === "REJECTED") return "bg-primary-500/15 text-primary-500";
  return "bg-light-500/15 text-light-500";
};

function DateField({ form, name, label, min, max }: { form: any; name: string; label: string; min?: string; max?: string }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel className="shad-auth_form_label">{label}</FormLabel>
          <FormControl>
            <Input {...field} type="date" min={min} max={max} className="shad-form-input [color-scheme:dark]" />
          </FormControl>
          <FormMessage className="shad-auth_form_message" />
        </FormItem>
      )}
    />
  );
}

function EmptyState({ feature }: { feature: Feature }) {
  const title = feature === "advertisement" ? "No requests yet" : "No requests yet";
  const text = feature === "advertisement"
    ? "Your submitted advertisement requests will appear here."
    : "Your submitted paid promotion requests will appear here.";
  return (
    <div className="rounded-[28px] border border-dark-300 bg-dark-250 px-6 py-12 text-center">
      <p className="text-base font-medium text-light-900">{title}</p>
      <p className="mx-auto pt-2 text-sm text-light-500">{text}</p>
    </div>
  );
}

function RequestCard({ item, feature }: { item: any; feature: Feature }) {
  const isAdvertisement = feature === "advertisement";
  const heading = isAdvertisement
    ? item?.typeOfAdvertisement || "Advertisement Request"
    : `${item?.firstName || ""} ${item?.lastName || ""}`.trim() || "Paid Promotion Request";
  const subheading = isAdvertisement ? item?.companyName : item?.profession || item?.teProfileUsername;
  const requestDate = item?.createdAt ? formatDate(item.createdAt) : "-";

  return (
    <article className={`rounded-[28px] border bg-dark-250 p-5 ${isAdvertisement ? "border-dark-300" : "border-[#B4235A]/30"}`}>
      {!isAdvertisement ? <div className="mb-4 h-1 rounded-full bg-[#B4235A]" /> : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-base font-semibold ${isAdvertisement ? "text-light-900" : "text-[#E66B9D]"}`}>{heading}</p>
          <p className="truncate pt-1 text-sm text-light-500">{subheading || "-"}</p>
        </div>
        {isAdvertisement ? (
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusClass(item?.status)}`}>{formatStatus(item?.status)}</span>
        ) : null}
      </div>

      {isAdvertisement ? (
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <Meta label="Request by" value={`${item?.firstName || ""} ${item?.lastName || ""}`.trim()} />
          <Meta label="Target audience" value={item?.targetAudience} />
          <Meta label="Preferred locations" value={item?.preferredLocations} />
          <Meta label="Budget" value={item?.budget ? `$${item.budget}` : "-"} />
          <Meta label="Campaign period" value={`${formatDate(item?.startDate)} - ${formatDate(item?.finishDate)}`} />
          <Meta label="Contact info" value={item?.contactInfo} />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <Meta label="TE profile username" value={item?.teProfileUsername} />
          <Meta label="DOB" value={formatDate(item?.dob)} />
          <Meta label="Skills" value={item?.skills} />
          <Meta label="Height" value={item?.height} />
          <Meta label="Location" value={item?.location} />
          <Meta label="Expected pay per post" value={item?.expectedPayPerPost ? `$${item.expectedPayPerPost}` : "-"} />
          <Meta label="Followers in different platforms" value={item?.followersByPlatform} />
          <Meta label="Social media links" value={item?.socialMediaLinks} />
          <Meta label="Contact info" value={item?.contactInfo} />
        </div>
      )}

      {item?.[isAdvertisement ? "furtherDetails" : "previousExperience"] ? (
        <div className="mt-5 rounded-2xl bg-dark-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-light-500">{isAdvertisement ? "Details" : "Previous Experience"}</p>
          <p className="pt-1 text-sm leading-6 text-light-700">{item[isAdvertisement ? "furtherDetails" : "previousExperience"]}</p>
        </div>
      ) : null}

      {!isAdvertisement ? (
        <p className="mt-4 rounded-2xl bg-[#B4235A]/10 px-3 py-2 text-xs leading-5 text-[#E66B9D]">Your application has been received. Our support team will reach you personally.</p>
      ) : null}
      <p className="pt-4 text-xs text-light-500">Submitted on {requestDate}</p>
    </article>
  );
}

function Meta({ label, value }: { label: string; value?: string }) {
  return <p className="min-w-0 text-light-500"><span className="font-medium text-light-700">{label}: </span>{value || "-"}</p>;
}

function AdvertisementForm() {
  const router = useRouter();
  const form = useForm<AdvertisementValues>({
    resolver: zodResolver(advertisementSchema),
    defaultValues: { firstName: "", lastName: "", companyName: "", typeOfAdvertisement: "", targetAudience: "", contactInfo: "", preferredLocations: "", budget: "", startDate: "", finishDate: "", furtherDetails: "" },
  });
  const startDate = form.watch("startDate");

  const submit = async (values: AdvertisementValues) => {
    const payload: AdvertisementRequestPayload = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      finishDate: new Date(values.finishDate).toISOString(),
    };
    const result = await submitAdvertisementRequestAction(payload);
    if (result?.status !== "7400") {
      toast.error(result?.message || "Unable to submit advertisement request");
      return;
    }
    toast.success(result?.message || "Advertisement request submitted successfully");
    router.push("/settings/advertisement");
    router.refresh();
  };

  return (
    <>
      {form.formState.isSubmitting ? <TransparentLoader text="Submitting advertisement request" /> : null}
      <RequestFormShell title="Request Advertisement" description="Fill in the details below and we&apos;ll keep your request saved here." backHref="/settings/advertisement" accent="advertisement">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormInput form={form} formLabel="First Name" inputName="firstName" inputType="text" placeholder="First Name" />
            <FormInput form={form} formLabel="Last Name" inputName="lastName" inputType="text" placeholder="Last Name" />
          </div>
          <FormInput form={form} formLabel="Company Name" inputName="companyName" inputType="text" placeholder="Company Name" />
          <FormInput form={form} formLabel="Type of Advertisement" inputName="typeOfAdvertisement" inputType="text" placeholder="Type of Advertisement" />
          <FormInput form={form} formLabel="Target Audience" inputName="targetAudience" inputType="text" placeholder="Target Audience" />
          <FormInput form={form} formLabel="Contact Info" inputName="contactInfo" inputType="text" placeholder="Contact Info (Email or Phone)" />
          <FormInput form={form} formLabel="Preferred Locations" inputName="preferredLocations" inputType="text" placeholder="Preferred Locations" />
          <FormInput form={form} formLabel="Budget for Advertisement Campaign" inputName="budget" inputType="number" placeholder="Budget for Advertisement Campaign" />
          <div className="grid gap-5 sm:grid-cols-2">
            <DateField form={form} name="startDate" label="Start Date" min={today()} />
            <DateField form={form} name="finishDate" label="Finish Date" min={startDate || today()} />
          </div>
          <TextArea form={form} formLabel="Any Further Relevant Details" inputName="furtherDetails" placeholder="Any Further Relevant Details" className="min-h-32" />
          <SubmitButton loading={form.formState.isSubmitting} label="Submit Request" accent="advertisement" />
          </form>
        </Form>
      </RequestFormShell>
    </>
  );
}

function PaidPromotionForm() {
  const router = useRouter();
  const form = useForm<PaidPromotionValues>({
    resolver: zodResolver(paidPromotionSchema),
    defaultValues: { firstName: "", lastName: "", dob: "", profession: "", teProfileUsername: "", skills: "", height: "", ethnic: "", language: "", location: "", contactInfo: "", previousExperience: "", availability: "", expectedPayPerPost: "", followersByPlatform: "", socialMediaLinks: "" },
  });

  const submit = async (values: PaidPromotionValues) => {
    const payload: PaidPromotionRequestPayload = { ...values, dob: new Date(values.dob).toISOString() };
    const result = await submitPaidPromotionRequestAction(payload);
    if (result?.status !== "7400") {
      toast.error(result?.message || "Unable to submit paid promotion request");
      return;
    }
    toast.success(result?.message || "Paid promotion request submitted successfully");
    router.push("/settings/paid-promotions");
    router.refresh();
  };

  return (
    <>
      {form.formState.isSubmitting ? <TransparentLoader text="Submitting paid promotion request" /> : null}
      <RequestFormShell title="Paid Promotion" description="Get paid for promoting products, events and community awareness." backHref="/settings/paid-promotions" accent="paid-promotions">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-5">
          <p className="text-sm font-medium text-light-900">Name</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormInput form={form} formLabel="First Name" inputName="firstName" inputType="text" placeholder="First Name" />
            <FormInput form={form} formLabel="Last Name" inputName="lastName" inputType="text" placeholder="Last Name" />
          </div>
          <DateField form={form} name="dob" label="DOB" max={today()} />
          <FormInput form={form} formLabel="Profession" inputName="profession" inputType="text" placeholder="Profession" />
          <FormInput form={form} formLabel="TE profile username" inputName="teProfileUsername" inputType="text" placeholder="TE profile username" />
          <FormInput form={form} formLabel="Skills" inputName="skills" inputType="text" placeholder="Skills" />
          <FormInput form={form} formLabel="Height" inputName="height" inputType="text" placeholder="Height" />
          <FormInput form={form} formLabel="Ethnic" inputName="ethnic" inputType="text" placeholder="Ethnic" />
          <FormInput form={form} formLabel="Language" inputName="language" inputType="text" placeholder="Language" />
          <FormInput form={form} formLabel="Location" inputName="location" inputType="text" placeholder="Location" />
          <FormInput form={form} formLabel="Contact Info" inputName="contactInfo" inputType="text" placeholder="Contact Info (Email or Phone)" />
          <TextArea form={form} formLabel="Previous Experience" inputName="previousExperience" placeholder="Previous Experience" className="min-h-32" />
          <FormInput form={form} formLabel="Availability" inputName="availability" inputType="text" placeholder="Availability" />
          <FormInput form={form} formLabel="Expected pay per post" inputName="expectedPayPerPost" inputType="number" placeholder="Expected pay per post" />
          <TextArea form={form} formLabel="Followers in different platforms" inputName="followersByPlatform" placeholder="Followers in different platforms - please state" className="min-h-32" />
          <TextArea form={form} formLabel="Social media links" inputName="socialMediaLinks" placeholder="Social media links of all platforms" className="min-h-32" />
          <SubmitButton loading={form.formState.isSubmitting} label="Submit Request" accent="paid-promotions" />
          </form>
        </Form>
      </RequestFormShell>
    </>
  );
}

function SubmitButton({ loading, label, accent }: { loading: boolean; label: string; accent: Feature }) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className={`mt-1 w-full rounded-2xl py-6 text-base font-semibold text-light-900 ${
        accent === "advertisement" ? "bg-primary-500 hover:bg-primary-500/90" : "bg-[#B4235A] hover:bg-[#B4235A]/90"
      }`}
    >
      {loading ? "Submitting..." : label}
    </Button>
  );
}

function RequestFormShell({
  title,
  description,
  backHref,
  accent,
  children,
}: {
  title: string;
  description: string;
  backHref: string;
  accent: Feature;
  children: ReactNode;
}) {
  const isAdvertisement = accent === "advertisement";
  return (
    <section className="w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link href={backHref} className="mb-5 inline-flex items-center gap-2 text-sm text-light-500 transition hover:text-light-900">
        <ChevronLeft size={18} /> Back to requests
      </Link>
      <div className={`rounded-[32px] border bg-dark-250 p-5 sm:p-7 ${isAdvertisement ? "border-dark-300" : "border-[#B4235A]/30"}`}>
        <div className="mb-7 flex items-start gap-4">
          <div className={`rounded-2xl p-3 ${isAdvertisement ? "bg-primary-500/15 text-primary-500" : "bg-[#B4235A]/15 text-[#E66B9D]"}`}>
            {isAdvertisement ? <Megaphone size={23} /> : <BadgeDollarSign size={23} />}
          </div>
          <div>
            <h1 className={`text-2xl font-semibold ${isAdvertisement ? "text-light-900" : "text-[#E66B9D]"}`}>{title}</h1>
            <p className="pt-1 text-sm leading-6 text-light-500">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function RequestList({ feature }: { feature: Feature }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdvertisement = feature === "advertisement";
  const featureName = isAdvertisement ? "Advertisement" : "Paid Promotion";
  const formHref = isAdvertisement ? "/settings/advertisement/request" : "/settings/paid-promotions/request";

  const load = useCallback(async () => {
    setLoading(true);
    const requests = isAdvertisement
      ? await getAdvertisementRequestsAction()
      : await getPaidPromotionRequestsAction();
    setItems(Array.isArray(requests) ? requests : []);
    setLoading(false);
  }, [isAdvertisement]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="flex w-full max-w-7xl gap-6 px-4 py-8 sm:px-6">
      <div className="min-w-0 flex-1">
        <div className={`rounded-[32px] border bg-dark-250 p-5 sm:p-6 ${isAdvertisement ? "border-dark-300" : "border-[#B4235A]/30"}`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className={`rounded-2xl p-3 ${isAdvertisement ? "bg-primary-500/15 text-primary-500" : "bg-[#B4235A]/15 text-[#E66B9D]"}`}>
                {isAdvertisement ? <Megaphone size={24} /> : <BadgeDollarSign size={24} />}
              </div>
              <div>
                <h1 className={`text-2xl font-semibold sm:text-3xl ${isAdvertisement ? "text-light-900" : "text-[#E66B9D]"}`}>{featureName}</h1>
                <p className="pt-1 text-sm leading-6 text-light-500">
                  {isAdvertisement
                    ? "Request an advertisement placement and keep track of your submitted requests."
                    : "Get paid for promoting products, events and community awareness."}
                </p>
              </div>
            </div>
            <Button asChild className={`rounded-2xl px-5 py-6 text-light-900 ${isAdvertisement ? "bg-primary-500 hover:bg-primary-500/90" : "bg-[#B4235A] hover:bg-[#B4235A]/90"}`}>
              <Link href={formHref}>{isAdvertisement ? "Request Advertisement" : "Request Paid Promotion"}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-light-900">Your requests</h2>
          <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={load} className="gap-2 text-light-500 hover:bg-dark-250 hover:text-light-900">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {loading ? (
            <div className="col-span-full rounded-[28px] border border-dark-300 bg-dark-250 p-8 text-center text-sm text-light-500">Loading requests...</div>
          ) : items.length ? (
            items.map((item, index) => <RequestCard key={item?._id || item?.id || index} item={item} feature={feature} />)
          ) : (
            <div className="col-span-full"><EmptyState feature={feature} /></div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function PromotionRequests({ feature, view }: { feature: Feature; view: View }) {
  if (view === "form") {
    return feature === "advertisement" ? <AdvertisementForm /> : <PaidPromotionForm />;
  }
  return <RequestList feature={feature} />;
}
